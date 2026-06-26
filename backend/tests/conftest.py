"""Pytest configuration."""

import pytest


@pytest.fixture(autouse=True)
def reset_in_memory_stores():
    """Reset in-memory stores between tests."""
    from services.database import digital_will_service
    from services.task_store import clear_task_mappings

    digital_will_service.clear_all()
    clear_task_mappings()
    yield
    digital_will_service.clear_all()
    clear_task_mappings()
