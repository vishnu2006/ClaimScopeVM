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


class PoliceReportExtraction(BaseModel):
    """Structured extraction model for Police Reports / Incident Reports."""
    report_number: Optional[FieldWithProvenance[str]] = Field(default_factory=FieldWithProvenance)
    jurisdiction_agency: Optional[FieldWithProvenance[str]] = Field(default_factory=FieldWithProvenance)
    officer_name: Optional[FieldWithProvenance[str]] = Field(default_factory=FieldWithProvenance)
    badge_number: Optional[FieldWithProvenance[str]] = Field(default_factory=FieldWithProvenance)
    incident_date: Optional[FieldWithProvenance[str]] = Field(default_factory=FieldWithProvenance)
    incident_time: Optional[FieldWithProvenance[str]] = Field(default_factory=FieldWithProvenance)
    incident_location: Optional[FieldWithProvenance[IncidentLocation]] = Field(default_factory=FieldWithProvenance)
    narrative: Optional[FieldWithProvenance[str]] = Field(default_factory=FieldWithProvenance)
    fault_assessment: Optional[FieldWithProvenance[str]] = Field(default_factory=FieldWithProvenance)
    citations_issued: Optional[List[str]] = None
    weather_conditions: Optional[FieldWithProvenance[str]] = Field(default_factory=FieldWithProvenance)
    road_conditions: Optional[FieldWithProvenance[str]] = Field(default_factory=FieldWithProvenance)
    vehicles_involved: Optional[List[VehicleInfo]] = None
    parties_involved: Optional[List[PartyInfo]] = None
    injuries_reported: Optional[List[InjuryInfo]] = None
    officer_observations: Optional[List[str]] = None


class EstimateLineItem(BaseModel):
    item_number: Optional[int] = None
    operation: Optional[str] = None  # Replace, Repair, Refinish, Blend, Overhaul
    part_description: Optional[str] = None
    part_type: Optional[str] = None  # OEM, Aftermarket, Reconditioned, Recycled
    part_cost: Optional[float] = None
    labor_hours: Optional[float] = None
    labor_cost: Optional[float] = None
    total_cost: Optional[float] = None


class RepairEstimateExtraction(BaseModel):
    """Structured extraction model for Auto Body Repair Estimates."""
    estimate_number: Optional[FieldWithProvenance[str]] = Field(default_factory=FieldWithProvenance)
    facility_name: Optional[FieldWithProvenance[str]] = Field(default_factory=FieldWithProvenance)
    estimator_name: Optional[FieldWithProvenance[str]] = Field(default_factory=FieldWithProvenance)
    estimate_date: Optional[FieldWithProvenance[str]] = Field(default_factory=FieldWithProvenance)
    vehicle_info: Optional[VehicleInfo] = None
    odometer: Optional[FieldWithProvenance[str]] = Field(default_factory=FieldWithProvenance)
    parts_total: Optional[FieldWithProvenance[float]] = Field(default_factory=FieldWithProvenance)
    labor_total: Optional[FieldWithProvenance[float]] = Field(default_factory=FieldWithProvenance)
    paint_total: Optional[FieldWithProvenance[float]] = Field(default_factory=FieldWithProvenance)
    sublet_total: Optional[FieldWithProvenance[float]] = Field(default_factory=FieldWithProvenance)
    sales_tax: Optional[FieldWithProvenance[float]] = Field(default_factory=FieldWithProvenance)
    gross_total: Optional[FieldWithProvenance[float]] = Field(default_factory=FieldWithProvenance)
    line_items: Optional[List[EstimateLineItem]] = None
    identified_damage_regions: Optional[List[str]] = None


class PhotoDamageAnalysis(BaseModel):
    """Structured vision observation schema for vehicle accident photos."""
    visible_vehicle_region: str = Field(
        ...,
        description="Visible exterior or interior section of the vehicle (e.g. Front Bumper, Driver Quarter Panel, Rear Liftgate)",
    )
    observable_damage: List[str] = Field(
        default_factory=list,
        description="List of specific visible physical damage manifestations (e.g. Creased metal, shattered lens, paint scratch)",
    )
    affected_components: List[str] = Field(
        default_factory=list,
        description="List of identifiable vehicle parts impacted in the photo",
    )
    severity_category: str = Field(
        ...,
        description="Apparent damage severity according to rubric: minor, moderate, severe, catastrophic_total_loss",
    )
    severity_explanation: str = Field(
        ...,
        description="Grounded explanation for severity rating based strictly on visible evidence",
    )
    supporting_visual_observations: List[str] = Field(
        default_factory=list,
        description="Contextual observations (airbag deployment, fluid leakage, paint transfer, panel misalignment)",
    )
    image_quality_limitations: List[str] = Field(
        default_factory=list,
        description="Limitations of this image (e.g. low resolution, night lighting, glare, oblique perspective, partial occlusion)",
    )
    confidence_score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Confidence score for this visual assessment based on visibility clarity",
    )
    uncertainty_notes: Optional[str] = None


class InconsistencyFinding(BaseModel):
    """Structured model representing an evidence discrepancy across documents."""
    discrepancy_id: str
    category: str  # date_time, location, vehicle_identity, narrative_fault, damage_severity, repair_costs
    field_name: str
    source_a: str
    value_a: str
    source_b: str
    value_b: str
    explanation: str
    severity: str  # low, medium, high, critical
    is_contradiction: bool = True  # True if genuine conflict, False if partial/missing info
    confidence: float = Field(0.8, ge=0.0, le=1.0)
    investigation_notes: Optional[str] = None


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
