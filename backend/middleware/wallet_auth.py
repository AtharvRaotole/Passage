"""Wallet signature verification for will API requests."""

import re
import time
from typing import Optional

from eth_account import Account
from eth_account.messages import encode_defunct
from fastapi import HTTPException, status

AUTH_MESSAGE_PREFIX = "PassageHack Will Auth"
MAX_AGE_SECONDS = 300  # 5 minutes


def build_auth_message(address: str, timestamp: int) -> str:
    return f"{AUTH_MESSAGE_PREFIX}\naddress:{address.lower()}\ntimestamp:{timestamp}"


def verify_wallet_signature(
    user_address: str,
    signature: str,
    timestamp: int,
) -> None:
    """
    Verify EIP-191 personal_sign signature.
    Raises HTTPException on failure.
    """
    if not user_address or not re.match(r"^0x[a-fA-F0-9]{40}$", user_address):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user_address",
        )

    if not signature or not signature.startswith("0x"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid signature",
        )

    now = int(time.time())
    if abs(now - timestamp) > MAX_AGE_SECONDS:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Signature timestamp expired",
        )

    message = build_auth_message(user_address, timestamp)
    try:
        recovered = Account.recover_message(
            encode_defunct(text=message),
            signature=signature,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid signature: {exc}",
        ) from exc

    if recovered.lower() != user_address.lower():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Signature does not match user_address",
        )


def reject_plaintext_password_fields(body: dict) -> None:
    """Reject requests that include plaintext password fields."""
    forbidden = {"password", "plain_password", "plaintext_password"}
    for key in body:
        if key.lower() in forbidden:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Plaintext password fields are not allowed",
            )
