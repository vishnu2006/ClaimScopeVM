import uuid
from datetime import datetime, timezone
from typing import Any, List, Optional
from pydantic import BaseModel, Field

from app.schemas.common import BaseSchema, ReportStatus, ReportType


def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)


class ReportSection(BaseModel):
    title: str
    content: str
    source_references: List[str] = Field(default_factory=list)
    findings: List[str] = Field(default_factory=list)


class InvestigationReport(BaseModel):
    case_number: str
    report_type: ReportType = ReportType.INVESTIGATION
    generated_at: datetime = Field(default_factory=get_utc_now)
    incident_summary: ReportSection
    document_analysis: ReportSection
    extracted_facts: ReportSection
    inconsistencies: ReportSection
    verification_results: ReportSection
    risk_assessment: ReportSection
    recommendations: ReportSection
    limitations: ReportSection
    overall_classification: str = "routine"  # routine vs flag_for_review
    risk_score: float = Field(0.0, ge=0.0, le=1.0)


class ReportCreate(BaseModel):
    report_type: Optional[ReportType] = ReportType.INVESTIGATION


class ReportResponse(BaseSchema):
    id: uuid.UUID
    case_id: uuid.UUID
    report_type: ReportType
    status: ReportStatus
    summary: Optional[str] = None
    findings: Optional[Any] = None
    recommendations: Optional[Any] = None
    risk_indicators: Optional[Any] = None
    generated_at: Optional[datetime] = None
    report_data: Optional[Any] = None
    created_at: datetime
    updated_at: datetime
