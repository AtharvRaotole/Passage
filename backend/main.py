"""
Project Charon - FastAPI Entry Point
Production-ready FastAPI application for digital estate management
"""

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, status, Depends, UploadFile, File, Header, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
import uvicorn
from pathlib import Path

from core.config import settings
from core.auth import verify_api_key
from agent.executor import executor
from agent.recovery_agent import recovery_agent
from services.blockchain_listener import blockchain_listener
from services.websocket_manager import websocket_manager
from services.screenshot_service import screenshot_service
from services.ipfs_service import IPFSService
from services.tasks import execute_ai_task
from services.task_store import get_task_id_by_execution_id, set_task_id_mapping
from services.database import digital_will_service
from services.will_cache import (
    get_cached_wills,
    set_cached_wills,
    invalidate_wills_cache,
)
from middleware.wallet_auth import verify_wallet_signature, reject_plaintext_password_fields
from app.schemas.will import (
    CreateWillRequest,
    BatchCreateWillsRequest,
    WillListResponse,
    WillResponse,
    will_dict_to_response,
    create_request_to_will_data,
)
from core.celery_app import celery_app
from fastapi import UploadFile, File
import asyncio
import uuid
import logging
import tempfile
from celery.result import AsyncResult

from db.session import init_db

logger = logging.getLogger(__name__)

_will_create_counts: Dict[str, list] = {}
WILL_CREATE_LIMIT = 30


def _check_will_rate_limit(user_address: str) -> None:
    import time

    now = time.time()
    key = user_address.lower()
    window = [t for t in _will_create_counts.get(key, []) if now - t < 60]
    if len(window) >= WILL_CREATE_LIMIT:
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    window.append(now)
    _will_create_counts[key] = window


def _parse_will_auth(
    x_will_address: Optional[str],
    x_will_signature: Optional[str],
    x_will_timestamp: Optional[str],
) -> str:
    if not x_will_address or not x_will_signature or not x_will_timestamp:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing wallet auth headers",
        )
    try:
        ts = int(x_will_timestamp)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid timestamp",
        ) from exc
    verify_wallet_signature(x_will_address, x_will_signature, ts)
    return x_will_address


# Initialize FastAPI app
app = FastAPI(
    title=settings.API_TITLE,
    version=settings.API_VERSION,
    description=settings.API_DESCRIPTION,
    debug=settings.DEBUG,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request/Response Models
class ExecuteRequest(BaseModel):
    """Request model for task execution"""

    task_description: str = Field(
        ..., description="Description of the task to execute"
    )
    session_data: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Optional session data including cookies, localStorage, sessionStorage, headers, and url",
    )

    class Config:
        json_schema_extra = {
            "example": {
                "task_description": "Navigate to example.com and check my account balance",
                "session_data": {
                    "url": "https://example.com",
                    "cookies": [
                        {
                            "name": "session_id",
                            "value": "abc123",
                            "domain": ".example.com",
                            "path": "/",
                        }
                    ],
                    "localStorage": {"auth_token": "xyz789"},
                    "headers": {"Authorization": "Bearer token123"},
                },
            }
        }


class ExecuteResponse(BaseModel):
    """Response model for task execution"""

    success: bool = Field(..., description="Whether the task succeeded")
    output: Optional[str] = Field(None, description="Task execution output")
    error: Optional[str] = Field(None, description="Error message if task failed")
    execution_id: Optional[str] = Field(None, description="Execution ID for WebSocket tracking")


class RecoverySearchRequest(BaseModel):
    """Request model for recovery search"""

    name: str = Field(..., description="Full name of the deceased")
    ssn: Optional[str] = Field(None, description="Social Security Number (optional)")
    last_address: Optional[str] = Field(
        None, description="Last known address (optional)"
    )
    sources: Optional[list[str]] = Field(
        default=["all"],
        description="Sources to search: 'missingmoney', 'naic', 'treasury', or 'all'",
    )


class PrefillClaimFormRequest(BaseModel):
    """Request model for pre-filling claim forms"""

    form_path: str = Field(..., description="Path to the claim form")
    beneficiary_data: Dict[str, Any] = Field(
        ...,
        description="Beneficiary information: name, address, phone, email, relationship, ssn",
    )


# API Endpoints
@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "ok",
        "service": settings.API_TITLE,
        "version": settings.API_VERSION,
    }


@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "service": settings.API_TITLE,
        "version": settings.API_VERSION,
        "agent_initialized": executor._initialized,
    }


