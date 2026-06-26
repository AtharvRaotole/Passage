"""User profile and onboarding API tests."""

import uuid

import pytest
from fastapi.testclient import TestClient

from core.privy_auth import PrivyUserClaims, get_current_privy_user
import db.session as db_session
from main import app

MOCK_PRIVY_ID = "did:privy:test-user-123"


@pytest.fixture
def client():
    privy_id = f"did:privy:test-{uuid.uuid4()}"
    db_session._engine = None
    db_session._session_factory = None

    async def override_privy_user():
        return PrivyUserClaims(privy_user_id=privy_id)

    app.dependency_overrides[get_current_privy_user] = override_privy_user
    with TestClient(app) as test_client:
        yield test_client, privy_id
    app.dependency_overrides.clear()
    db_session._engine = None
    db_session._session_factory = None


def test_user_profile_flow(client):
    """Sync → me → onboarding → me/onboarding in one request cycle."""
    test_client, privy_id = client
    wallet = f"0x{uuid.uuid4().hex[:40]}"
    headers = {"Authorization": "Bearer test-token"}

    sync = test_client.post(
        "/api/users/sync",
        json={
            "walletAddress": wallet,
            "email": "test@example.com",
            "displayName": "Test User",
        },
        headers=headers,
    )
    assert sync.status_code == 200, sync.text
    sync_data = sync.json()
    assert sync_data["privyUserId"] == privy_id
    assert sync_data["walletAddress"] == wallet.lower()
    assert sync_data["onboardingCompleted"] is False

    me = test_client.get("/api/users/me", headers=headers)
    assert me.status_code == 200, me.text
    assert me.json()["walletAddress"] == wallet.lower()

    onboarding = test_client.post(
        "/api/users/onboarding",
        json={
            "walletAddress": wallet,
            "persona": "tech-founder",
            "heartbeatIntervalDays": 30,
            "requiredConfirmations": 2,
            "guardianTemplate": "family",
            "guardians": [
                "0x1111111111111111111111111111111111111111",
                "0x2222222222222222222222222222222222222222",
                "0x3333333333333333333333333333333333333333",
            ],
            "accounts": [
                {
                    "service": "GitHub",
                    "username": "github.com",
                    "type": "oauth",
                    "imported": False,
                }
            ],
            "instructions": [
                {"service": "GitHub", "instruction": "Transfer repos to backup org"}
            ],
        },
        headers=headers,
    )
    assert onboarding.status_code == 200, onboarding.text
    onboarding_data = onboarding.json()
    assert onboarding_data["onboardingCompleted"] is True
    assert onboarding_data["persona"] == "tech-founder"
    assert len(onboarding_data["guardians"]) == 3

    saved = test_client.get("/api/users/me/onboarding", headers=headers)
    assert saved.status_code == 200, saved.text
    saved_data = saved.json()
    assert saved_data["onboardingCompleted"] is True
    assert len(saved_data["guardians"]) == 3

    # Verify data survives a fresh read (simulates restart persistence)
    me_again = test_client.get("/api/users/me", headers=headers)
    assert me_again.status_code == 200
    assert me_again.json()["onboardingCompleted"] is True
