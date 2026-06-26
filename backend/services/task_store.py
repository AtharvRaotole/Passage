"""
Execution ID to Celery task ID mapping with Redis persistence.
"""

import logging
from typing import Optional

from services.redis_client import get_redis_client

logger = logging.getLogger(__name__)

_EXECUTION_KEY_PREFIX = "execution:"
_EXECUTION_TTL_SECONDS = 86400  # 24 hours

# In-memory fallback when Redis is unavailable
_memory_store: dict[str, str] = {}


def _redis_key(execution_id: str) -> str:
    return f"{_EXECUTION_KEY_PREFIX}{execution_id}:task_id"


def set_task_id_mapping(execution_id: str, task_id: str) -> None:
    """Store mapping between execution_id and Celery task_id."""
    client = get_redis_client()
    if client:
        try:
            client.setex(_redis_key(execution_id), _EXECUTION_TTL_SECONDS, task_id)
            return
        except Exception as exc:
            logger.warning("Redis set failed, using memory fallback: %s", exc)

    _memory_store[execution_id] = task_id


def get_task_id_by_execution_id(execution_id: str) -> Optional[str]:
    """Get Celery task ID by execution ID."""
    client = get_redis_client()
    if client:
        try:
            value = client.get(_redis_key(execution_id))
            if value:
                return value
        except Exception as exc:
            logger.warning("Redis get failed, using memory fallback: %s", exc)

    return _memory_store.get(execution_id)


def clear_task_mappings() -> None:
    """Clear in-memory mappings (for tests)."""
    _memory_store.clear()
