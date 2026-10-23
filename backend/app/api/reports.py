import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth import get_optional_current_user
from app.auth_utils import get_authorized_case
from app.dependencies import get_db_session
from app.models.case import Case
from app.models.user import User
from app.models.evidence import Evidence
from app.models.report import Report
from app.schemas.common import CaseStatus, ReportStatus, ReportType
from app.schemas.report import InvestigationReport, ReportCreate, ReportResponse, ReportSection

router = APIRouter(prefix="/cases/{case_id}/reports", tags=["reports"])


def _build_investigation_report(case: Case) -> InvestigationReport:
    """Build structured investigation report from case documents and evidence."""
    evidences = case.evidences or []
    documents = case.documents or []

    # Incident Summary
    summary_lines = [
        f"Claim Investigation for Case {case.case_number}",
        f"Title: {case.title}",
        f"Policyholder / Claimant: {case.claimant_name or 'Not specified'}",
        f"Policy Number: {case.policy_number or 'Not specified'}",
        f"Incident Date: {case.incident_date.isoformat() if case.incident_date else 'Not specified'}",
        f"Description: {case.description or 'No initial narrative provided.'}",
    ]
    incident_section = ReportSection(
        title="Incident Summary",
        content="\n".join(summary_lines),
        source_references=[d.original_filename for d in documents],
        findings=[f"Case initialized with priority {case.priority.value.upper()}"],
    )

    # Document Analysis
    doc_lines = []
    doc_findings = []
    for doc in documents:
        doc_lines.append(
            f"- {doc.original_filename} ({doc.document_type.value}): {doc.file_size_bytes} bytes, "
            f"pages: {doc.page_count or 'N/A'}, status: {doc.processing_status.value}"
        )
        if doc.page_count:
            doc_findings.append(f"Processed {doc.original_filename} with {doc.page_count} page(s)")
    if not doc_lines:
        doc_lines.append("No documents have been uploaded to this case.")
        doc_findings.append("Document intake incomplete.")

    doc_section = ReportSection(
        title="Document Analysis",
        content="\n".join(doc_lines),
        source_references=[d.original_filename for d in documents],
        findings=doc_findings,
    )

    # Extracted Facts
    fact_lines = []
    fact_findings = []
    for ev in evidences:
        fact_lines.append(
            f"[{ev.category}] {ev.field_name}: {ev.field_value or 'N/A'} "
            f"(Confidence: {ev.confidence if ev.confidence is not None else 'N/A'}, Source: {ev.source_document or 'unknown'})"
        )
        if ev.confidence and ev.confidence > 0.8:
            fact_findings.append(f"High-confidence fact: {ev.field_name} = {ev.field_value}")
    if not fact_lines:
        fact_lines.append("No structured evidence records extracted yet.")

    facts_section = ReportSection(
        title="Extracted Facts & Provenance",
        content="\n".join(fact_lines),
        source_references=list({ev.source_document for ev in evidences if ev.source_document}),
        findings=fact_findings,
    )

    # Inconsistencies
    conflict_evidences = [ev for ev in evidences if ev.is_conflicting]
    conflict_lines = []
    conflict_findings = []
    for c in conflict_evidences:
        conflict_lines.append(f"Discrepancy in {c.field_name}: {c.notes or 'Conflicting values detected across sources.'}")
        conflict_findings.append(f"Flagged discrepancy in {c.field_name}")

    if not conflict_lines:
        conflict_lines.append("No cross-document inconsistencies identified in available materials.")

    inconsistencies_section = ReportSection(
        title="Cross-Document Inconsistencies",
        content="\n".join(conflict_lines),
        source_references=[],
        findings=conflict_findings,
    )

    # Web Verification
    web_section = ReportSection(
        title="Real-Time Web Verification",
        content="External market repair valuation and weather verification: Not performed for this stage.",
        source_references=[],
        findings=["Web verification awaiting stage 2 integration."],
    )

    # Risk Assessment & Recommendations
    has_conflicts = len(conflict_evidences) > 0
    has_docs = len(documents) > 0
    classification = "flag_for_review" if has_conflicts or not has_docs else "routine"
    risk_score = 0.75 if has_conflicts else (0.4 if not has_docs else 0.15)

    risk_findings = []
    if has_conflicts:
        risk_findings.append("High risk: contradictory information across documents.")
    if not has_docs:
        risk_findings.append("Missing documentation package.")
    else:
        risk_findings.append("Incident documentation matches routine intake criteria.")

    risk_section = ReportSection(
        title="Risk Assessment",
        content=f"Overall Classification: {classification.upper()}. Risk Score: {risk_score:.2f}.",
        source_references=[],
        findings=risk_findings,
    )

    recom_section = ReportSection(
        title="Recommendations",
        content="Forward to human adjuster for expedited routine processing."
        if classification == "routine"
        else "Escalate to senior claims investigator due to flagged inconsistencies.",
        source_references=[],
        findings=[
            "Adjuster action required: Verify coverage limits."
            if classification == "routine"
            else "Adjuster action required: Re-interview claimant regarding conflicting damage details."
        ],
    )

    # Limitations
    limitations_lines = [
        "Assessment based solely on submitted electronic records.",
        "Physical vehicle inspection may be warranted if discrepancies arise.",
    ]
    if not any(d.document_type.value == "police_report" for d in documents):
        limitations_lines.append("No police report was provided in this incident package.")

    limitations_section = ReportSection(
        title="Limitations & Missing Information",
        content="\n".join(limitations_lines),
        source_references=[],
        findings=["Package limitations noted for compliance."],
    )

    return InvestigationReport(
        case_number=case.case_number,
        incident_summary=incident_section,
        document_analysis=doc_section,
        extracted_facts=facts_section,
        inconsistencies=inconsistencies_section,
        verification_results=web_section,
        risk_assessment=risk_section,
        recommendations=recom_section,
        limitations=limitations_section,
        overall_classification=classification,
        risk_score=risk_score,
    )


