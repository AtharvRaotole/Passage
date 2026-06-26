"""API key authentication tests."""

import os

import pytest
from fastapi.testclient import TestClient

from core.config import settings


@pytest.fixture
def auth_client(monkeypatch):
    monkeypatch.setattr(settings, "API_KEY", "test-secret-key")
    from main import app

    return TestClient(app)


def test_execute_requires_api_key_when_configured(auth_client):
    response = auth_client.post(
        "/execute",
        json={"task_description": "test task"},
    )
    assert response.status_code == 401


def test_execute_accepts_valid_api_key(auth_client, monkeypatch):
    monkeypatch.setattr(
        "main.execute_ai_task.delay",
        lambda **kwargs: type("Task", (), {"id": "fake-task-id"})(),
    )
    response = auth_client.post(
        "/execute",
        json={"task_description": "test task"},
        headers={"Authorization": "Bearer test-secret-key"},
    )
    assert response.status_code == 202
    assert response.json()["execution_id"]


def test_execute_open_when_api_key_unset(monkeypatch):
    monkeypatch.setattr(settings, "API_KEY", None)
    from main import app

    client = TestClient(app)
    monkeypatch.setattr(
        "main.execute_ai_task.delay",
        lambda **kwargs: type("Task", (), {"id": "fake-task-id"})(),
    )
    response = client.post(
        "/execute",
        json={"task_description": "test task"},
    )
    assert response.status_code == 202
