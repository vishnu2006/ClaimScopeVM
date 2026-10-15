import os
import uuid
import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.models.case import Case
from app.models.report import Report
from app.schemas.case_state import (
    AssessmentResult,
    CaseState,
    DocumentInventoryItem,
    InconsistencyFinding,
    PhotoDamageAnalysis,
    WebVerificationResult,
)
from app.schemas.common import CasePriority, CaseStatus, ReportStatus, ReportType
from app.services.assessment_engine import ClaimAssessmentEngine
from app.services.external_verifier import ExternalVerificationService
from app.services.pdf_generator import ReportPDFGenerator


@pytest.mark.asyncio
async def test_external_verifier_invalid_vin():
    verifier = ExternalVerificationService()
    res = await verifier.verify_vin("SHORT_VIN")
    assert res.status == "inconclusive"
    assert "invalid" in res.retrieved_information.lower()
    assert res.source_name == "NHTSA vPIC Public Vehicle Database"


@pytest.mark.asyncio
async def test_external_verifier_repair_benchmarks():
    verifier = ExternalVerificationService()
    res = await verifier.verify_repair_cost_benchmarks(
        vehicle_desc="2021 Toyota Camry",
        gross_total=18500.0,
        labor_total=9200.0,
        parts_total=8000.0,
    )
    assert res.status == "verified"
    assert "18,500" in res.retrieved_information
    assert "benchmark" in res.retrieved_information.lower()


def test_assessment_engine_routine_outcome():
    engine = ClaimAssessmentEngine()
    state = CaseState(
        case_id="case-101",
        case_number="CS-2026-000101",
        documents=[
            DocumentInventoryItem(
                document_id="doc-1",
                filename="incident_form.pdf",
                document_type="fnol",
                file_path="/tmp/fnol.pdf",
                file_size_bytes=2048,
                status="completed",
            ),
            DocumentInventoryItem(
                document_id="doc-2",
                filename="police_report.pdf",
                document_type="police_report",
                file_path="/tmp/police.pdf",
                file_size_bytes=4096,
                status="completed",
            ),
        ],
        inconsistencies=[],
        missing_documents=[],
    )
    res = engine.evaluate(state)
    assert res.outcome == "ROUTINE_REVIEW"
    assert res.classification == "routine"
    assert len(res.triggered_rules) == 0


def test_assessment_engine_escalate_on_contradiction():
    engine = ClaimAssessmentEngine()
    state = CaseState(
        case_id="case-102",
        case_number="CS-2026-000102",
        documents=[
            DocumentInventoryItem(
                document_id="doc-1",
                filename="incident_form.pdf",
                document_type="fnol",
                file_path="/tmp/fnol.pdf",
                file_size_bytes=2048,
                status="completed",
            ),
            DocumentInventoryItem(
                document_id="doc-2",
                filename="police_report.pdf",
                document_type="police_report",
                file_path="/tmp/police.pdf",
                file_size_bytes=4096,
                status="completed",
            ),
        ],
        inconsistencies=[
            InconsistencyFinding(
                discrepancy_id="DISC-01",
                category="narrative_fault",
                field_name="accident_description",
                source_a="incident_form.pdf",
                value_a="Rear-ended by unidentified vehicle while stopped at light",
                source_b="police_report.pdf",
                value_b="Insured vehicle rear-ended stationary vehicle at 35mph; cited for failure to control speed",
                explanation="Insured claim of non-fault contradicts police collision report citation.",
                severity="high",
                is_contradiction=True,
            ),
            InconsistencyFinding(
                discrepancy_id="DISC-02",
                category="vehicle_identity",
                field_name="vin",
                source_a="incident_form.pdf",
                value_a="4T1B11HK5MU123456",
                source_b="police_report.pdf",
                value_b="4T1B11HK5MU999999",
                explanation="Mismatched VIN suffix across police report and FNOL.",
                severity="critical",
                is_contradiction=True,
            ),
        ],
    )
    res = engine.evaluate(state)
    assert res.outcome == "ESCALATE_FOR_HUMAN_REVIEW"
    assert res.classification == "escalate"
    rule_ids = [r.rule_id for r in res.triggered_rules]
    assert "TRG-MAT-01" in rule_ids
    assert "TRG-VIN-02" in rule_ids
    assert len(res.recommended_adjuster_actions) > 0


def test_pdf_report_generator():
    generator = ReportPDFGenerator()
    state = CaseState(
        case_id="test-case-id-1234",
        case_number="CS-2026-000999",
        documents=[
            DocumentInventoryItem(
                document_id="d-1",
                filename="incident_form.pdf",
                document_type="fnol",
                file_path="/tmp/test.pdf",
                file_size_bytes=1024,
                status="completed",
            )
        ],
        assessment=AssessmentResult(
            outcome="ROUTINE_REVIEW",
            classification="routine",
            risk_score=0.15,
            rationale="All records consistent.",
            recommendations=["Process routine claim."],
        ),
    )
    pdf_bytes = generator.generate_pdf(state)
    pdf_content = pdf_bytes.getvalue()
    assert len(pdf_content) > 500
    assert pdf_content.startswith(b"%PDF")


@pytest.mark.asyncio
async def test_synthetic_case_loader_endpoint(client: AsyncClient):
    # Load synthetic case_c
    resp = await client.post("/api/v1/cases/synthetic/case_c")
    assert resp.status_code == 201
    data = resp.json()
    assert "CS-" in data["case_number"]
    assert "Comprehensive" in data["title"]
    assert data["document_count"] >= 3


@pytest.mark.asyncio
async def test_pdf_download_endpoint_without_report(client: AsyncClient):
    # Create a fresh case with no report
    create_resp = await client.post(
        "/api/v1/cases",
        json={"title": "Test Case for PDF", "claimant_name": "Test User"},
    )
    assert create_resp.status_code == 201
    case_id = create_resp.json()["id"]

    # Attempt to download PDF before running investigation
    pdf_resp = await client.get(f"/api/v1/cases/{case_id}/report/pdf")
    assert pdf_resp.status_code == 404
    assert "No investigation report" in pdf_resp.json()["detail"]