@app.post("/execute", status_code=status.HTTP_202_ACCEPTED, dependencies=[Depends(verify_api_key)])
async def execute_task(request: ExecuteRequest):
    """
    Execute a task using the DigitalExecutor AI agent (Background Job)

    This endpoint accepts a task description and optional session data
    (cookies, tokens, etc.) to execute tasks in a browser context with
    authenticated sessions. The task is queued and executed in the background.
    
    Returns 202 Accepted immediately with execution_id for tracking.
    """
    execution_id = str(uuid.uuid4())
    
    # Queue the task in Celery
    task = execute_ai_task.delay(
        task_description=request.task_description,
        session_data=request.session_data,
        execution_id=execution_id,
    )
    
    # Store mapping for status lookup
    set_task_id_mapping(execution_id, task.id)
    
    logger.info(f"Task queued: {execution_id}, Celery task ID: {task.id}")
    
    # Return 202 Accepted with execution ID
    return JSONResponse(
        status_code=status.HTTP_202_ACCEPTED,
        content={
            "success": True,
            "message": "Task queued for execution",
            "execution_id": execution_id,
            "task_id": task.id,
            "status_url": f"/api/tasks/{execution_id}/status",
        },
    )


@app.get("/api/tasks/{execution_id}/status")
async def get_task_status(execution_id: str):
    """
    Get the status of a background task
    
    Args:
        execution_id: Execution ID returned from /execute endpoint
        
    Returns:
        Task status information
    """
    try:
        task_id = get_task_id_by_execution_id(execution_id)
        
        if not task_id:
            raise HTTPException(
                status_code=404, detail=f"Task not found for execution_id: {execution_id}"
            )
        
        # Get task result from Celery
        task_result = AsyncResult(task_id, app=celery_app)
        
        # Map Celery states to our status
        celery_state = task_result.state
        if celery_state == "PENDING":
            status_str = "pending"
        elif celery_state == "STARTED":
            status_str = "processing"
        elif celery_state == "SUCCESS":
            status_str = "completed"
        elif celery_state == "FAILURE":
            status_str = "failed"
        else:
            status_str = "processing"
        
        response = {
            "execution_id": execution_id,
            "task_id": task_id,
            "status": status_str,
            "celery_state": celery_state,
            "websocket_url": f"/ws/execution/{execution_id}",
        }
        
        # Include result if completed
        if celery_state == "SUCCESS":
            response["result"] = task_result.result
        elif celery_state == "FAILURE":
            response["error"] = str(task_result.info) if task_result.info else "Task failed"
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting task status: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to get task status: {str(e)}"
        )


@app.websocket("/ws/execution/{execution_id}")
async def websocket_execution(websocket: WebSocket, execution_id: str):
    """
    WebSocket endpoint for real-time execution updates
    
    Clients connect to this endpoint to receive live updates about
    agent execution progress, screenshots, and logs.
    """
    await websocket_manager.connect(websocket, execution_id)
    
    try:
        while True:
            # Keep connection alive and handle any incoming messages
            data = await websocket.receive_text()
            # Echo back or handle client messages if needed
            await websocket.send_json({
                "type": "ack",
                "message": "Message received"
            })
    except WebSocketDisconnect:
        websocket_manager.disconnect(websocket, execution_id)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        websocket_manager.disconnect(websocket, execution_id)


@app.get("/api/screenshots/{execution_id}/{filename:path}")
async def get_screenshot(execution_id: str, filename: str):
    """
    Serve screenshot files
    
    Args:
        execution_id: Execution ID
        filename: Screenshot filename
    """
    blurred = "blurred" in filename
    path = screenshot_service.get_screenshot_path(execution_id, filename, blurred)
    
    if path and path.exists():
        return FileResponse(path, media_type="image/png")
    else:
        raise HTTPException(status_code=404, detail="Screenshot not found")


# IPFS/Memory Vault Endpoints
ipfs_service = IPFSService()

@app.post("/api/ipfs/upload", dependencies=[Depends(verify_api_key)])
async def upload_to_ipfs(
    file: UploadFile = File(...),
    metadata: Optional[str] = None
):
    """
    Upload a file to IPFS
    
    Args:
        file: File to upload
        metadata: Optional JSON metadata string
        
    Returns:
        IPFS hash (CID)
    """
    try:
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=Path(file.filename).suffix) as tmp_file:
            tmp_path = Path(tmp_file.name)
            content = await file.read()
            tmp_path.write_bytes(content)
            
            # Parse metadata if provided
            parsed_metadata = None
            if metadata:
                import json
                parsed_metadata = json.loads(metadata)
            
            # Upload to IPFS
            ipfs_hash = ipfs_service.upload_file(tmp_path, parsed_metadata)
            
            # Clean up temp file
            tmp_path.unlink()
            
            return {
                "success": True,
                "ipfsHash": ipfs_hash,
                "url": ipfs_service.get_file_url(ipfs_hash)
            }
    except Exception as e:
        logger.error(f"Error uploading to IPFS: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to upload to IPFS: {str(e)}")


