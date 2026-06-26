"""Task mapping store tests."""

from services.task_store import (
    clear_task_mappings,
    get_task_id_by_execution_id,
    set_task_id_mapping,
)


def test_set_and_get_task_mapping():
    clear_task_mappings()
    set_task_id_mapping("exec-123", "celery-task-456")
    assert get_task_id_by_execution_id("exec-123") == "celery-task-456"


def test_missing_execution_returns_none():
    clear_task_mappings()
    assert get_task_id_by_execution_id("nonexistent") is None
