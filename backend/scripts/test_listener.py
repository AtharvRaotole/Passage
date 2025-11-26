"""
Test script to manually trigger DECEASED status processing
This simulates what happens when mockOracleResponse(true) is called
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from services.database import digital_will_service
from services.blockchain_listener import blockchain_listener
from services.lit_decrypt import lit_decryption_service


async def test_deceased_processing():
    """Test the deceased status processing flow"""
    
    # Test user address
    test_user = "0x1234567890123456789012345678901234567890"
    
    print("=" * 60)
    print("Testing DECEASED Status Processing")
    print("=" * 60)
    
    # 1. Create a test digital will entry
    print("\n1. Creating test digital will entry...")
    test_will = {
        "websiteUrl": "https://example.com",
        "username": "testuser",
        "encryptedPassword": "encrypted_password_placeholder",
        "passwordHash": "hash_placeholder",
        "instruction": "Delete my account",
        "totpSecret": "JBSWY3DPEHPK3PXP",  # Test TOTP secret
    }
    
    will_id = digital_will_service.save_will(test_user, test_will)
    print(f"   ✓ Created will entry: {will_id}")
    
    # 2. Simulate StatusChanged event
    print("\n2. Simulating StatusChanged event (DECEASED)...")
    await blockchain_listener._handle_status_changed(
        user_address=test_user,
        old_status=1,  # PENDING_VERIFICATION
        new_status=2,  # DECEASED
    )
    
    print("\n3. Test completed!")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(test_deceased_processing())

