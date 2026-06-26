"""User profile and onboarding ORM models."""

from datetime import datetime
from typing import Optional
import uuid

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    privy_user_id: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    wallet_address: Mapped[str] = mapped_column(String(42), unique=True, nullable=False, index=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    display_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    persona: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    heartbeat_interval_days: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    required_confirmations: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    guardian_template: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    onboarding_completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    guardians: Mapped[list["UserGuardian"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    accounts: Mapped[list["UserAccount"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    instructions: Mapped[list["UserInstruction"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )


class UserGuardian(Base):
    __tablename__ = "user_guardians"
    __table_args__ = (
        UniqueConstraint("user_id", "position", name="uq_user_guardian_position"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    guardian_address: Mapped[str] = mapped_column(String(42), nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False)

    user: Mapped["User"] = relationship(back_populates="guardians")


class UserAccount(Base):
    __tablename__ = "user_accounts"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    service: Mapped[str] = mapped_column(String(255), nullable=False)
    username: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[str] = mapped_column(String(16), nullable=False)
    imported: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    user: Mapped["User"] = relationship(back_populates="accounts")


class UserInstruction(Base):
    __tablename__ = "user_instructions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    service: Mapped[str] = mapped_column(String(255), nullable=False)
    instruction: Mapped[str] = mapped_column(Text, nullable=False)

    user: Mapped["User"] = relationship(back_populates="instructions")
