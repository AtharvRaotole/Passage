"""Recovery route contract tests."""

import pytest
from fastapi.testclient import TestClient

from core.config import settings


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setattr(settings, "API_KEY", "test-key")

    async def mock_search_all_sources(**kwargs):
        return {
            "success": True,
            "total_assets": [
                {
                    "source": "missingmoney",
                    "property_type": "Unclaimed Property",
                    "value": "$100",
                }
            ],
            "total_estimated_value": 100.0,
            "claim_forms": [],
            "sources": {},
        }

    monkeypatch.setattr(
        "main.recovery_agent.search_all_sources",
        mock_search_all_sources,
    )
    from main import app

    return TestClient(app)


def test_recovery_search_returns_total_assets(client):
    response = client.post(
        "/api/recovery/search",
        json={"name": "John Smith", "last_address": "New York, NY"},
        headers={"Authorization": "Bearer test-key"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "execution_id" in data
    assert len(data["total_assets"]) == 1
    assert data["total_assets"][0]["source"] == "missingmoney"
