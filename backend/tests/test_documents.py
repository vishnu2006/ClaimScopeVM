import io
import uuid
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_document_upload_and_validation(client: AsyncClient):
    """Test document upload validation, file extensions, and retrieval."""
    # Create case first
    case_resp = await client.post(
        "/api/v1/cases",
        json={"title": "Document Test Case"},
    )
    assert case_resp.status_code == 201
    case_id = case_resp.json()["id"]

    # Test 1: Upload with disallowed extension (.exe)
    invalid_file = ("bad_file.exe", io.BytesIO(b"executable content"), "application/octet-stream")
    upload_fail = await client.post(
        f"/api/v1/cases/{case_id}/documents",
        files=[("files", invalid_file)],
    )
    assert upload_fail.status_code == 400
    assert "not allowed" in upload_fail.json()["detail"].lower()

    # Test 2: Upload valid file (.pdf)
    valid_pdf_content = b"%PDF-1.4 Minimal PDF header"
    valid_file = ("fnol_incident_report.pdf", io.BytesIO(valid_pdf_content), "application/pdf")
    upload_success = await client.post(
        f"/api/v1/cases/{case_id}/documents",
        files=[("files", valid_file)],
    )
    assert upload_success.status_code == 201
    docs = upload_success.json()
    assert len(docs) == 1
    doc_id = docs[0]["id"]
    assert docs[0]["original_filename"] == "fnol_incident_report.pdf"
    assert docs[0]["document_type"] == "fnol"
    assert docs[0]["processing_status"] == "pending"

    # Test 3: List documents for case
    list_resp = await client.get(f"/api/v1/cases/{case_id}/documents")
    assert list_resp.status_code == 200
    all_docs = list_resp.json()
    assert len(all_docs) == 1
    assert all_docs[0]["id"] == doc_id

    # Test 4: Get document detail
    get_resp = await client.get(f"/api/v1/cases/{case_id}/documents/{doc_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["stored_filename"] != ""

    # Test 5: Delete document
    del_resp = await client.delete(f"/api/v1/cases/{case_id}/documents/{doc_id}")
    assert del_resp.status_code == 200

    # Verify document is gone
    get_after_del = await client.get(f"/api/v1/cases/{case_id}/documents/{doc_id}")
    assert get_after_del.status_code == 404


@pytest.mark.asyncio
async def test_document_upload_nonexistent_case(client: AsyncClient):
    """Test uploading to a non-existent case returns 404."""
    fake_case_id = str(uuid.uuid4())
    dummy_file = ("test.pdf", io.BytesIO(b"%PDF-1.4 test"), "application/pdf")
    resp = await client.post(
        f"/api/v1/cases/{fake_case_id}/documents",
        files=[("files", dummy_file)],
    )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_process_fnol_without_api_key_raises_error(client: AsyncClient):
    """Test that processing an FNOL without LLM_API_KEY configured raises clear ConfigurationError (503)."""
    case_resp = await client.post(
        "/api/v1/cases",
        json={"title": "FNOL Processing Test"},
    )
    case_id = case_resp.json()["id"]

    # Upload dummy FNOL PDF
    pdf_content = b"%PDF-1.4 test"
    file_tuple = ("fnol_report.pdf", io.BytesIO(pdf_content), "application/pdf")
    upload_resp = await client.post(
        f"/api/v1/cases/{case_id}/documents",
        files=[("files", file_tuple)],
    )
    doc_id = upload_resp.json()[0]["id"]

    # Trigger processing - should raise ConfigurationError because LLM_API_KEY is not set
    proc_resp = await client.post(f"/api/v1/cases/{case_id}/documents/{doc_id}/process")
    assert proc_resp.status_code in [500, 503]
