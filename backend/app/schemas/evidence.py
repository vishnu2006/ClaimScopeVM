import uuid
from datetime import datetime
from typing import Any, Generic, List, Optional, TypeVar
from pydantic import BaseModel, Field

from app.schemas.common import BaseSchema, EvidenceType

T = TypeVar("T")


class FieldWithProvenance(BaseModel, Generic[T]):
    value: Optional[T] = None
    confidence: Optional[float] = Field(None, ge=0.0, le=1.0)
    source_document: Optional[str] = None
    source_page: Optional[int] = None
    source_text: Optional[str] = None  # exact text that was extracted from
    extraction_notes: Optional[str] = None


class IncidentLocation(BaseModel):
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip: Optional[str] = None


class VehicleInfo(BaseModel):
    year: Optional[str] = None
    make: Optional[str] = None
    model: Optional[str] = None
    color: Optional[str] = None
    vin: Optional[str] = None
    plate: Optional[str] = None
    damage_description: Optional[str] = None
    confidence: Optional[float] = Field(None, ge=0.0, le=1.0)
    source_reference: Optional[str] = None


class PartyInfo(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None  # driver, passenger, claimant, insured, etc.
    contact: Optional[str] = None
    license_number: Optional[str] = None
    insurance_company: Optional[str] = None
    insurance_policy: Optional[str] = None
    confidence: Optional[float] = Field(None, ge=0.0, le=1.0)
    source_reference: Optional[str] = None


class InjuryInfo(BaseModel):
    person_name: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[str] = None  # minor, moderate, severe, fatal
    medical_treatment: Optional[str] = None
    confidence: Optional[float] = Field(None, ge=0.0, le=1.0)
    source_reference: Optional[str] = None


class WitnessInfo(BaseModel):
    name: Optional[str] = None
    contact: Optional[str] = None
    statement_summary: Optional[str] = None
    confidence: Optional[float] = Field(None, ge=0.0, le=1.0)
    source_reference: Optional[str] = None


class FNOLExtraction(BaseModel):
    policy_number: Optional[FieldWithProvenance[str]] = Field(
        default_factory=FieldWithProvenance
    )
    claim_number: Optional[FieldWithProvenance[str]] = Field(
        default_factory=FieldWithProvenance
    )
    incident_date: Optional[FieldWithProvenance[str]] = Field(
        default_factory=FieldWithProvenance
    )
    incident_time: Optional[FieldWithProvenance[str]] = Field(
        default_factory=FieldWithProvenance
    )
    incident_location: Optional[FieldWithProvenance[IncidentLocation]] = Field(
        default_factory=FieldWithProvenance
    )
    incident_description: Optional[FieldWithProvenance[str]] = Field(
        default_factory=FieldWithProvenance
    )
    weather_conditions: Optional[FieldWithProvenance[str]] = Field(
        default_factory=FieldWithProvenance
    )
    road_conditions: Optional[FieldWithProvenance[str]] = Field(
        default_factory=FieldWithProvenance
    )
    vehicles: Optional[List[VehicleInfo]] = None
    parties: Optional[List[PartyInfo]] = None
    injuries: Optional[List[InjuryInfo]] = None
    police_involved: Optional[FieldWithProvenance[bool]] = Field(
        default_factory=FieldWithProvenance
    )
    police_report_number: Optional[FieldWithProvenance[str]] = Field(
        default_factory=FieldWithProvenance
    )
    witnesses: Optional[List[WitnessInfo]] = None
    property_damage: Optional[FieldWithProvenance[str]] = Field(
        default_factory=FieldWithProvenance
    )
    estimated_damage_amount: Optional[FieldWithProvenance[str]] = Field(
        default_factory=FieldWithProvenance
    )


class EvidenceObservation(BaseModel):
    category: str
    field_name: str
    field_value: Optional[str] = None
    confidence: Optional[float] = None
    source_document: Optional[str] = None
    source_page: Optional[int] = None
    source_location: Optional[str] = None
    is_conflicting: bool = False
    conflicting_values: Optional[Any] = None
    notes: Optional[str] = None


class EvidenceCreate(BaseModel):
    document_id: Optional[uuid.UUID] = None
    evidence_type: EvidenceType
    category: str
    field_name: str
    field_value: Optional[str] = None
    confidence: Optional[float] = Field(None, ge=0.0, le=1.0)
    source_document: Optional[str] = None
    source_page: Optional[int] = None
    source_location: Optional[str] = None
    is_conflicting: bool = False
    conflicting_values: Optional[Any] = None
    notes: Optional[str] = None


class EvidenceResponse(BaseSchema):
    id: uuid.UUID
    case_id: uuid.UUID
    document_id: Optional[uuid.UUID] = None
    evidence_type: EvidenceType
    category: str
    field_name: str
    field_value: Optional[str] = None
    confidence: Optional[float] = None
    source_document: Optional[str] = None
    source_page: Optional[int] = None
    source_location: Optional[str] = None
    is_conflicting: bool
    conflicting_values: Optional[Any] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
