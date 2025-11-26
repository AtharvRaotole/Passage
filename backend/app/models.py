"""
Pydantic models for type validation
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List


class CreateEstateRequest(BaseModel):
    """Request model for creating a new estate"""

    user_address: str = Field(..., description="User's wallet address")
    beneficiary_address: str = Field(..., description="Beneficiary wallet address")
    heartbeat_interval: int = Field(
        ..., ge=86400, description="Heartbeat interval in seconds (minimum 1 day)"
    )
    estate_data: Dict[str, Any] = Field(..., description="Estate data to encrypt")
    access_conditions: Dict[str, Any] = Field(
        ..., description="Lit Protocol access conditions"
    )
    api_source: str = Field(..., description="API source for heartbeat verification")


class EstateResponse(BaseModel):
    """Response model for estate operations"""

    estate_id: str
    encrypted_data: str
    status: str
    created_at: Optional[str] = None
    last_heartbeat: Optional[str] = None


class HeartbeatRequest(BaseModel):
    """Request model for heartbeat verification"""

    user_address: str = Field(..., description="User's wallet address")
    api_source: str = Field(..., description="API source URL for verification")
    verification_params: Dict[str, Any] = Field(
        default_factory=dict, description="Parameters for verification"
    )


class HeartbeatResponse(BaseModel):
    """Response model for heartbeat verification"""

    verified: bool
    timestamp: str
    details: Dict[str, Any] = Field(default_factory=dict)


class AgentTaskRequest(BaseModel):
    """Request model for agent task execution"""

    task_description: str = Field(..., description="Description of the task to execute")
    context: Dict[str, Any] = Field(
        default_factory=dict, description="Additional context for the task"
    )


class AgentTaskResponse(BaseModel):
    """Response model for agent task execution"""

    success: bool
    output: str
    screenshots: List[str] = Field(default_factory=list)

