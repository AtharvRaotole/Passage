"""Digital will ORM model."""

from datetime import datetime
from typing import Any, Optional
import uuid

from sqlalchemy import DateTime, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from db.base import Base


class DigitalWill(Base):
    __tablename__ = "digital_wills"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_address: Mapped[str] = mapped_column(String(42), nullable=False, index=True)
    website_url: Mapped[str] = mapped_column(Text, nullable=False)
    username: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    encrypted_password: Mapped[str] = mapped_column(Text, nullable=False)
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)
    encrypted_symmetric_key: Mapped[str] = mapped_column(Text, nullable=False)
    access_control_conditions: Mapped[list[Any]] = mapped_column(JSONB, nullable=False)
    instruction: Mapped[str] = mapped_column(Text, nullable=False)
    totp_secret: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    def to_dict(self, include_secrets: bool = False) -> dict:
        """Serialize to dict. Secrets omitted unless include_secrets=True."""
        data = {
            "id": str(self.id),
            "userAddress": self.user_address,
            "websiteUrl": self.website_url,
            "username": self.username or "",
            "instruction": self.instruction,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }
        if include_secrets:
            data.update(
                {
                    "encryptedPassword": self.encrypted_password,
                    "passwordHash": self.password_hash,
                    "encryptedSymmetricKey": self.encrypted_symmetric_key,
                    "accessControlConditions": self.access_control_conditions,
                    "totpSecret": self.totp_secret,
                }
            )
        return data
