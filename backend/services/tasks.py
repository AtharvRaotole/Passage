"""
Celery tasks for background job processing
"""
import asyncio
import logging
from typing import Dict, Any, Optional
from datetime import datetime
from core.celery_app import celery_app
from agent.executor import DigitalExecutor
from services.websocket_manager import websocket_manager

logger = logging.getLogger(__name__)

# Global executor instance (will be initialized in worker)
_executor: Optional[DigitalExecutor] = None

# In-memory store for execution_id -> task_id mapping
# In production, use Redis or database
_execution_to_task: Dict[str, str] = {}


def get_executor() -> DigitalExecutor:
    """Get or create executor instance"""
    global _executor
    if _executor is None:
        _executor = DigitalExecutor()
    return _executor


def get_task_id_by_execution_id(execution_id: str) -> Optional[str]:
    """Get Celery task ID by execution ID"""
    return _execution_to_task.get(execution_id)


def set_task_id_mapping(execution_id: str, task_id: str):
    """Store mapping between execution_id and task_id"""
    _execution_to_task[execution_id] = task_id


@celery_app.task(bind=True, name="tasks.execute_ai_task")
def execute_ai_task(
    self,
    task_description: str,
    session_data: Optional[Dict[str, Any]],
    execution_id: str,
) -> Dict[str, Any]:
    """
    Execute AI agent task in background
    
    Args:
        task_description: Description of the task to execute
        session_data: Optional session data (cookies, tokens, etc.)
        execution_id: Unique execution ID for tracking
        
    Returns:
        Task execution result
    """
    try:
        logger.info(f"Starting background task execution: {execution_id}")
        
        # Get executor instance
        executor = get_executor()
        
        # Run the async task
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            # Send initial status update via WebSocket
            loop.run_until_complete(
                websocket_manager.send_to_execution(
                    execution_id,
                    {
                        "type": "task_started",
                        "data": {
                            "execution_id": execution_id,
                            "status": "started",
                            "timestamp": datetime.now().isoformat(),
                        },
                        "timestamp": datetime.now().isoformat(),
                    },
                )
            )
            
            result = loop.run_until_complete(
                executor.run_task(
                    task_description=task_description,
                    session_data=session_data,
                    execution_id=execution_id,
                )
            )
            
            # Send completion update
            loop.run_until_complete(
                websocket_manager.send_to_execution(
                    execution_id,
                    {
                        "type": "execution_completed",
                        "data": {
                            "success": result.get("success", False),
                            "output": result.get("output"),
                            "error": result.get("error"),
                            "execution_id": execution_id,
                        },
                        "timestamp": datetime.now().isoformat(),
                    },
                )
            )
            
            logger.info(f"Task execution completed: {execution_id}")
            return result
            
        finally:
            loop.close()
            
    except Exception as e:
        logger.error(f"Error in background task execution: {e}", exc_info=True)
        
        # Send error update
        try:
            # Try to get existing loop or create new one
            try:
                loop = asyncio.get_event_loop()
            except RuntimeError:
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
            
            try:
                loop.run_until_complete(
                    websocket_manager.send_to_execution(
                        execution_id,
                        {
                            "type": "execution_completed",
                            "data": {
                                "success": False,
                                "error": str(e),
                                "execution_id": execution_id,
                            },
                            "timestamp": datetime.now().isoformat(),
                        },
                    )
                )
            finally:
                if loop.is_running():
                    loop.close()
        except Exception as ws_error:
            logger.error(f"Error sending WebSocket error update: {ws_error}")
        
        # Re-raise to mark task as failed
        raise

