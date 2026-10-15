import uuid
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    """Test health check endpoints."""
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "ClaimScope" in data["app"]


@pytest.mark.asyncio
async def test_case_crud_flow(client: AsyncClient):
    """Test complete case creation, retrieval, update, and deletion lifecycle."""
    # 1. Create a case
    create_payload = {
        "title": "Intersection Collision on Elm St",
        "description": "Two-vehicle collision at 4-way stop. Both drivers claim right-of-way.",
        "claimant_name": "Sarah Connor",
        "policy_number": "POL-998877",
        "priority": "high",
    }
    create_resp = await client.post("/api/v1/cases", json=create_payload)
    assert create_resp.status_code == 201
    case_data = create_resp.json()
    case_id = case_data["id"]
    assert case_data["title"] == create_payload["title"]
    assert case_data["case_number"].startswith("CS-")
    assert case_data["status"] == "open"
    assert case_data["priority"] == "high"

    # 2. List cases
    list_resp = await client.get("/api/v1/cases")
    assert list_resp.status_code == 200
    cases_list = list_resp.json()
    assert len(cases_list) >= 1
    assert any(c["id"] == case_id for c in cases_list)

    # 3. Get single case
    get_resp = await client.get(f"/api/v1/cases/{case_id}")
    assert get_resp.status_code == 200
    retrieved = get_resp.json()
    assert retrieved["id"] == case_id
    assert retrieved["claimant_name"] == "Sarah Connor"
    assert retrieved["document_count"] == 0

    # 4. Update case
    update_payload = {
        "title": "Updated: Multi-Vehicle Intersection Collision",
        "priority": "critical",
    }
    update_resp = await client.patch(f"/api/v1/cases/{case_id}", json=update_payload)
    assert update_resp.status_code == 200
    updated = update_resp.json()
    assert updated["title"] == update_payload["title"]
    assert updated["priority"] == "critical"

    # 5. Get evidence for case (should be empty initially)
    ev_resp = await client.get(f"/api/v1/cases/{case_id}/evidence")
    assert ev_resp.status_code == 200
    assert ev_resp.json() == []

    # 6. Generate report for case
    rep_resp = await client.post(f"/api/v1/cases/{case_id}/reports")
    assert rep_resp.status_code == 201
    report_data = rep_resp.json()
    assert report_data["case_id"] == case_id
    assert report_data["status"] == "generated"
    assert "report_data" in report_data

    # 7. Delete case
    del_resp = await client.delete(f"/api/v1/cases/{case_id}")
    assert del_resp.status_code == 200

    # 8. Verify 404 after deletion
    verify_resp = await client.get(f"/api/v1/cases/{case_id}")
    assert verify_resp.status_code == 404


@pytest.mark.asyncio
async def test_case_not_found(client: AsyncClient):
    """Test 404 responses for non-existent case IDs."""
    fake_id = str(uuid.uuid4())
    resp = await client.get(f"/api/v1/cases/{fake_id}")
    assert resp.status_code == 404

    resp_patch = await client.patch(f"/api/v1/cases/{fake_id}", json={"title": "new"})
    assert resp_patch.status_code == 404

    resp_del = await client.delete(f"/api/v1/cases/{fake_id}")
    assert resp_del.status_code == 404
