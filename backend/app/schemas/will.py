"""Pydantic schemas for digital will API."""

from datetime import datetime
from typing import Any, List, Optional

from pydantic import BaseModel, Field, field_validator


class CreateWillRequest(BaseModel):
    website_url: str = Field(..., min_length=1)
    username: str = Field(default="")
    encrypted_password: str = Field(..., min_length=1)
    password_hash: str = Field(..., min_length=1)
    encrypted_symmetric_key: str = Field(..., min_length=1)
    access_control_conditions: List[Any] = Field(default_factory=list)
    instruction: str = Field(..., min_length=1)
    totp_secret: Optional[str] = None

    @field_validator("website_url", "instruction")
    @classmethod
    def strip_whitespace(cls, v: str) -> str:
        return v.strip()


class BatchCreateWillsRequest(BaseModel):
    wills: List[CreateWillRequest] = Field(..., max_length=20)


class WillAuthHeaders(BaseModel):
    """Parsed from X-Will-Address, X-Will-Signature, X-Will-Timestamp headers."""

    user_address: str
    signature: str
    timestamp: int


class WillResponse(BaseModel):
    id: str
    website_url: str
    username: str
    instruction: str
    created_at: datetime


class WillListResponse(BaseModel):
    wills: List[WillResponse]
    total: int


def will_dict_to_response(w: dict) -> WillResponse:
    created = w.get("createdAt") or w.get("created_at")
    if isinstance(created, str):
        created_at = datetime.fromisoformat(created.replace("Z", "+00:00"))
    else:
        created_at = created or datetime.utcnow()

    return WillResponse(
        id=str(w["id"]),
        website_url=w.get("websiteUrl") or w.get("website_url", ""),
        username=w.get("username") or "",
        instruction=w.get("instruction") or "",
        created_at=created_at,
    )


def create_request_to_will_data(req: CreateWillRequest) -> dict:
    return {
        "websiteUrl": req.website_url,
        "username": req.username,
        "encryptedPassword": req.encrypted_password,
        "passwordHash": req.password_hash,
        "encryptedSymmetricKey": req.encrypted_symmetric_key,
        "accessControlConditions": req.access_control_conditions,
        "instruction": req.instruction,
        "totpSecret": req.totp_secret,
    }
