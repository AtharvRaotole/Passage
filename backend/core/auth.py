"""
API key authentication for sensitive endpoints.
"""

from typing import Optional

from fastapi import HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from core.config import settings

_bearer_scheme = HTTPBearer(auto_error=False)


async def verify_api_key(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(_bearer_scheme),
) -> None:
    """
    Require Bearer token matching settings.API_KEY when configured.
    Skips validation when API_KEY is unset (local development).
    """
    if not settings.API_KEY:
        return

    if credentials is None or credentials.credentials != settings.API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API key",
            headers={"WWW-Authenticate": "Bearer"},
        )
