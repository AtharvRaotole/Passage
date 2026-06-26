"""User profile and onboarding persistence."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, Optional
import logging

from fastapi import HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.orm import selectinload

from db.models.user import User, UserAccount, UserGuardian, UserInstruction
from db.session import get_session_factory

logger = logging.getLogger(__name__)


def _normalize_address(address: str) -> str:
    return address.lower()


def _user_to_profile_dict(user: User) -> Dict[str, Any]:
    return {
        "id": str(user.id),
        "privyUserId": user.privy_user_id,
        "walletAddress": user.wallet_address,
        "email": user.email,
        "displayName": user.display_name,
        "persona": user.persona,
        "heartbeatIntervalDays": user.heartbeat_interval_days,
        "requiredConfirmations": user.required_confirmations,
        "guardianTemplate": user.guardian_template,
        "onboardingCompleted": user.onboarding_completed_at is not None,
        "onboardingCompletedAt": (
            user.onboarding_completed_at.isoformat()
            if user.onboarding_completed_at
            else None
        ),
        "createdAt": user.created_at.isoformat() if user.created_at else None,
        "updatedAt": user.updated_at.isoformat() if user.updated_at else None,
    }


def _user_to_onboarding_dict(user: User) -> Dict[str, Any]:
    profile = _user_to_profile_dict(user)
    profile.update(
        {
            "guardians": [
                {"address": g.guardian_address, "position": g.position}
                for g in sorted(user.guardians, key=lambda x: x.position)
            ],
            "accounts": [
                {
                    "service": a.service,
                    "username": a.username,
                    "type": a.type,
                    "imported": a.imported,
                }
                for a in user.accounts
            ],
            "instructions": [
                {"service": i.service, "instruction": i.instruction}
                for i in user.instructions
            ],
        }
    )
    return profile


class UserService:
    @staticmethod
    def _require_db():
        factory = get_session_factory()
        if factory is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database is not configured",
            )
        return factory

    @staticmethod
    async def upsert_user_from_privy(
        privy_user_id: str,
        wallet_address: str,
        email: Optional[str] = None,
        display_name: Optional[str] = None,
    ) -> Dict[str, Any]:
        factory = UserService._require_db()
        wallet = _normalize_address(wallet_address)

        async with factory() as session:
            result = await session.execute(
                select(User)
                .where(User.privy_user_id == privy_user_id)
                .options(
                    selectinload(User.guardians),
                    selectinload(User.accounts),
                    selectinload(User.instructions),
                )
            )
            user = result.scalar_one_or_none()

            if user is None:
                result = await session.execute(
                    select(User).where(User.wallet_address == wallet)
                )
                user = result.scalar_one_or_none()

            if user is None:
                user = User(
                    privy_user_id=privy_user_id,
                    wallet_address=wallet,
                    email=email,
                    display_name=display_name,
                )
                session.add(user)
            else:
                user.privy_user_id = privy_user_id
                user.wallet_address = wallet
                if email:
                    user.email = email
                if display_name:
                    user.display_name = display_name

            await session.commit()
            await session.refresh(user)
            logger.info("[DB] Upserted user %s (%s)", user.id, wallet)
            return _user_to_profile_dict(user)

    @staticmethod
    async def get_user_by_privy_id(privy_user_id: str) -> Optional[User]:
        factory = get_session_factory()
        if factory is None:
            return None
        async with factory() as session:
            result = await session.execute(
                select(User)
                .where(User.privy_user_id == privy_user_id)
                .options(
                    selectinload(User.guardians),
                    selectinload(User.accounts),
                    selectinload(User.instructions),
                )
            )
            return result.scalar_one_or_none()

    @staticmethod
    async def get_profile_by_privy_id(privy_user_id: str) -> Dict[str, Any]:
        user = await UserService.get_user_by_privy_id(privy_user_id)
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found — call /api/users/sync first",
            )
        return _user_to_profile_dict(user)

    @staticmethod
    async def get_onboarding_by_privy_id(privy_user_id: str) -> Dict[str, Any]:
        user = await UserService.get_user_by_privy_id(privy_user_id)
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found — call /api/users/sync first",
            )
        return _user_to_onboarding_dict(user)

    @staticmethod
    async def save_onboarding(
        privy_user_id: str,
        wallet_address: str,
        payload: Dict[str, Any],
    ) -> Dict[str, Any]:
        factory = UserService._require_db()
        wallet = _normalize_address(wallet_address)

        async with factory() as session:
            result = await session.execute(
                select(User)
                .where(User.privy_user_id == privy_user_id)
                .options(
                    selectinload(User.guardians),
                    selectinload(User.accounts),
                    selectinload(User.instructions),
                )
            )
            user = result.scalar_one_or_none()
            if user is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User not found — call /api/users/sync first",
                )

            if user.wallet_address != wallet:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Wallet address does not match authenticated user",
                )

            user.persona = payload.get("persona")
            user.heartbeat_interval_days = payload.get("heartbeat_interval_days")
            user.required_confirmations = payload.get("required_confirmations")
            user.guardian_template = payload.get("guardian_template")
            user.onboarding_completed_at = datetime.now(timezone.utc)

            await session.execute(
                delete(UserGuardian).where(UserGuardian.user_id == user.id)
            )
            await session.execute(
                delete(UserAccount).where(UserAccount.user_id == user.id)
            )
            await session.execute(
                delete(UserInstruction).where(UserInstruction.user_id == user.id)
            )
            await session.flush()

            for idx, address in enumerate(payload.get("guardians", [])):
                session.add(
                    UserGuardian(
                        user_id=user.id,
                        guardian_address=_normalize_address(address),
                        position=idx,
                    )
                )

            for account in payload.get("accounts", []):
                session.add(
                    UserAccount(
                        user_id=user.id,
                        service=account["service"],
                        username=account["username"],
                        type=account.get("type", "manual"),
                        imported=bool(account.get("imported", False)),
                    )
                )

            for instruction in payload.get("instructions", []):
                session.add(
                    UserInstruction(
                        user_id=user.id,
                        service=instruction["service"],
                        instruction=instruction["instruction"],
                    )
                )

            await session.commit()
            await session.refresh(user)
            logger.info("[DB] Saved onboarding for user %s", user.id)

            return {
                **_user_to_profile_dict(user),
                "guardians": [
                    {
                        "address": _normalize_address(address),
                        "position": idx,
                    }
                    for idx, address in enumerate(payload.get("guardians", []))
                ],
                "accounts": [
                    {
                        "service": account["service"],
                        "username": account["username"],
                        "type": account.get("type", "manual"),
                        "imported": bool(account.get("imported", False)),
                    }
                    for account in payload.get("accounts", [])
                ],
                "instructions": [
                    {
                        "service": instruction["service"],
                        "instruction": instruction["instruction"],
                    }
                    for instruction in payload.get("instructions", [])
                ],
            }


user_service = UserService()
