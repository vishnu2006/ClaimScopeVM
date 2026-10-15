from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)


class DocumentInventoryItem(BaseModel):
    document_id: str
    filename: str
    document_type: str
    file_path: str
    file_size_bytes: int
    page_count: Optional[int] = None
    has_native_text: bool = True
    status: str = "pending"


class CrossReferenceResult(BaseModel):
    field_name: str
    category: str
    is_consistent: bool
    source_a: str
    value_a: Any
    source_b: str
    value_b: Any
    discrepancy_description: Optional[str] = None
    severity: str = "info"  # info, warning, critical


class WebVerificationResult(BaseModel):
    query: str
    target_claim: str
    search_results: List[Dict[str, Any]] = Field(default_factory=list)
    verified_fact: Optional[str] = None
    source_urls: List[str] = Field(default_factory=list)
    is_plausible: Optional[bool] = None
    notes: Optional[str] = None


class AssessmentResult(BaseModel):
    classification: str  # routine vs flag_for_review
    risk_score: float = Field(0.0, ge=0.0, le=1.0)
    key_findings: List[str] = Field(default_factory=list)
    flagged_reasons: List[str] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)
    estimated_loss_range: Optional[str] = None


class ProcessingLogEntry(BaseModel):
    timestamp: datetime = Field(default_factory=get_utc_now)
    stage: str
    message: str
    level: str = "info"  # info, warning, error


class ProcessingError(BaseModel):
    stage: str
    error_message: str
    document_id: Optional[str] = None
    timestamp: datetime = Field(default_factory=get_utc_now)


class CaseState(BaseModel):
    """Shared state that flows through the LangGraph investigation pipeline.
    Every agent node reads from and writes to this structure."""
    case_id: str
    case_number: str

    # Document inventory
    documents: List[DocumentInventoryItem] = Field(default_factory=list)

    # Extracted data per document
    extractions: Dict[str, Any] = Field(default_factory=dict)  # document_id -> extraction result

    # Cross-reference findings
    cross_references: List[CrossReferenceResult] = Field(default_factory=list)

    # Web verification results
    web_verifications: List[WebVerificationResult] = Field(default_factory=list)

    # Assessment
    assessment: Optional[AssessmentResult] = None

    # Processing metadata
    processing_log: List[ProcessingLogEntry] = Field(default_factory=list)
    current_stage: str = "intake"
    stages_completed: List[str] = Field(default_factory=list)
    stages_skipped: List[str] = Field(default_factory=list)
    errors: List[ProcessingError] = Field(default_factory=list)
