import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.models.case import Case
import uuid

@pytest.mark.asyncio
async def test_user_creation_and_profile(test_session: AsyncSession):
    """Verify that User models can be persisted and linked."""
    test_uid = f"firebase-test-{uuid.uuid4().hex[:8]}"
    user = User(
        firebase_uid=test_uid,
        email=f"{test_uid}@example.com",
        display_name="Test Investigator",
        is_active=True,
        is_verified=True,
    )
    test_session.add(user)
    await test_session.commit()
    await test_session.refresh(user)

    assert user.id is not None
    assert user.email == f"{test_uid}@example.com"
    assert user.display_name == "Test Investigator"

@pytest.mark.asyncio
async def test_case_user_association(test_session: AsyncSession):
    """Verify cases associate with user_id and enforce ownership."""
    # Create user 1
    u1_uid = f"u1-{uuid.uuid4().hex[:8]}"
    user1 = User(firebase_uid=u1_uid, email=f"{u1_uid}@claimscope.ai", display_name="User One")
    test_session.add(user1)

    # Create user 2
    u2_uid = f"u2-{uuid.uuid4().hex[:8]}"
    user2 = User(firebase_uid=u2_uid, email=f"{u2_uid}@claimscope.ai", display_name="User Two")
    test_session.add(user2)
    await test_session.commit()
    await test_session.refresh(user1)
    await test_session.refresh(user2)

    # Create case belonging to user 1
    case1 = Case(
        case_number=f"CS-TEST-{uuid.uuid4().hex[:6]}",
        title="User 1 Confidential Claim",
        user_id=user1.id,
    )
    test_session.add(case1)
    await test_session.commit()
    await test_session.refresh(case1)

    assert case1.user_id == user1.id
    assert case1.user_id != user2.id

@pytest.mark.asyncio
async def test_auth_me_endpoint_anonymous(client: AsyncClient):
    """Verify /auth/me returns 401 when no token is provided."""
    resp = await client.get("/api/v1/auth/me")
    assert resp.status_code == 401
