from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from app.schemas.evidence import InconsistencyFinding, PhotoDamageAnalysis


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
    classification_confidence: float = 1.0


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


class AgentExecutionRecord(BaseModel):
    """Tracks invocation, skip reason, and result of each specialized agent."""
    agent_id: str
    display_name: str
    status: str  # pending, completed, skipped, failed, unavailable
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    skip_reason: Optional[str] = None
    error_message: Optional[str] = None
    details: Optional[Dict[str, Any]] = None


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
    """Central shared state that flows through the LangGraph investigation workflow.
    Every agent node reads from and writes to this structure."""
    case_id: str
    case_number: str

    # Document inventory & classifications
    documents: List[DocumentInventoryItem] = Field(default_factory=list)

    # Structured extractions per document: doc_id -> structured extraction dict
    extractions: Dict[str, Any] = Field(default_factory=dict)

    # Vision observations for accident photos: doc_id -> PhotoDamageAnalysis
    vision_observations: Dict[str, PhotoDamageAnalysis] = Field(default_factory=dict)

    # Discrepancies and inconsistencies across multiple documents
    inconsistencies: List[InconsistencyFinding] = Field(default_factory=list)
    cross_references: List[CrossReferenceResult] = Field(default_factory=list)

    # Consolidated & normalized incident facts
    normalized_facts: Dict[str, Any] = Field(default_factory=dict)

    # Adaptive agent execution tracking
    agent_executions: List[AgentExecutionRecord] = Field(default_factory=list)

    # Package completeness & audit limitations
    missing_documents: List[str] = Field(default_factory=list)
    investigation_limitations: List[str] = Field(default_factory=list)

    # Web verification results (Stage 3 hook)
    web_verifications: List[WebVerificationResult] = Field(default_factory=list)

    # Assessment & preliminary report synthesis
    assessment: Optional[AssessmentResult] = None
    generated_report: Optional[Dict[str, Any]] = None

    # Processing metadata & audit trail
    processing_log: List[ProcessingLogEntry] = Field(default_factory=list)
    current_stage: str = "intake"
    stages_completed: List[str] = Field(default_factory=list)
    stages_skipped: List[str] = Field(default_factory=list)
    errors: List[ProcessingError] = Field(default_factory=list)
