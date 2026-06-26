"""Privy access token verification for FastAPI routes."""

from __future__ import annotations

import base64
import logging
from dataclasses import dataclass
from typing import Optional

import httpx
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from core.config import settings

logger = logging.getLogger(__name__)

_bearer = HTTPBearer(auto_error=False)
_cached_verification_key: Optional[str] = None


@dataclass
class PrivyUserClaims:
    privy_user_id: str
    session_id: Optional[str] = None
    app_id: Optional[str] = None


def _normalize_pem(key: str) -> str:
    return key.replace("\\n", "\n").strip()


async def _fetch_verification_key() -> str:
    global _cached_verification_key

    if settings.PRIVY_JWT_VERIFICATION_KEY:
        return _normalize_pem(settings.PRIVY_JWT_VERIFICATION_KEY)

    if _cached_verification_key:
        return _cached_verification_key

    if not settings.PRIVY_APP_ID or not settings.PRIVY_APP_SECRET:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Privy verification is not configured",
        )

    credentials = base64.b64encode(
        f"{settings.PRIVY_APP_ID}:{settings.PRIVY_APP_SECRET}".encode()
    ).decode()
    url = f"https://auth.privy.io/api/v1/apps/{settings.PRIVY_APP_ID}"

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(
            url,
            headers={"Authorization": f"Basic {credentials}"},
        )
        if response.status_code != 200:
            logger.error("Failed to fetch Privy verification key: %s", response.text)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Unable to fetch Privy verification key",
            )
        data = response.json()
        verification_key = data.get("verification_key")
        if not verification_key:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Privy verification key missing from app config",
            )

    _cached_verification_key = _normalize_pem(verification_key)
    return _cached_verification_key


async def verify_privy_access_token(access_token: str) -> PrivyUserClaims:
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing access token",
        )

    if not settings.PRIVY_APP_ID:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="PRIVY_APP_ID is not configured",
        )

    has_verifier = bool(
        settings.PRIVY_JWT_VERIFICATION_KEY
        or (settings.PRIVY_APP_ID and settings.PRIVY_APP_SECRET)
    )
    if not has_verifier and not settings.DEBUG:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Privy verification credentials are not configured",
        )

    verification_key = await _fetch_verification_key()

    try:
        payload = jwt.decode(
            access_token,
            verification_key,
            algorithms=["ES256"],
            issuer="privy.io",
            audience=settings.PRIVY_APP_ID,
        )
    except jwt.ExpiredSignatureError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Access token expired",
        ) from exc
    except jwt.InvalidTokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid access token: {exc}",
        ) from exc

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing subject claim",
        )

    return PrivyUserClaims(
        privy_user_id=user_id,
        session_id=payload.get("sid"),
        app_id=payload.get("aud"),
    )


async def get_current_privy_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer),
) -> PrivyUserClaims:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Bearer token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return await verify_privy_access_token(credentials.credentials)
