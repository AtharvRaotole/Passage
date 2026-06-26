"""
Shared Redis client for task mapping and will storage.
Falls back gracefully when Redis is unavailable.
"""

import logging
from typing import Optional

logger = logging.getLogger(__name__)

try:
    import redis
except ImportError:
    redis = None  # type: ignore

from core.config import settings

logger = logging.getLogger(__name__)

_client: Optional[redis.Redis] = None
_redis_available: Optional[bool] = None


def get_redis_client() -> Optional["redis.Redis"]:
    """Return a Redis client or None if connection fails."""
    global _client, _redis_available

    if redis is None:
        return None

    if _redis_available is False:
        return None

    if _client is not None:
        return _client

    try:
        _client = redis.from_url(
            settings.CELERY_BROKER_URL,
            decode_responses=True,
            socket_connect_timeout=2,
        )
        _client.ping()
        _redis_available = True
        logger.info("Redis client connected")
        return _client
    except Exception as exc:
        logger.warning("Redis unavailable, using in-memory fallback: %s", exc)
        _redis_available = False
        _client = None
        return None


def reset_redis_client() -> None:
    """Reset client state (for tests)."""
    global _client, _redis_available
    _client = None
    _redis_available = None