@app.get("/api/ipfs/{ipfs_hash}")
async def get_from_ipfs(ipfs_hash: str):
    """
    Get file metadata from IPFS hash
    
    Args:
        ipfs_hash: IPFS hash (CID)
        
    Returns:
        File metadata and access URL
    """
    try:
        url = ipfs_service.get_file_url(ipfs_hash)
        return {
            "success": True,
            "ipfsHash": ipfs_hash,
            "url": url
        }
    except Exception as e:
        logger.error(f"Error fetching from IPFS: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch from IPFS: {str(e)}")


# Digital Will Endpoints
@app.get("/api/wills", response_model=WillListResponse)
async def list_wills(
    user_address: str = Query(..., description="Wallet address"),
    x_will_address: Optional[str] = Header(None),
    x_will_signature: Optional[str] = Header(None),
    x_will_timestamp: Optional[str] = Header(None),
):
    """List digital wills for a user (metadata only, no ciphertext)."""
    auth_address = _parse_will_auth(
        x_will_address, x_will_signature, x_will_timestamp
    )
    if auth_address.lower() != user_address.lower():
        raise HTTPException(status_code=403, detail="Address mismatch")

    cached = await get_cached_wills(user_address)
    if cached is not None:
        responses = [will_dict_to_response(w) for w in cached]
        return WillListResponse(wills=responses, total=len(responses))

    raw = await digital_will_service.get_wills_by_user(
        user_address, include_secrets=False
    )
    await set_cached_wills(user_address, raw)
    responses = [will_dict_to_response(w) for w in raw]
    return WillListResponse(wills=responses, total=len(responses))


@app.post("/api/wills", response_model=WillResponse, status_code=201)
async def create_will(
    request: CreateWillRequest,
    x_will_address: Optional[str] = Header(None),
    x_will_signature: Optional[str] = Header(None),
    x_will_timestamp: Optional[str] = Header(None),
):
    """Create a digital will entry (encrypted payload only)."""
    user_address = _parse_will_auth(
        x_will_address, x_will_signature, x_will_timestamp
    )
    _check_will_rate_limit(user_address)
    reject_plaintext_password_fields(request.model_dump())

    will_data = create_request_to_will_data(request)
    will_id = await digital_will_service.save_will(user_address, will_data)
    await invalidate_wills_cache(user_address)

    saved = await digital_will_service.get_will_by_id(will_id, include_secrets=False)
    if not saved:
        raise HTTPException(status_code=500, detail="Failed to retrieve saved will")
    return will_dict_to_response(saved)


@app.post("/api/wills/batch", response_model=WillListResponse, status_code=201)
async def batch_create_wills(
    request: BatchCreateWillsRequest,
    x_will_address: Optional[str] = Header(None),
    x_will_signature: Optional[str] = Header(None),
    x_will_timestamp: Optional[str] = Header(None),
):
    """Bulk create will entries (onboarding)."""
    user_address = _parse_will_auth(
        x_will_address, x_will_signature, x_will_timestamp
    )
    _check_will_rate_limit(user_address)

    created: list[WillResponse] = []
    for item in request.wills:
        reject_plaintext_password_fields(item.model_dump())
        will_data = create_request_to_will_data(item)
        will_id = await digital_will_service.save_will(user_address, will_data)
        saved = await digital_will_service.get_will_by_id(
            will_id, include_secrets=False
        )
        if saved:
            created.append(will_dict_to_response(saved))

    await invalidate_wills_cache(user_address)
    return WillListResponse(wills=created, total=len(created))


@app.delete("/api/wills/{will_id}", status_code=204)
async def delete_will(
    will_id: str,
    x_will_address: Optional[str] = Header(None),
    x_will_signature: Optional[str] = Header(None),
    x_will_timestamp: Optional[str] = Header(None),
):
    """Delete a digital will entry (owner only)."""
    user_address = _parse_will_auth(
        x_will_address, x_will_signature, x_will_timestamp
    )
    deleted = await digital_will_service.delete_will(will_id, user_address)
    if not deleted:
        raise HTTPException(status_code=404, detail="Will not found")
    await invalidate_wills_cache(user_address)
    return None


