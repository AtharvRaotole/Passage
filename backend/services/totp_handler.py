"""
TOTP (Time-based One-Time Password) handler for 2FA support
"""

import pyotp
import time
from typing import Optional


class TotpHandler:
    """Handles TOTP code generation for 2FA"""

    @staticmethod
    def generate_totp(secret: str) -> Optional[str]:
        """
        Generate a TOTP code from a secret
        
        Args:
            secret: TOTP secret (base32 encoded)
        
        Returns:
            6-digit TOTP code or None if invalid
        """
        try:
            totp = pyotp.TOTP(secret)
            code = totp.now()
            return code
        except Exception as e:
            print(f"[TOTP] Error generating code: {e}")
            return None

    @staticmethod
    def verify_totp(secret: str, code: str) -> bool:
        """
        Verify a TOTP code
        
        Args:
            secret: TOTP secret
            code: Code to verify
        
        Returns:
            True if code is valid
        """
        try:
            totp = pyotp.TOTP(secret)
            return totp.verify(code, valid_window=1)
        except Exception as e:
            print(f"[TOTP] Error verifying code: {e}")
            return False

    @staticmethod
    def get_totp_uri(secret: str, issuer: str, account_name: str) -> str:
        """
        Generate TOTP URI for QR code
        
        Args:
            secret: TOTP secret
            issuer: Service name
            account_name: Account identifier
        
        Returns:
            TOTP URI string
        """
        totp = pyotp.TOTP(secret)
        return totp.provisioning_uri(
            name=account_name, issuer_name=issuer
        )

