import json
import logging
import os
import shutil
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload, load_only
import io

from app.config import settings
from app.auth import get_optional_current_user
from app.auth_utils import get_authorized_case
from app.dependencies import get_db_session
from app.models.case import Case
from app.models.user import User
from app.models.document import Document
from app.models.evidence import Evidence
from app.models.report import Report
from app.orchestration.investigation_graph import ClaimInvestigationOrchestrator
from app.schemas.case import CaseCreate, CaseResponse, CaseSummary, CaseUpdate
from app.schemas.case_state import CaseState, DocumentInventoryItem
from app.schemas.common import CasePriority, CaseStatus, DocumentType, EvidenceType, ProcessingStatus, ReportStatus, ReportType
from app.schemas.evidence import EvidenceResponse
from app.services.document_classifier import DocumentClassifier
from app.services.pdf_generator import ReportPDFGenerator

logger = logging.getLogger(__name__)
_pdf_cache: Dict[str, bytes] = {}

router = APIRouter(prefix="/cases", tags=["cases"])

_DEMO_CACHE_DATA: Optional[Dict[str, Any]] = None


def _get_demo_cache(scenario_key: str) -> Optional[Dict[str, Any]]:
    global _DEMO_CACHE_DATA
    if _DEMO_CACHE_DATA is None:
        try:
            cache_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), "preloaded_demo", "demo_cache.json")
            if os.path.exists(cache_file):
                with open(cache_file, "r", encoding="utf-8") as f:
                    _DEMO_CACHE_DATA = json.load(f)
        except Exception as e:
            logger.warning("Failed to load demo_cache.json: %s", e)
            _DEMO_CACHE_DATA = {}
    return _DEMO_CACHE_DATA.get(scenario_key) if _DEMO_CACHE_DATA else None



async def _generate_case_number(db: AsyncSession) -> str:
    """Generate sequential case number in CS-YYYY-XXXXXX format."""
    year = datetime.now(timezone.utc).year
    query = select(func.count(Case.id))
    result = await db.execute(query)
    count = result.scalar_one() or 0
    return f"CS-{year}-{(count + 1):06d}"


def _case_to_response(case: Case) -> CaseResponse:
    doc_count = len(case.documents) if case.documents else 0
    evi_count = len(case.evidences) if case.evidences else 0
    report_item = case.reports[0] if case.reports else None
    return CaseResponse(
        id=case.id,
        case_number=case.case_number,
        title=case.title,
        description=case.description,
        status=case.status,
        priority=case.priority,
        claimant_name=case.claimant_name,
        policy_number=case.policy_number,
        incident_date=case.incident_date,
        document_count=doc_count,
        evidence_count=evi_count,
        documents=case.documents,
        evidences=case.evidences,
        report=report_item,
        created_at=case.created_at,
        updated_at=case.updated_at,
    )


def _case_to_summary(case: Case) -> CaseSummary:
    doc_count = len(case.documents) if case.documents else 0
    evi_count = len(case.evidences) if case.evidences else 0
    return CaseSummary(
        id=case.id,
        case_number=case.case_number,
        title=case.title,
        description=case.description,
        status=case.status,
        priority=case.priority,
        claimant_name=case.claimant_name,
        policy_number=case.policy_number,
        incident_date=case.incident_date,
        document_count=doc_count,
        evidence_count=evi_count,
        created_at=case.created_at,
        updated_at=case.updated_at,
    )