# Recovery Agent Endpoints
@app.post("/api/recovery/search", dependencies=[Depends(verify_api_key)])
async def search_unclaimed_property(request: RecoverySearchRequest):
    """
    Search for unclaimed property across multiple sources
    
    This endpoint searches MissingMoney.com, NAIC Life Insurance Policy Locator,
    and Treasury Hunt for unclaimed assets belonging to the deceased.
    """
    execution_id = str(uuid.uuid4())

    try:
        sources = request.sources if request.sources else ["all"]

        if "all" in sources or len(sources) == 0:
            # Search all sources
            result = await recovery_agent.search_all_sources(
                name=request.name,
                ssn=request.ssn,
                last_address=request.last_address,
                execution_id=execution_id,
            )
        else:
            # Search specific sources
            all_results = {
                "success": True,
                "sources": {},
                "total_assets": [],
                "total_estimated_value": 0.0,
                "claim_forms": [],
            }

            if "missingmoney" in sources:
                missing_money_result = await recovery_agent.search_missing_money(
                    request.name,
                    request.ssn,
                    request.last_address,
                    f"{execution_id}_missingmoney",
                )
                all_results["sources"]["missingmoney"] = missing_money_result
                if missing_money_result.get("success"):
                    all_results["total_assets"].extend(
                        missing_money_result.get("results", [])
                    )
                    all_results["claim_forms"].extend(
                        missing_money_result.get("claim_forms", [])
                    )

            if "naic" in sources:
                naic_result = await recovery_agent.search_naic_life_insurance(
                    request.name,
                    request.ssn,
                    request.last_address,
                    f"{execution_id}_naic",
                )
                all_results["sources"]["naic"] = naic_result
                if naic_result.get("success"):
                    all_results["total_assets"].extend(naic_result.get("results", []))
                    all_results["claim_forms"].extend(
                        naic_result.get("claim_forms", [])
                    )

            if "treasury" in sources:
                treasury_result = await recovery_agent.search_treasury_hunt(
                    request.name,
                    request.ssn,
                    request.last_address,
                    f"{execution_id}_treasury",
                )
                all_results["sources"]["treasury"] = treasury_result
                if treasury_result.get("success"):
                    all_results["total_assets"].extend(
                        treasury_result.get("results", [])
                    )
                    all_results["claim_forms"].extend(
                        treasury_result.get("claim_forms", [])
                    )

            # Calculate total estimated value
            for asset in all_results["total_assets"]:
                value = asset.get("estimated_value", 0)
                if isinstance(value, (int, float)):
                    all_results["total_estimated_value"] += value

            result = all_results

        return {
            "success": result.get("success", True),
            "execution_id": execution_id,
            "total_assets": result.get("total_assets", []),
            "total_estimated_value": result.get("total_estimated_value", 0.0),
            "claim_forms": result.get("claim_forms", []),
            "sources": result.get("sources", {}),
        }

    except Exception as e:
        logger.error(f"Error in recovery search: {e}")
        raise HTTPException(
            status_code=500, detail=f"Recovery search failed: {str(e)}"
        )


@app.post("/api/recovery/prefill-form", dependencies=[Depends(verify_api_key)])
async def prefill_claim_form(request: PrefillClaimFormRequest):
    """
    Pre-fill a claim form with beneficiary data from the vault
    """
    execution_id = str(uuid.uuid4())

    try:
        result = await recovery_agent.prefill_claim_form(
            form_path=request.form_path,
            beneficiary_data=request.beneficiary_data,
            execution_id=execution_id,
        )

        if not result.get("success"):
            raise HTTPException(
                status_code=500,
                detail=result.get("error", "Failed to pre-fill form"),
            )

        return {
            "success": True,
            "execution_id": execution_id,
            "prefilled_form_path": result.get("prefilled_form_path"),
        }

    except Exception as e:
        logger.error(f"Error pre-filling form: {e}")
        raise HTTPException(
            status_code=500, detail=f"Form pre-fill failed: {str(e)}"
        )


@app.get("/api/recovery/claim-forms/{execution_id}")
async def get_claim_forms(execution_id: str):
    """
    Get list of claim forms for a recovery execution
    """
    try:
        # Access the private method - in production, consider making this public
        forms = recovery_agent._find_claim_forms(execution_id)
        return {"execution_id": execution_id, "claim_forms": forms}
    except Exception as e:
        logger.error(f"Error getting claim forms: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to get claim forms: {str(e)}"
        )


@app.on_event("startup")
async def startup_event():
    """Initialize database and start blockchain listener."""
    await init_db()
    asyncio.create_task(blockchain_listener.listen_for_events())


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on application shutdown"""
    blockchain_listener.stop_listening()
    await executor.cleanup()


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )
