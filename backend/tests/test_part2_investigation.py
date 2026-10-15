import os
import uuid
import pytest
from httpx import AsyncClient

from app.orchestration.investigation_graph import ClaimInvestigationOrchestrator
from app.schemas.case_state import CaseState, DocumentInventoryItem
from app.schemas.common import DocumentType
from app.schemas.evidence import (
    EstimateLineItem,
    InconsistencyFinding,
    PhotoDamageAnalysis,
    PoliceReportExtraction,
    RepairEstimateExtraction,
)
from app.services.consistency_agent import CrossDocumentConsistencyAgent
from app.services.document_classifier import DocumentClassifier
from app.services.llm_provider import ConfigurationError, get_llm_provider

BASE_SYNTHETIC_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "synthetic_packages")
)


def test_document_classifier_content_heuristics():
    """Verify content-based document classification for all claims document types."""
    classifier = DocumentClassifier()

    # Case A: FNOL
    fnol_path = os.path.join(BASE_SYNTHETIC_DIR, "case_a_fnol_only", "incident_form.pdf")
    res_fnol = classifier.classify_by_content(fnol_path)
    assert res_fnol.document_type == DocumentType.FNOL
    assert res_fnol.confidence >= 0.9

    # Case C: Police Report
    police_path = os.path.join(BASE_SYNTHETIC_DIR, "case_c_complete_consistent", "police_report.pdf")
    res_police = classifier.classify_by_content(police_path)
    assert res_police.document_type == DocumentType.POLICE_REPORT
    assert res_police.confidence >= 0.9

    # Case C: Repair Estimate
    estimate_path = os.path.join(BASE_SYNTHETIC_DIR, "case_c_complete_consistent", "repair_estimate.pdf")
    res_est = classifier.classify_by_content(estimate_path)
    assert res_est.document_type == DocumentType.REPAIR_ESTIMATE
    assert res_est.confidence >= 0.9

    # Case B: Photo
    photo_path = os.path.join(BASE_SYNTHETIC_DIR, "case_b_fnol_photos", "damage_photo_front.png")
    res_photo = classifier.classify_by_content(photo_path)
    assert res_photo.document_type == DocumentType.PHOTO


def test_police_report_and_repair_estimate_schemas():
    """Verify structure and validation of PoliceReportExtraction and RepairEstimateExtraction."""
    police = PoliceReportExtraction(
        citations_issued=["CVC 21453(a) Red Light Violation", "CVC 22350 Unsafe Speed"],
        officer_observations=["Skid marks measured 14 feet", "Deployed steering wheel airbag"],
    )
    assert len(police.citations_issued) == 2
    assert police.incident_date.value is None

    est = RepairEstimateExtraction(
        line_items=[
            EstimateLineItem(
                item_number=1,
                operation="Replace",
                part_description="Bumper Cover",
                part_type="OEM",
                part_cost=450.0,
                labor_hours=2.0,
                labor_cost=170.0,
                total_cost=620.0,
            )
        ],
        identified_damage_regions=["Front Bumper", "Left Headlamp"],
    )
    assert len(est.line_items) == 1
    assert est.line_items[0].part_cost == 450.0
    assert est.gross_total.value is None


def test_vision_analysis_rubric_validation():
    """Verify Vehicle Damage Vision Agent schema and explainable severity rubric."""
    vision = PhotoDamageAnalysis(
        visible_vehicle_region="Front Bumper and Radiator Grille",
        observable_damage=["Cracked fascia", "Horizontal scratch", "Popped bumper clips"],
        affected_components=["Front bumper cover", "Lower grille mesh"],
        severity_category="moderate",
        severity_explanation="Surface cracks and displaced trim requiring panel removal and plastic welding; frame rails intact.",
        supporting_visual_observations=["Dry roadway", "Clear daytime visibility"],
        image_quality_limitations=["Slight oblique camera angle"],
        confidence_score=0.92,
    )
    assert vision.severity_category == "moderate"
    assert vision.confidence_score == 0.92
    assert len(vision.affected_components) == 2


def test_deterministic_consistency_detection():
    """Verify deterministic detection of date conflict and VIN conflict across documents."""
    agent = CrossDocumentConsistencyAgent()

    extractions = {
        "doc_fnol": {
            "incident_date": {"value": "2026-10-05"},
            "vehicles": [{"vin": "WBA5R1C58LAH88123"}],
        },
        "doc_police": {
            "incident_date": {"value": "2026-10-06"},
            "vehicles_involved": [{"vin": "WBA5R1C58LAH99999"}],
        },
    }
    doc_type_map = {
        "doc_fnol": "fnol",
        "doc_police": "police_report",
    }

    discrepancies = agent.detect_deterministic_discrepancies(extractions, doc_type_map)

    categories = [d.category for d in discrepancies]
    assert "date_time" in categories
    assert "vehicle_identity" in categories

    vin_discrepancy = next(d for d in discrepancies if d.category == "vehicle_identity")
    assert vin_discrepancy.severity == "critical"
    assert vin_discrepancy.is_contradiction is True


