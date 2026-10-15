import uuid
from datetime import datetime
from typing import TYPE_CHECKING, List, Optional
from pydantic import BaseModel, Field

from app.schemas.common import BaseSchema, CasePriority, CaseStatus
from app.schemas.document import DocumentResponse
from app.schemas.evidence import EvidenceResponse
from app.schemas.report import ReportResponse


class CaseCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    claimant_name: Optional[str] = Field(None, max_length=255)
    policy_number: Optional[str] = Field(None, max_length=100)
    incident_date: Optional[datetime] = None
    priority: Optional[CasePriority] = CasePriority.MEDIUM


class CaseUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    status: Optional[CaseStatus] = None
    priority: Optional[CasePriority] = None
    claimant_name: Optional[str] = Field(None, max_length=255)
    policy_number: Optional[str] = Field(None, max_length=100)
    incident_date: Optional[datetime] = None


class CaseSummary(BaseSchema):
    id: uuid.UUID
    case_number: str
    title: str
    description: Optional[str] = None
    status: CaseStatus
    priority: CasePriority
    claimant_name: Optional[str] = None
    policy_number: Optional[str] = None
    incident_date: Optional[datetime] = None
    document_count: int = 0
    evidence_count: int = 0
    created_at: datetime
    updated_at: datetime


class CaseResponse(BaseSchema):
    id: uuid.UUID
    case_number: str
    title: str
    description: Optional[str] = None
    status: CaseStatus
    priority: CasePriority
    claimant_name: Optional[str] = None
    policy_number: Optional[str] = None
    incident_date: Optional[datetime] = None
    document_count: int = 0
    evidence_count: int = 0
    documents: List["DocumentResponse"] = Field(default_factory=list)
    evidences: List["EvidenceResponse"] = Field(default_factory=list)
    report: Optional[ReportResponse] = None
    created_at: datetime
    updated_at: datetime
