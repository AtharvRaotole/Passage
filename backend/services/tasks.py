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
from services.task_store import set_task_id_mapping, get_task_id_by_execution_id

logger = logging.getLogger(__name__)

# Global executor instance (will be initialized in worker)
_executor: Optional[DigitalExecutor] = None


def get_executor() -> DigitalExecutor:
    """Get or create executor instance"""
    global _executor
    if _executor is None:
        _executor = DigitalExecutor()
    return _executor


def _run_agent_execution(
    task_description: str,
    session_data: Optional[Dict[str, Any]],
    execution_id: str,
) -> Dict[str, Any]:
    """Shared implementation for agent background execution."""
    logger.info("Starting background task execution: %s", execution_id)
    executor = get_executor()
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
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
        logger.info("Task execution completed: %s", execution_id)
        return result
    finally:
        loop.close()


@celery_app.task(bind=True, name="tasks.execute_ai_task")
def execute_ai_task(
    self,
    task_description: str,
    session_data: Optional[Dict[str, Any]],
    execution_id: str,
) -> Dict[str, Any]:
    """Execute AI agent task in background."""
    try:
        return _run_agent_execution(task_description, session_data, execution_id)
    except Exception as e:
        logger.error("Error in background task execution: %s", e, exc_info=True)
        try:
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
            logger.error("Error sending WebSocket error update: %s", ws_error)
        raise


@celery_app.task(
    bind=True,
    name="tasks.execute_will_task",
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_kwargs={"max_retries": 3},
)
def execute_will_task(
    self,
    task_description: str,
    session_data: Optional[Dict[str, Any]],
    execution_id: str,
    will_id: str,
) -> Dict[str, Any]:
    """Execute a digital will entry via the AI agent (Celery background task)."""
    logger.info("Executing will %s as %s", will_id, execution_id)
    try:
        return _run_agent_execution(task_description, session_data, execution_id)
    except Exception as e:
        logger.error("Will task failed for %s: %s", will_id, e)
        raise

