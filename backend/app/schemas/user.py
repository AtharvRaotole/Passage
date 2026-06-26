"""Pydantic schemas for user profile and onboarding API."""

from typing import List, Literal, Optional

from pydantic import BaseModel, Field


class UserSyncRequest(BaseModel):
    wallet_address: str = Field(..., alias="walletAddress")
    email: Optional[str] = None
    display_name: Optional[str] = Field(None, alias="displayName")

    model_config = {"populate_by_name": True}


class UserProfileResponse(BaseModel):
    id: str
    privy_user_id: str = Field(..., alias="privyUserId")
    wallet_address: str = Field(..., alias="walletAddress")
    email: Optional[str] = None
    display_name: Optional[str] = Field(None, alias="displayName")
    persona: Optional[str] = None
    heartbeat_interval_days: Optional[int] = Field(None, alias="heartbeatIntervalDays")
    required_confirmations: Optional[int] = Field(None, alias="requiredConfirmations")
    guardian_template: Optional[str] = Field(None, alias="guardianTemplate")
    onboarding_completed: bool = Field(..., alias="onboardingCompleted")
    onboarding_completed_at: Optional[str] = Field(None, alias="onboardingCompletedAt")
    created_at: Optional[str] = Field(None, alias="createdAt")
    updated_at: Optional[str] = Field(None, alias="updatedAt")

    model_config = {"populate_by_name": True}


class OnboardingAccountSchema(BaseModel):
    service: str
    username: str
    type: Literal["oauth", "manual"] = "manual"
    imported: bool = False


class OnboardingInstructionSchema(BaseModel):
    service: str
    instruction: str


class OnboardingSaveRequest(BaseModel):
    wallet_address: str = Field(..., alias="walletAddress")
    persona: Optional[str] = None
    heartbeat_interval_days: Optional[int] = Field(None, alias="heartbeatIntervalDays")
    required_confirmations: Optional[int] = Field(None, alias="requiredConfirmations")
    guardian_template: Optional[str] = Field(None, alias="guardianTemplate")
    guardians: List[str] = Field(default_factory=list)
    accounts: List[OnboardingAccountSchema] = Field(default_factory=list)
    instructions: List[OnboardingInstructionSchema] = Field(default_factory=list)

    model_config = {"populate_by_name": True}


class GuardianResponse(BaseModel):
    address: str
    position: int


class OnboardingAccountResponse(BaseModel):
    service: str
    username: str
    type: str
    imported: bool


class OnboardingInstructionResponse(BaseModel):
    service: str
    instruction: str


class OnboardingResponse(UserProfileResponse):
    guardians: List[GuardianResponse] = Field(default_factory=list)
    accounts: List[OnboardingAccountResponse] = Field(default_factory=list)
    instructions: List[OnboardingInstructionResponse] = Field(default_factory=list)

    model_config = {"populate_by_name": True}
