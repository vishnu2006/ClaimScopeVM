import json
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.dependencies import get_db_session
from app.models.case import Case
from app.models.document import Document
from app.models.evidence import Evidence
from app.models.report import Report
from app.orchestration.investigation_graph import ClaimInvestigationOrchestrator
from app.schemas.case import CaseCreate, CaseResponse, CaseSummary, CaseUpdate
from app.schemas.case_state import CaseState, DocumentInventoryItem
from app.schemas.common import CaseStatus, EvidenceType, ProcessingStatus, ReportStatus, ReportType
from app.schemas.evidence import EvidenceResponse

router = APIRouter(prefix="/cases", tags=["cases"])


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
):
    """List cases with summary metrics and optional status filtering."""
    query = (
        select(Case)
        .options(selectinload(Case.documents), selectinload(Case.evidences))
        .order_by(Case.created_at.desc())
    )
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
):
    """Get case details including attached documents and evidence observations."""
    query = (
        select(Case)
        .options(selectinload(Case.documents), selectinload(Case.evidences))
        .where(Case.id == case_id)
    )
    result = await db.execute(query)
    case = result.scalar_one_or_none()
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Case with ID {case_id} not found",
        )
    return _case_to_response(case)


@router.patch("/{case_id}", response_model=CaseResponse)
async def update_case(
    case_id: uuid.UUID,
    payload: CaseUpdate,
    db: AsyncSession = Depends(get_db_session),
):
    """Update case metadata or status."""
    query = (
        select(Case)
        .options(selectinload(Case.documents), selectinload(Case.evidences))
        .where(Case.id == case_id)
    )
    result = await db.execute(query)
    case = result.scalar_one_or_none()
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Case with ID {case_id} not found",
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
):
    """Delete a case and all associated documents, evidence, and reports."""
    query = select(Case).where(Case.id == case_id)
    result = await db.execute(query)
    case = result.scalar_one_or_none()
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Case with ID {case_id} not found",
        )

    await db.delete(case)
    return {"message": "Case deleted successfully", "id": str(case_id)}


@router.get("/{case_id}/evidence", response_model=List[EvidenceResponse])
async def get_case_evidence(
    case_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
):
    """Get all evidence observations associated with a case."""
    case_query = select(Case.id).where(Case.id == case_id)
    case_res = await db.execute(case_query)
    if not case_res.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Case with ID {case_id} not found",
        )

    query = select(Evidence).where(Evidence.case_id == case_id).order_by(Evidence.created_at.asc())
    result = await db.execute(query)
    evidences = result.scalars().all()
    return evidences


@router.post("/{case_id}/investigate", response_model=CaseState)
async def run_case_investigation(
    case_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
):
    """Execute adaptive LangGraph investigation pipeline on all documents in the package."""
    # 1. Fetch case with documents
    query = (
        select(Case)
        .options(selectinload(Case.documents))
        .where(Case.id == case_id)
    )
    result = await db.execute(query)
    case = result.scalar_one_or_none()
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Case with ID {case_id} not found",
        )

    case.status = CaseStatus.PROCESSING
    await db.flush()

    # 2. Build DocumentInventoryItems
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

    # 3. Compile and invoke LangGraph Investigation Orchestrator
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
):
    """Retrieve the latest investigation CaseState for a case."""
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
