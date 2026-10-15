import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.dependencies import get_db_session
from app.models.case import Case
from app.models.evidence import Evidence
from app.schemas.case import CaseCreate, CaseResponse, CaseSummary, CaseUpdate
from app.schemas.common import CaseStatus
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
    # Ensure case exists
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
