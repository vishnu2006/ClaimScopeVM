from enum import Enum
from pydantic import BaseModel, ConfigDict


class CaseStatus(str, Enum):
    OPEN = "open"
    PROCESSING = "processing"
    INVESTIGATION_COMPLETE = "investigation_complete"
    REPORT_GENERATED = "report_generated"
    CLOSED = "closed"


class CasePriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class DocumentType(str, Enum):
    FNOL = "fnol"
    POLICE_REPORT = "police_report"
    REPAIR_ESTIMATE = "repair_estimate"
    PHOTO = "photo"
    MEDICAL_RECORD = "medical_record"
    CORRESPONDENCE = "correspondence"
    OTHER = "other"
    UNKNOWN = "unknown"


class ProcessingStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"
    UNAVAILABLE = "unavailable"


class EvidenceType(str, Enum):
    EXTRACTED_FIELD = "extracted_field"
    VISUAL_OBSERVATION = "visual_observation"
    CROSS_REFERENCE = "cross_reference"
    WEB_VERIFICATION = "web_verification"
    ASSESSMENT_FINDING = "assessment_finding"


class ReportType(str, Enum):
    PRELIMINARY = "preliminary"
    INVESTIGATION = "investigation"
    FINAL = "final"


class ReportStatus(str, Enum):
    DRAFT = "draft"
    GENERATED = "generated"
    REVIEWED = "reviewed"
    FINALIZED = "finalized"


class BaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