@router.post("", response_model=CaseResponse, status_code=status.HTTP_201_CREATED)
async def create_case(
    payload: CaseCreate,
    db: AsyncSession = Depends(get_db_session),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """Create a new case with an auto-generated case number."""
    case_number = await _generate_case_number(db)
    case = Case(
        case_number=case_number,
        title=payload.title,
        description=payload.description,
        claimant_name=payload.claimant_name,
        policy_number=payload.policy_number,
        incident_date=payload.incident_date,
        priority=payload.priority,
        status=CaseStatus.OPEN,
        user_id=current_user.id if current_user else None,
    )
    db.add(case)
    await db.flush()
    await db.refresh(case)
    return _case_to_response(case)


@router.get("", response_model=List[CaseSummary])
async def list_cases(
    status_filter: Optional[CaseStatus] = Query(None, alias="status"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db_session),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """List cases with summary metrics, private user workspace filtering, and optional status filtering."""
    query = (
        select(Case)
        .options(
            selectinload(Case.documents).load_only(Document.id, Document.case_id),
            selectinload(Case.evidences).load_only(Evidence.id, Evidence.case_id),
        )
        .order_by(Case.created_at.desc())
    )
    if current_user:
        # Strict user workspace isolation: new accounts start with 0 cases
        query = query.where(Case.user_id == current_user.id)
    else:
        # Unauthenticated demo visitors only see shared public cases
        query = query.where(Case.user_id.is_(None))

    if status_filter:
        query = query.where(Case.status == status_filter)

    query = query.offset(offset).limit(limit)
    result = await db.execute(query)
    cases = result.scalars().all()
    return [_case_to_summary(c) for c in cases]


@router.get("/{case_id}", response_model=CaseResponse)
async def get_case(
    case_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """Get case details including attached documents and evidence observations with ownership checks."""
    case = await get_authorized_case(
        case_id=case_id,
        db=db,
        user=current_user,
        options=[selectinload(Case.documents), selectinload(Case.evidences), selectinload(Case.reports)],
    )
    return _case_to_response(case)


@router.patch("/{case_id}", response_model=CaseResponse)
async def update_case(
    case_id: uuid.UUID,
    payload: CaseUpdate,
    db: AsyncSession = Depends(get_db_session),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """Update case metadata or status with ownership validation."""
    case = await get_authorized_case(
        case_id=case_id,
        db=db,
        user=current_user,
        options=[selectinload(Case.documents), selectinload(Case.evidences)],
    )

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(case, field, value)

    await db.flush()
    await db.refresh(case)
    return _case_to_response(case)


@router.delete("/{case_id}", status_code=status.HTTP_200_OK)
async def delete_case(
    case_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """Delete a case and all associated documents, evidence, and reports with ownership check."""
    case = await get_authorized_case(case_id=case_id, db=db, user=current_user)

    await db.delete(case)
    return {"message": "Case deleted successfully", "id": str(case_id)}


@router.get("/{case_id}/evidence", response_model=List[EvidenceResponse])
async def get_case_evidence(
    case_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """Get all evidence observations associated with a case with ownership check."""
    await get_authorized_case(case_id=case_id, db=db, user=current_user)

    query = select(Evidence).where(Evidence.case_id == case_id).order_by(Evidence.created_at.asc())
    result = await db.execute(query)
    evidences = result.scalars().all()
    return evidences


@router.post("/{case_id}/investigate", response_model=CaseState)
async def run_case_investigation(
    case_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """Execute adaptive LangGraph investigation pipeline on all documents in the package."""
    case = await get_authorized_case(
        case_id=case_id,
        db=db,
        user=current_user,
        options=[selectinload(Case.documents)],
    )

    case.status = CaseStatus.PROCESSING
    await db.flush()

    # 2. Check if this case matches an existing pre-loaded demo scenario
    # If all documents match a standard demo scenario and have not been modified,
    # replay precomputed findings instantly (0 latency, 0 tokens)
    cached_scenario = None
    curr_filenames = sorted([d.original_filename for d in case.documents]) if case.documents else []
    for s_key in ["case_a", "case_b", "case_c", "case_d", "case_e"]:
        cached = _get_demo_cache(s_key)
        if cached:
            cached_filenames = sorted([d["filename"] for d in cached.get("report_data", {}).get("documents", [])])
            if curr_filenames and curr_filenames == cached_filenames:
                cached_scenario = cached
                break

    if cached_scenario:
        logger.info(f"Fast-path hit for demo scenario on case {case.case_number}: instant investigation loading")
        import copy
        rd = copy.deepcopy(cached_scenario["report_data"])
        rd["case_id"] = str(case.id)
        rd["case_number"] = case.case_number
        
        # Remap document IDs from cache to actual database document UUIDs
        fname_to_doc = {d.original_filename: d for d in case.documents}
        old_to_new = {}
        for d_item in rd.get("documents", []):
            fn = d_item.get("filename")
            if fn in fname_to_doc:
                old_id = d_item.get("document_id")
                real_id = str(fname_to_doc[fn].id)
                d_item["document_id"] = real_id
                d_item["file_path"] = fname_to_doc[fn].file_path
                old_to_new[old_id] = real_id

        # Remap extractions and vision
        new_ext = {}
        for old_id, ext in rd.get("extractions", {}).items():
            new_ext[old_to_new.get(old_id, old_id)] = ext
        rd["extractions"] = new_ext

        new_vis = {}
        for old_id, vis in rd.get("vision_observations", {}).items():
            new_vis[old_to_new.get(old_id, old_id)] = vis
        rd["vision_observations"] = new_vis

        final_state = CaseState.model_validate(rd)
    else:
        # 2b. Standard LangGraph Multi-Agent Pipeline for user-uploaded custom files
        inventory: List[DocumentInventoryItem] = [
            DocumentInventoryItem(
                document_id=str(d.id),
                filename=d.original_filename,
                document_type=d.document_type.value if hasattr(d.document_type, "value") else str(d.document_type),
                file_path=d.file_path,
                file_size_bytes=d.file_size_bytes,
                page_count=d.page_count,
                status=d.processing_status.value if hasattr(d.processing_status, "value") else str(d.processing_status),
            )
            for d in case.documents
        ]

        initial_state = CaseState(
            case_id=str(case.id),
            case_number=case.case_number,
            documents=inventory,
        )

        orchestrator = ClaimInvestigationOrchestrator()
        graph = orchestrator.build_graph()

        final_state_dict = await graph.ainvoke(initial_state)
        final_state = CaseState.model_validate(final_state_dict)

    # 4. Sync Document classifications & statuses back to DB
    doc_map = {str(d.id): d for d in case.documents}
    for item in final_state.documents:
        db_doc = doc_map.get(item.document_id)
        if db_doc:
            db_doc.document_type = item.document_type
            db_doc.processing_status = ProcessingStatus.COMPLETED

    # 5. Persist evidence items to Evidence table
    # Clear prior auto-extracted evidence to avoid duplicate accumulation
    prior_ev_query = select(Evidence).where(Evidence.case_id == case.id)
    prior_ev_res = await db.execute(prior_ev_query)
    for old_ev in prior_ev_res.scalars().all():
        await db.delete(old_ev)

    # 5a. Structured document extractions
    for doc_id, ext_data in final_state.extractions.items():
        if not isinstance(ext_data, dict):
            continue
        db_doc = doc_map.get(doc_id)
        doc_name = db_doc.original_filename if db_doc else "document"

        for field_name, field_val in ext_data.items():
            if isinstance(field_val, dict) and field_val.get("value") is not None:
                ev = Evidence(
                    case_id=case.id,
                    document_id=uuid.UUID(doc_id) if doc_id in doc_map else None,
                    evidence_type=EvidenceType.EXTRACTED_FIELD,
                    category="document_fact",
                    field_name=field_name,
                    field_value=str(field_val.get("value")),
                    confidence=field_val.get("confidence") or 0.9,
                    source_document=field_val.get("source_document") or doc_name,
                    source_page=field_val.get("source_page"),
                    source_location=field_val.get("source_text"),
                    notes=field_val.get("extraction_notes"),
                )
                db.add(ev)

    # 5b. Vision observations
    for doc_id, vision in final_state.vision_observations.items():
        db_doc = doc_map.get(doc_id)
        doc_name = db_doc.original_filename if db_doc else "photo"
        ev = Evidence(
            case_id=case.id,
            document_id=uuid.UUID(doc_id) if doc_id in doc_map else None,
            evidence_type=EvidenceType.VISUAL_OBSERVATION,
            category="visual_damage",
            field_name=vision.visible_vehicle_region,
            field_value=f"Severity: {vision.severity_category.upper()}. {vision.severity_explanation}",
            confidence=vision.confidence_score,
            source_document=doc_name,
            conflicting_values={
                "observable_damage": vision.observable_damage,
                "affected_components": vision.affected_components,
                "supporting_observations": vision.supporting_visual_observations,
                "limitations": vision.image_quality_limitations,
            },
        )
        db.add(ev)

    # 5c. Inconsistencies & Discrepancies
    for finding in final_state.inconsistencies:
        ev = Evidence(
            case_id=case.id,
            evidence_type=EvidenceType.CROSS_REFERENCE,
            category=finding.category,
            field_name=finding.field_name,
            field_value=finding.explanation,
            confidence=finding.confidence,
            source_document=finding.source_a,
            is_conflicting=True,
            conflicting_values={
                "source_a": finding.source_a,
                "value_a": finding.value_a,
                "source_b": finding.source_b,
                "value_b": finding.value_b,
                "severity": finding.severity,
            },
            notes=finding.investigation_notes,
        )
        db.add(ev)

    # 6. Save Report
    report_query = select(Report).where(Report.case_id == case.id)
    report_res = await db.execute(report_query)
    report = report_res.scalar_one_or_none()
    if not report:
        report = Report(case_id=case.id)
        db.add(report)

    report.report_type = ReportType.INVESTIGATION
    report.status = ReportStatus.GENERATED
    report.summary = (
        f"Investigation completed across {len(final_state.documents)} documents. "
        f"Detected {len(final_state.inconsistencies)} review item(s). "
        f"Recommendation: {final_state.generated_report.get('recommendation', 'routine').upper()}."
        if final_state.generated_report
        else "Investigation generated."
    )
    report.findings = {
        "normalized_facts": final_state.normalized_facts,
        "discrepancies": [d.model_dump(mode="json") for d in final_state.inconsistencies],
        "agent_executions": [e.model_dump(mode="json") for e in final_state.agent_executions],
        "limitations": final_state.investigation_limitations,
    }
    report.generated_at = datetime.now(timezone.utc)
    report.report_data = final_state.model_dump(mode="json")

    # 7. Update Case status
    case.status = CaseStatus.INVESTIGATION_COMPLETE
    await db.flush()

    return final_state


@router.get("/{case_id}/investigation", response_model=Optional[CaseState])
async def get_case_investigation(
    case_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """Retrieve the latest investigation CaseState for a case with ownership check."""
    await get_authorized_case(case_id=case_id, db=db, user=current_user)
    report_query = select(Report).where(Report.case_id == case_id)
    report_res = await db.execute(report_query)
    report = report_res.scalar_one_or_none()

    if not report or not report.report_data:
        return None

    try:
        return CaseState.model_validate(report.report_data)
    except Exception as e:
        logger.error(f"Error parsing stored CaseState: {e}")
        return None


@router.get("/{case_id}/report/pdf")
async def download_case_report_pdf(
    case_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """Generate and stream a professional PDF investigation report with ownership check."""
    await get_authorized_case(case_id=case_id, db=db, user=current_user)
    report_query = select(Report).where(Report.case_id == case_id)
    report_res = await db.execute(report_query)
    report = report_res.scalar_one_or_none()
    if not report or not report.report_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No investigation report has been generated for this case yet. Run the investigation first.",
        )

    try:
        case_state = CaseState.model_validate(report.report_data)
        cache_key = f"{report.id}_{report.updated_at}"
        cached_bytes = _pdf_cache.get(cache_key)

        if cached_bytes:
            pdf_buffer = io.BytesIO(cached_bytes)
        else:
            pdf_gen = ReportPDFGenerator()
            raw_buffer = pdf_gen.generate_pdf(case_state)
            cached_bytes = raw_buffer.getvalue()
            _pdf_cache[cache_key] = cached_bytes
            pdf_buffer = io.BytesIO(cached_bytes)

        filename = f"ClaimScope_Report_{case_state.case_number}.pdf"
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"},
        )
    except Exception as e:
        logger.error(f"Error generating PDF report: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to compile PDF report: {str(e)}",
        )


@router.post("/synthetic/{scenario_id}", response_model=CaseResponse, status_code=status.HTTP_201_CREATED)
async def load_synthetic_case(
    scenario_id: str,
    db: AsyncSession = Depends(get_db_session),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """One-click load synthetic accident incident package (case_a, case_b, case_c, case_d, case_e).
    Instantly creates the case in DB and copies/classifies the synthetic documents."""
    scenarios = {
        "case_a": {
            "folder": "case_a_fnol_only",
            "title": "Clean Minor Parking Lot Incident (Case A)",
            "description": "2021 Toyota Camry minor rear bumper impact while parked. Single FNOL document submitted.",
            "claimant": "Sarah Jenkins",
            "policy": "PA-2026-981245",
            "priority": CasePriority.LOW,
        },
        "case_b": {
            "folder": "case_b_fnol_photos",
            "title": "Front Collision with Photo Evidence (Case B)",
            "description": "2020 Honda Civic front-end collision into guardrail with two scene photographs.",
            "claimant": "Marcus Brody",
            "policy": "PA-2025-412890",
            "priority": CasePriority.MEDIUM,
        },
        "case_c": {
            "folder": "case_c_complete_consistent",
            "title": "Comprehensive Rear-End Collision Package (Case C)",
            "description": "2022 Ford F-150 rear-ended at intersection. Complete package: FNOL, Police Report, Certified Estimate, Photos.",
            "claimant": "Robert T. Vance",
            "policy": "PA-2024-773120",
            "priority": CasePriority.MEDIUM,
        },
        "case_d": {
            "folder": "case_d_contradictory",
            "title": "Contradictory Narrative & VIN Mismatch (Case D)",
            "description": "Staged/suspicious loss: FNOL claims driver was rear-ended while police cite head-on collision with stationary flatbed; mismatched VIN suffix.",
            "claimant": "Arthur Pendelton",
            "policy": "PA-2026-118934",
            "priority": CasePriority.HIGH,
        },
        "case_e": {
            "folder": "case_e_incomplete",
            "title": "Incomplete Scanned Incident Package (Case E)",
            "description": "Handwritten/scanned statement with minimal incident details, testing OCR and uncertainty reporting.",
            "claimant": "Elena Rostova",
            "policy": "PA-2023-559012",
            "priority": CasePriority.LOW,
        },
    }

    key = scenario_id.lower()
    matched_scenario = None
    for k, v in scenarios.items():
        if k == key or v["folder"] == key or k in key:
            matched_scenario = v
            break

    if not matched_scenario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Unknown synthetic scenario '{scenario_id}'. Available: {list(scenarios.keys())}",
        )

    case_number = await _generate_case_number(db)
    new_case = Case(
        case_number=case_number,
        title=matched_scenario["title"],
        description=matched_scenario["description"],
        claimant_name=matched_scenario["claimant"],
        policy_number=matched_scenario["policy"],
        incident_date=datetime.now(timezone.utc),
        priority=matched_scenario["priority"],
        status=CaseStatus.OPEN,
        user_id=current_user.id if current_user else None,
    )
    db.add(new_case)
    await db.flush()

    # Locate package files on disk
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    pkg_dir = os.path.join(base_dir, "synthetic_packages", matched_scenario["folder"])
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    classifier = DocumentClassifier()

    if os.path.exists(pkg_dir):
        for fname in os.listdir(pkg_dir):
            src_path = os.path.join(pkg_dir, fname)
            if not os.path.isfile(src_path):
                continue
            ext = os.path.splitext(fname)[1].lower()
            unique_name = f"{uuid.uuid4().hex}_{fname}"
            dest_path = os.path.join(settings.UPLOAD_DIR, unique_name)
            shutil.copy2(src_path, dest_path)
            file_size = os.path.getsize(dest_path)

            classification = classifier.classify_by_content(dest_path)
            doc_type = classification.document_type
            mime_type = "application/pdf" if ext == ".pdf" else "image/png"

            doc = Document(
                case_id=new_case.id,
                original_filename=fname,
                stored_filename=unique_name,
                file_path=dest_path,
                file_size_bytes=file_size,
                mime_type=mime_type,
                file_extension=ext,
                document_type=doc_type,
                processing_status=ProcessingStatus.PENDING,
            )
            db.add(doc)

    await db.flush()
    await db.refresh(new_case)

    # Reload with all relationships
    query = (
        select(Case)
        .options(selectinload(Case.documents), selectinload(Case.evidences), selectinload(Case.reports))
        .where(Case.id == new_case.id)
    )
    res = await db.execute(query)
    reloaded = res.scalar_one()
    return _case_to_response(reloaded)
