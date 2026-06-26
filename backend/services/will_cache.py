"""Redis cache for digital will list responses."""

import json
import logging
from typing import Any, Dict, List, Optional

import redis.asyncio as aioredis

from core.config import settings

logger = logging.getLogger(__name__)

WILL_CACHE_TTL = 60
_redis_client: Optional[aioredis.Redis] = None


async def get_redis() -> Optional[aioredis.Redis]:
    global _redis_client
    if _redis_client is not None:
        return _redis_client
    try:
        _redis_client = aioredis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
        )
        await _redis_client.ping()
        return _redis_client
    except Exception as exc:
        logger.warning("Redis unavailable, cache disabled: %s", exc)
        _redis_client = None
        return None


def _cache_key(user_address: str) -> str:
    return f"wills:{user_address.lower()}"


async def get_cached_wills(user_address: str) -> Optional[List[Dict[str, Any]]]:
    client = await get_redis()
    if client is None:
        return None
    try:
        raw = await client.get(_cache_key(user_address))
        if raw is None:
            return None
        return json.loads(raw)
    except Exception as exc:
        logger.warning("Cache read failed: %s", exc)
        return None


async def set_cached_wills(
    user_address: str, wills: List[Dict[str, Any]]
) -> None:
    client = await get_redis()
    if client is None:
        return
    try:
        await client.setex(
            _cache_key(user_address),
            WILL_CACHE_TTL,
            json.dumps(wills),
        )
    except Exception as exc:
        logger.warning("Cache write failed: %s", exc)


async def invalidate_wills_cache(user_address: str) -> None:
    client = await get_redis()
    if client is None:
        return
    try:
        await client.delete(_cache_key(user_address))
    except Exception as exc:
        logger.warning("Cache invalidation failed: %s", exc)