@router.post("", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
async def generate_report(
    case_id: uuid.UUID,
    payload: Optional[ReportCreate] = None,
    db: AsyncSession = Depends(get_db_session),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """Generate or refresh structured investigation report for a case with ownership check."""
    case = await get_authorized_case(
        case_id=case_id,
        db=db,
        user=current_user,
        options=[selectinload(Case.documents), selectinload(Case.evidences), selectinload(Case.reports)],
    )

    investigation_report = _build_investigation_report(case)
    now = datetime.now(timezone.utc)

    # Check if a report already exists for this case
    rep_query = select(Report).where(Report.case_id == case_id)
    rep_res = await db.execute(rep_query)
    report = rep_res.scalar_one_or_none()

    rep_type = payload.report_type if payload and payload.report_type else ReportType.INVESTIGATION

    if not report:
        report = Report(
            case_id=case_id,
            report_type=rep_type,
            status=ReportStatus.GENERATED,
            summary=investigation_report.incident_summary.content,
            findings=investigation_report.extracted_facts.findings,
            recommendations=investigation_report.recommendations.findings,
            risk_indicators=investigation_report.risk_assessment.findings,
            generated_at=now,
            report_data=investigation_report.model_dump(mode="json"),
        )
        db.add(report)
    else:
        report.report_type = rep_type
        report.status = ReportStatus.GENERATED
        report.summary = investigation_report.incident_summary.content
        report.findings = investigation_report.extracted_facts.findings
        report.recommendations = investigation_report.recommendations.findings
        report.risk_indicators = investigation_report.risk_assessment.findings
        report.generated_at = now
        report.report_data = investigation_report.model_dump(mode="json")

    case.status = CaseStatus.REPORT_GENERATED
    await db.flush()
    await db.refresh(report)

    return report


@router.get("", response_model=List[ReportResponse])
async def list_reports(
    case_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """List reports for a specific case with ownership check."""
    await get_authorized_case(case_id=case_id, db=db, user=current_user)

    query = select(Report).where(Report.case_id == case_id).order_by(Report.created_at.desc())
    result = await db.execute(query)
    reports = result.scalars().all()
    return reports


@router.get("/{report_id}", response_model=ReportResponse)
async def get_report(
    case_id: uuid.UUID,
    report_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    await get_authorized_case(case_id=case_id, db=db, user=current_user)
    """Get a specific report by ID."""
    query = select(Report).where(Report.id == report_id, Report.case_id == case_id)
    result = await db.execute(query)
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report with ID {report_id} not found for case {case_id}",
        )
    return report
