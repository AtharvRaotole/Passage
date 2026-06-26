"""
Digital Will storage — Postgres with in-memory fallback when DATABASE_URL is unset.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
import logging
import uuid

from sqlalchemy import select

from core.config import settings
from db.models.digital_will import DigitalWill
from db.session import get_session_factory

logger = logging.getLogger(__name__)

_memory_db: List[Dict[str, Any]] = []


def _normalize_address(user_address: str) -> str:
    return user_address.lower()


def _will_data_to_model(user_address: str, will_data: Dict[str, Any]) -> DigitalWill:
    return DigitalWill(
        user_address=_normalize_address(user_address),
        website_url=will_data["websiteUrl"],
        username=will_data.get("username", ""),
        encrypted_password=will_data["encryptedPassword"],
        password_hash=will_data["passwordHash"],
        encrypted_symmetric_key=will_data["encryptedSymmetricKey"],
        access_control_conditions=will_data["accessControlConditions"],
        instruction=will_data["instruction"],
        totp_secret=will_data.get("totpSecret"),
    )


class DigitalWillService:
    """Async service for managing Digital Will entries."""

    @staticmethod
    def _use_postgres() -> bool:
        return bool(settings.DATABASE_URL and get_session_factory())

    @staticmethod
    async def save_will(user_address: str, will_data: Dict[str, Any]) -> str:
        if DigitalWillService._use_postgres():
            factory = get_session_factory()
            assert factory is not None
            async with factory() as session:
                entry = _will_data_to_model(user_address, will_data)
                session.add(entry)
                await session.commit()
                await session.refresh(entry)
                logger.info("[DB] Saved digital will for %s: %s", user_address, entry.id)
                return str(entry.id)

        will_entry = {
            "id": f"will_{len(_memory_db) + 1}",
            "userAddress": _normalize_address(user_address),
            "websiteUrl": will_data["websiteUrl"],
            "username": will_data.get("username", ""),
            "encryptedPassword": will_data["encryptedPassword"],
            "passwordHash": will_data["passwordHash"],
            "encryptedSymmetricKey": will_data["encryptedSymmetricKey"],
            "accessControlConditions": will_data["accessControlConditions"],
            "instruction": will_data["instruction"],
            "createdAt": will_data.get("createdAt", datetime.utcnow().isoformat()),
            "totpSecret": will_data.get("totpSecret"),
        }
        _memory_db.append(will_entry)
        logger.info("[DB] Saved digital will (memory) for %s: %s", user_address, will_entry["id"])
        return will_entry["id"]

    @staticmethod
    async def get_wills_by_user(
        user_address: str, include_secrets: bool = True
    ) -> List[Dict[str, Any]]:
        addr = _normalize_address(user_address)

        if DigitalWillService._use_postgres():
            factory = get_session_factory()
            assert factory is not None
            async with factory() as session:
                result = await session.execute(
                    select(DigitalWill)
                    .where(DigitalWill.user_address == addr)
                    .order_by(DigitalWill.created_at.desc())
                )
                rows = result.scalars().all()
                logger.info("[DB] Found %d will(s) for %s", len(rows), user_address)
                return [r.to_dict(include_secrets=include_secrets) for r in rows]

        user_wills = [w for w in _memory_db if w["userAddress"] == addr]
        logger.info("[DB] Found %d will(s) (memory) for %s", len(user_wills), user_address)
        if not include_secrets:
            return [
                {
                    "id": w["id"],
                    "userAddress": w["userAddress"],
                    "websiteUrl": w["websiteUrl"],
                    "username": w.get("username", ""),
                    "instruction": w["instruction"],
                    "createdAt": w.get("createdAt"),
                }
                for w in user_wills
            ]
        return user_wills

    @staticmethod
    async def get_will_by_id(
        will_id: str, include_secrets: bool = True
    ) -> Optional[Dict[str, Any]]:
        will_uuid: Optional[uuid.UUID] = None
        if DigitalWillService._use_postgres():
            try:
                will_uuid = uuid.UUID(will_id)
            except ValueError:
                return None

        if DigitalWillService._use_postgres() and will_uuid is not None:
            factory = get_session_factory()
            assert factory is not None
            async with factory() as session:
                result = await session.execute(
                    select(DigitalWill).where(DigitalWill.id == will_uuid)
                )
                row = result.scalar_one_or_none()
                if row is None:
                    return None
                return row.to_dict(include_secrets=include_secrets)

        for will in _memory_db:
            if will["id"] == will_id:
                if not include_secrets:
                    return {
                        "id": will["id"],
                        "userAddress": will["userAddress"],
                        "websiteUrl": will["websiteUrl"],
                        "username": will.get("username", ""),
                        "instruction": will["instruction"],
                        "createdAt": will.get("createdAt"),
                    }
                return will
        return None

    @staticmethod
    async def delete_will(will_id: str, user_address: str) -> bool:
        addr = _normalize_address(user_address)

        if DigitalWillService._use_postgres():
            try:
                will_uuid = uuid.UUID(will_id)
            except ValueError:
                return False
            factory = get_session_factory()
            assert factory is not None
            async with factory() as session:
                result = await session.execute(
                    select(DigitalWill).where(
                        DigitalWill.id == will_uuid,
                        DigitalWill.user_address == addr,
                    )
                )
                row = result.scalar_one_or_none()
                if row is None:
                    return False
                await session.delete(row)
                await session.commit()
                logger.info("[DB] Deleted will entry: %s", will_id)
                return True

        global _memory_db
        initial = len(_memory_db)
        _memory_db = [
            w
            for w in _memory_db
            if not (w["id"] == will_id and w["userAddress"] == addr)
        ]
        deleted = len(_memory_db) < initial
        if deleted:
            logger.info("[DB] Deleted will entry (memory): %s", will_id)
        return deleted

    @staticmethod
    async def clear_all() -> None:
        global _memory_db
        _memory_db.clear()
        logger.info("[DB] Cleared all will entries (memory only)")


digital_will_service = DigitalWillService()
