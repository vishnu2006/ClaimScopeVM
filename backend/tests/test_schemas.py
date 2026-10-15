import pytest
from pydantic import ValidationError

from app.schemas.case_state import (
    AssessmentResult,
    CaseState,
    CrossReferenceResult,
    DocumentInventoryItem,
    ProcessingLogEntry,
    WebVerificationResult,
)
from app.schemas.evidence import (
    FieldWithProvenance,
    FNOLExtraction,
    IncidentLocation,
    PartyInfo,
    VehicleInfo,
)
from app.schemas.report import InvestigationReport, ReportSection


def test_field_with_provenance_valid():
    """Test FieldWithProvenance allows proper values and provenance tracking."""
    field = FieldWithProvenance[str](
        value="PA-987654",
        confidence=0.95,
        source_document="incident_form.pdf",
        source_page=1,
        source_text="Policy Number: PA-987654",
        extraction_notes="Extracted from box 3",
    )
    assert field.value == "PA-987654"
    assert field.confidence == 0.95
    assert field.source_page == 1
    assert field.source_document == "incident_form.pdf"


def test_field_with_provenance_confidence_bounds():
    """Test that confidence must be between 0.0 and 1.0."""
    with pytest.raises(ValidationError):
        FieldWithProvenance[str](value="test", confidence=1.5)

    with pytest.raises(ValidationError):
        FieldWithProvenance[str](value="test", confidence=-0.1)


def test_fnol_extraction_missing_fields_stay_none():
    """Test that missing fields remain None and are not fabricated."""
    data = {
        "policy_number": {
            "value": "POL-112233",
            "confidence": 0.98,
            "source_document": "fnol.pdf",
        }
    }
    fnol = FNOLExtraction.model_validate(data)
    assert fnol.policy_number.value == "POL-112233"
    assert fnol.claim_number.value is None
    assert fnol.incident_date.value is None
    assert fnol.incident_description.value is None
    assert fnol.vehicles is None


def test_fnol_extraction_full_structure():
    """Test complete FNOL extraction with vehicles and party info."""
    data = {
        "policy_number": {"value": "POL-001", "confidence": 0.9},
        "incident_location": {
            "value": {
                "address": "123 Main St",
                "city": "Austin",
                "state": "TX",
                "zip": "78701",
            },
            "confidence": 0.85,
        },
        "vehicles": [
            {
                "year": "2022",
                "make": "Toyota",
                "model": "Camry",
                "color": "Silver",
                "vin": "4T1B11HK5JU123456",
                "plate": "TX-ABC123",
                "damage_description": "Rear bumper dent and cracked taillight",
                "confidence": 0.92,
            }
        ],
        "parties": [
            {
                "name": "Jane Doe",
                "role": "insured_driver",
                "contact": "555-0199",
                "insurance_company": "Acme Mutual",
            }
        ],
    }
    fnol = FNOLExtraction.model_validate(data)
    assert fnol.policy_number.value == "POL-001"
    assert fnol.incident_location.value.city == "Austin"
    assert len(fnol.vehicles) == 1
    assert fnol.vehicles[0].make == "Toyota"
    assert len(fnol.parties) == 1
    assert fnol.parties[0].name == "Jane Doe"


def test_case_state_initialization():
    """Test CaseState structure flows properly across LangGraph nodes."""
    state = CaseState(
        case_id="case-123",
        case_number="CS-2026-000001",
        documents=[
            DocumentInventoryItem(
                document_id="doc-1",
                filename="claim_form.pdf",
                document_type="fnol",
                file_path="/tmp/claim_form.pdf",
                file_size_bytes=10240,
                page_count=2,
            )
        ],
        cross_references=[
            CrossReferenceResult(
                field_name="damage_severity",
                category="damage",
                is_consistent=False,
                source_a="claim_form.pdf",
                value_a="minor scrape",
                source_b="photo_1.jpg",
                value_b="caved-in rear quarter panel",
                discrepancy_description="Form understates visual damage severity",
                severity="critical",
            )
        ],
        assessment=AssessmentResult(
            classification="flag_for_review",
            risk_score=0.85,
            flagged_reasons=["Severe discrepancy between form and scene photos"],
            recommendations=["Assign senior field investigator"],
        ),
    )

    assert state.case_number == "CS-2026-000001"
    assert len(state.documents) == 1
    assert len(state.cross_references) == 1
    assert state.cross_references[0].is_consistent is False
    assert state.assessment.classification == "flag_for_review"


def test_investigation_report_structure():
    """Test that InvestigationReport contains all required sections."""
    section = ReportSection(
        title="Test Section",
        content="Test content",
        source_references=["doc.pdf"],
        findings=["finding 1"],
    )
    report = InvestigationReport(
        case_number="CS-2026-000042",
        incident_summary=section,
        document_analysis=section,
        extracted_facts=section,
        inconsistencies=section,
        verification_results=section,
        risk_assessment=section,
        recommendations=section,
        limitations=section,
        overall_classification="routine",
        risk_score=0.1,
    )
    assert report.case_number == "CS-2026-000042"
    assert report.overall_classification == "routine"
    assert report.risk_score == 0.1
