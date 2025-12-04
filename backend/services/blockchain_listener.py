"""
Blockchain event listener service for CharonSwitch contract
Listens for StatusChanged events and triggers agent execution
"""

import asyncio
import os
from web3 import Web3
try:
    from web3.middleware import geth_poa_middleware
except ImportError:
    # For newer web3.py versions, try alternative import
    try:
        from web3.middleware import ExtraDataToPOAMiddleware as geth_poa_middleware
    except ImportError:
        geth_poa_middleware = None
from typing import Dict, Any, Optional, List
from datetime import datetime
import logging

from core.config import settings
from services.database import digital_will_service
from services.lit_decrypt import lit_decryption_service
from services.notification_service import notification_service
from agent.executor import executor

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# CharonSwitch contract ABI (StatusChanged event)
CHARON_SWITCH_ABI = [
    {
        "anonymous": False,
        "inputs": [
            {
                "indexed": True,
                "internalType": "address",
                "name": "user",
                "type": "address",
            },
            {
                "indexed": False,
                "internalType": "enum CharonSwitch.UserStatus",
                "name": "oldStatus",
                "type": "uint8",
            },
            {
                "indexed": False,
                "internalType": "enum CharonSwitch.UserStatus",
                "name": "newStatus",
                "type": "uint8",
            },
        ],
        "name": "StatusChanged",
        "type": "event",
    }
]

# UserStatus enum values
USER_STATUS_ALIVE = 0
USER_STATUS_PENDING_VERIFICATION = 1
USER_STATUS_DECEASED = 2