@pytest.mark.asyncio
async def test_langgraph_conditional_routing_case_a_fnol_only():
    """Verify that on FNOL-only packages, the LangGraph supervisor runs FNOL and
    explicitly skips absent-document agents (police, estimate, vision, consistency)."""
    fnol_path = os.path.join(BASE_SYNTHETIC_DIR, "case_a_fnol_only", "incident_form.pdf")

    initial_state = CaseState(
        case_id=str(uuid.uuid4()),
        case_number="CS-2026-000101",
        documents=[
            DocumentInventoryItem(
                document_id="doc-1",
                filename="incident_form.pdf",
                document_type="fnol",
                file_path=fnol_path,
                file_size_bytes=os.path.getsize(fnol_path),
            )
        ],
    )

    orchestrator = ClaimInvestigationOrchestrator()
    graph = orchestrator.build_graph()

    final_dict = await graph.ainvoke(initial_state)
    final_state = CaseState.model_validate(final_dict)

    # Verify stage progression
    assert "intake_classification" in final_state.stages_completed
    assert "supervisor_routing" in final_state.stages_completed
    assert "investigation_synthesis" in final_state.stages_completed

    # Verify absent agents are explicitly marked SKIPPED with reasons
    skipped_agent_ids = [e.agent_id for e in final_state.agent_executions if e.status == "skipped"]
    assert "police_extractor" in skipped_agent_ids
    assert "estimate_extractor" in skipped_agent_ids
    assert "vision_agent" in skipped_agent_ids
    assert "consistency_agent" in skipped_agent_ids

    # Verify missing documents are recorded
    assert any("Police" in m for m in final_state.missing_documents)
    assert any("Estimate" in m for m in final_state.missing_documents)
    assert any("Photographs" in m for m in final_state.missing_documents)


@pytest.mark.asyncio
async def test_langgraph_conditional_routing_case_b_fnol_and_photos():
    """Verify that on FNOL + Photo packages, supervisor plans FNOL + Vision,
    and skips Police and Repair Estimate with explicit explanations."""
    case_b_dir = os.path.join(BASE_SYNTHETIC_DIR, "case_b_fnol_photos")
    fnol_path = os.path.join(case_b_dir, "incident_form.pdf")
    photo_path = os.path.join(case_b_dir, "damage_photo_front.png")

    initial_state = CaseState(
        case_id=str(uuid.uuid4()),
        case_number="CS-2026-000102",
        documents=[
            DocumentInventoryItem(
                document_id="doc-1",
                filename="incident_form.pdf",
                document_type="fnol",
                file_path=fnol_path,
                file_size_bytes=os.path.getsize(fnol_path),
            ),
            DocumentInventoryItem(
                document_id="doc-2",
                filename="damage_photo_front.png",
                document_type="photo",
                file_path=photo_path,
                file_size_bytes=os.path.getsize(photo_path),
            ),
        ],
    )

    orchestrator = ClaimInvestigationOrchestrator()
    graph = orchestrator.build_graph()

    final_dict = await graph.ainvoke(initial_state)
    final_state = CaseState.model_validate(final_dict)

    # Police and Estimate must be skipped
    skipped_agent_ids = [e.agent_id for e in final_state.agent_executions if e.status == "skipped"]
    assert "police_extractor" in skipped_agent_ids
    assert "estimate_extractor" in skipped_agent_ids

    # Vision agent must NOT be skipped
    assert "vision_agent" not in skipped_agent_ids


def test_missing_gemini_api_key_raises_configuration_error(monkeypatch):
    """Verify that unconfigured GEMINI_API_KEY explicitly raises ConfigurationError without fabrication."""
    monkeypatch.setenv("GEMINI_API_KEY", "")
    monkeypatch.setenv("LLM_API_KEY", "")

    from app import config
    config.settings.GEMINI_API_KEY = None
    config.settings.LLM_API_KEY = None

    with pytest.raises(ConfigurationError) as exc_info:
        get_llm_provider()

    assert "GEMINI_API_KEY is not configured" in str(exc_info.value)


@pytest.mark.asyncio
async def test_api_investigate_and_get_investigation_endpoints(client: AsyncClient):
    """Test full API endpoint integration: Create Case -> Upload -> Investigate -> Get State."""
    # 1. Create Case
    create_res = await client.post(
        "/api/v1/cases",
        json={
            "title": "Case A Test Investigation",
            "claimant_name": "David K. Miller",
            "policy_number": "POL-2026-88419",
            "priority": "medium",
        },
    )
    assert create_res.status_code == 201
    case_data = create_res.json()
    case_id = case_data["id"]

    # 2. Upload Case A PDF
    fnol_path = os.path.join(BASE_SYNTHETIC_DIR, "case_a_fnol_only", "incident_form.pdf")
    with open(fnol_path, "rb") as f:
        file_bytes = f.read()

    upload_res = await client.post(
        f"/api/v1/cases/{case_id}/documents",
        files=[("files", ("incident_form.pdf", file_bytes, "application/pdf"))],
    )
    assert upload_res.status_code == 201

    # 3. Trigger LangGraph Investigation
    inv_res = await client.post(f"/api/v1/cases/{case_id}/investigate")
    assert inv_res.status_code == 200
    inv_state = inv_res.json()

    assert inv_state["case_id"] == case_id
    assert "intake_classification" in inv_state["stages_completed"]
    assert "supervisor_routing" in inv_state["stages_completed"]
    assert "investigation_synthesis" in inv_state["stages_completed"]

    # 4. Fetch stored investigation via GET endpoint
    get_res = await client.get(f"/api/v1/cases/{case_id}/investigation")
    assert get_res.status_code == 200
    stored_state = get_res.json()
    assert stored_state["case_id"] == case_id
    assert len(stored_state["agent_executions"]) > 0