class BlockchainListener:
    """Listens for blockchain events and triggers agent execution"""

    def __init__(self):
        self.w3: Optional[Web3] = None
        self.contract = None
        self.is_listening = False

    def _initialize_web3(self):
        """Initialize Web3 connection"""
        rpc_url = os.getenv("RPC_URL", "https://polygon-mumbai.g.alchemy.com/v2/YOUR_KEY")
        
        if not rpc_url or "YOUR_KEY" in rpc_url:
            logger.warning("RPC_URL not configured. Using default (may not work)")
            rpc_url = "https://rpc-mumbai.maticvigil.com"

        self.w3 = Web3(Web3.HTTPProvider(rpc_url))
        
        # Add PoA middleware for Polygon/Mumbai
        if geth_poa_middleware:
            self.w3.middleware_onion.inject(geth_poa_middleware, layer=0)
        
        contract_address = os.getenv(
            "CHARON_SWITCH_ADDRESS", "0x0000000000000000000000000000000000000000"
        )
        
        if contract_address == "0x0000000000000000000000000000000000000000":
            logger.error("CHARON_SWITCH_ADDRESS not configured!")
            return False

        try:
            self.contract = self.w3.eth.contract(
                address=Web3.to_checksum_address(contract_address),
                abi=CHARON_SWITCH_ABI,
            )
            logger.info(f"Connected to contract at {contract_address}")
            return True
        except Exception as e:
            logger.error(f"Failed to initialize contract: {e}")
            return False

    async def _handle_status_changed(
        self, user_address: str, old_status: int, new_status: int
    ):
        """
        Handle StatusChanged event
        
        Args:
            user_address: User's wallet address
            old_status: Previous status
            new_status: New status
        """
        logger.info(
            f"StatusChanged event detected: {user_address} "
            f"({old_status} -> {new_status})"
        )

        # Get user info to access guardian data
        try:
            user_info = self.contract.functions.getUserInfo(user_address).call()
        except Exception as e:
            logger.error(f"Failed to get user info: {e}")
            return

        # Notify guardians when status changes to PENDING_VERIFICATION
        if new_status == USER_STATUS_PENDING_VERIFICATION:
            logger.info(f"User {user_address} is now PENDING_VERIFICATION. Notifying guardians...")
            await self._notify_guardians(user_address, user_info)
            return

        # Process DECEASED status
        if new_status == USER_STATUS_DECEASED:
            logger.info(f"User {user_address} is now DECEASED. Processing digital will...")

            try:
                # Fetch user's digital wills from database
                wills = digital_will_service.get_wills_by_user(user_address)

                if not wills:
                    logger.warning(f"No digital wills found for {user_address}")
                    return

                logger.info(f"Found {len(wills)} digital will(s) for {user_address}")

                # Process each will entry
                for will in wills:
                    await self._process_will_entry(user_address, will)

            except Exception as e:
                logger.error(f"Error processing digital will for {user_address}: {e}")

    async def _process_will_entry(self, user_address: str, will: Dict[str, Any]):
        """
        Process a single digital will entry
        
        Args:
            user_address: User's wallet address
            will: Will entry dictionary
        """
        logger.info(f"Processing will entry: {will['id']}")

        try:
            # Decrypt the password using Lit Protocol
            logger.info("Decrypting credential with Lit Protocol...")
            decrypted_password = await lit_decryption_service.decrypt_credential(
                ciphertext=will["encryptedPassword"],
                data_to_encrypt_hash=will["passwordHash"],
                user_address=user_address,
            )

            if not decrypted_password:
                logger.error(f"Failed to decrypt password for will {will['id']}")
                return

            logger.info("Password decrypted successfully")

            # Prepare session data for the agent
            session_data = {
                "url": will["websiteUrl"],
                "cookies": [],  # Can be extended to store cookies
                "localStorage": {
                    "username": will["username"],
                    "password": decrypted_password,
                },
                "headers": {},
            }

            # Add TOTP secret if available
            if will.get("totpSecret"):
                logger.info("TOTP secret found, will generate codes as needed")
                session_data["totpSecret"] = will["totpSecret"]

            # Create task description
            task_description = f"""
            Execute the following instruction on {will['websiteUrl']}:
            
            {will['instruction']}
            
            You have been provided with login credentials (username and password).
            If you encounter a 2FA/TOTP screen, use the TOTP secret to generate the code.
            Complete the task as specified in the instruction.
            """

            logger.info(f"Executing task: {will['instruction']}")
            logger.info(f"Target URL: {will['websiteUrl']}")

            # Execute the task using the DigitalExecutor
            result = await executor.run_task(
                task_description=task_description,
                session_data=session_data,
            )

            if result["success"]:
                logger.info(f"Task completed successfully for will {will['id']}")
                logger.info(f"Output: {result.get('output', 'N/A')}")
            else:
                logger.error(f"Task failed for will {will['id']}: {result.get('error')}")

        except Exception as e:
            logger.error(f"Error processing will entry {will['id']}: {e}")

    async def listen_for_events(self):
        """Start listening for blockchain events"""
        if not self._initialize_web3():
            logger.error("Failed to initialize Web3, cannot start listening")
            return

        if not self.contract:
            logger.error("Contract not initialized")
            return

        self.is_listening = True
        logger.info("Starting blockchain event listener...")

        # Get the latest block to start from
        try:
            latest_block = self.w3.eth.block_number
            logger.info(f"Starting from block {latest_block}")
        except Exception as e:
            logger.error(f"Failed to get latest block: {e}")
            return

        # Create event filter
        event_signature = self.w3.keccak(
            text="StatusChanged(address,uint8,uint8)"
        ).hex()

        logger.info("Listening for StatusChanged events...")

        while self.is_listening:
            try:
                # Get new blocks
                current_block = self.w3.eth.block_number
                
                # Check for events in recent blocks (last 100 blocks)
                from_block = max(0, current_block - 100)
                to_block = current_block

                # Get events
                events = self.contract.events.StatusChanged.get_logs(
                    fromBlock=from_block, toBlock=to_block
                )

                for event in events:
                    user_address = event["args"]["user"]
                    old_status = event["args"]["oldStatus"]
                    new_status = event["args"]["newStatus"]

                    # Process event asynchronously
                    asyncio.create_task(
                        self._handle_status_changed(user_address, old_status, new_status)
                    )

                # Wait before checking again
                await asyncio.sleep(10)  # Check every 10 seconds

            except Exception as e:
                logger.error(f"Error in event loop: {e}")
                await asyncio.sleep(30)  # Wait longer on error

    async def _notify_guardians(self, user_address: str, user_info: tuple):
        """
        Send email notifications to guardians
        
        Args:
            user_address: User's wallet address
            user_info: User info tuple from contract (status, lastSeen, threshold, guardians, requiredConfirmations, confirmationCount)
        """
        try:
            # Extract guardian addresses from user_info
            # user_info structure: (status, lastSeen, threshold, guardians[3], requiredConfirmations, confirmationCount)
            guardians = user_info[3] if len(user_info) > 3 and user_info[3] else []
            last_seen = user_info[1] if len(user_info) > 1 else None
            
            verification_timestamp = None
            if last_seen:
                verification_timestamp = datetime.fromtimestamp(int(last_seen))
            
            logger.info(f"Notifying {len(guardians)} guardian(s) for user {user_address}")
            
            # In production, you would fetch guardian emails from database
            # For now, we'll use a placeholder or environment variable mapping
            guardian_emails = self._get_guardian_emails(guardians)
            
            for guardian_address in guardians:
                if guardian_address and guardian_address != "0x0000000000000000000000000000000000000000":
                    guardian_email = guardian_emails.get(guardian_address.lower())
                    
                    if guardian_email:
                        success = notification_service.send_guardian_notification(
                            guardian_email=guardian_email,
                            guardian_address=guardian_address,
                            user_address=user_address,
                            user_name=None,  # Could be fetched from database
                            verification_timestamp=verification_timestamp,
                            grace_period_hours=72,
                        )
                        if success:
                            logger.info(f"Notification sent to guardian {guardian_address}")
                        else:
                            logger.warning(f"Failed to send notification to guardian {guardian_address}")
                    else:
                        logger.warning(f"No email found for guardian {guardian_address}")
                        
        except Exception as e:
            logger.error(f"Error notifying guardians: {e}")

    def _get_guardian_emails(self, guardians: List[str]) -> Dict[str, str]:
        """
        Get guardian email addresses
        In production, this would query the database
        
        Args:
            guardians: List of guardian addresses
        
        Returns:
            Dictionary mapping guardian address to email
        """
        # For development, use environment variables
        # Format: GUARDIAN_EMAIL_0x...=email@example.com
        guardian_emails = {}
        
        for guardian in guardians:
            if guardian and guardian != "0x0000000000000000000000000000000000000000":
                env_key = f"GUARDIAN_EMAIL_{guardian.lower()}"
                email = os.getenv(env_key)
                if email:
                    guardian_emails[guardian.lower()] = email
        
        # In production, query database:
        # SELECT guardian_address, email FROM guardian_emails WHERE guardian_address IN (...)
        
        return guardian_emails

    def stop_listening(self):
        """Stop listening for events"""
        self.is_listening = False
        logger.info("Stopped blockchain event listener")


# Global listener instance
blockchain_listener = BlockchainListener()

