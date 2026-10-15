import logging
import uuid
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from app.schemas.evidence import InconsistencyFinding, PhotoDamageAnalysis
from app.services.llm_provider import ConfigurationError, LLMProvider, get_llm_provider

logger = logging.getLogger(__name__)


class SemanticComparisonOutput(BaseModel):
    inconsistencies: List[InconsistencyFinding] = Field(default_factory=list)


class CrossDocumentConsistencyAgent:
    """Agent that performs multi-document cross-referencing and contradiction detection.
    Combines deterministic logic for structured identifiers and Gemini semantic analysis
    for narrative and damage descriptions."""

    def __init__(self, llm_provider: Optional[LLMProvider] = None):
        self.llm = llm_provider

    def _normalize_string(self, s: Optional[str]) -> str:
        if not s:
            return ""
        return "".join(c.lower() for c in s if c.isalnum())

    def detect_deterministic_discrepancies(
        self,
        extractions: Dict[str, Any],
        doc_type_map: Dict[str, str],
    ) -> List[InconsistencyFinding]:
        """Detect direct factual discrepancies in dates, locations, VINs, and plates."""
        discrepancies: List[InconsistencyFinding] = []

        fnol_id = next((k for k, v in doc_type_map.items() if v == "fnol"), None)
        police_id = next((k for k, v in doc_type_map.items() if v == "police_report"), None)
        estimate_id = next((k for k, v in doc_type_map.items() if v == "repair_estimate"), None)

        fnol_data = extractions.get(fnol_id or "") if fnol_id else None
        police_data = extractions.get(police_id or "") if police_id else None
        estimate_data = extractions.get(estimate_id or "") if estimate_id else None

        # 1. Date Discrepancy (FNOL vs Police Report)
        if fnol_data and police_data:
            fnol_date = (
                fnol_data.get("incident_date", {}).get("value")
                if isinstance(fnol_data.get("incident_date"), dict)
                else fnol_data.get("incident_date")
            )
            police_date = (
                police_data.get("incident_date", {}).get("value")
                if isinstance(police_data.get("incident_date"), dict)
                else police_data.get("incident_date")
            )

            if fnol_date and police_date:
                norm_fnol_date = self._normalize_string(str(fnol_date))
                norm_police_date = self._normalize_string(str(police_date))
                if norm_fnol_date and norm_police_date and norm_fnol_date != norm_police_date:
                    discrepancies.append(
                        InconsistencyFinding(
                            discrepancy_id=str(uuid.uuid4())[:8],
                            category="date_time",
                            field_name="incident_date",
                            source_a=f"FNOL: {fnol_date}",
                            value_a=str(fnol_date),
                            source_b=f"Police Report: {police_date}",
                            value_b=str(police_date),
                            explanation="Incident date reported in the First Notice of Loss conflicts with official police collision report date.",
                            severity="high",
                            is_contradiction=True,
                            confidence=0.95,
                            investigation_notes="Verify dispatch logs or towing invoices to confirm the true incident timeline.",
                        )
                    )

        # 2. Vehicle Identification (VIN Mismatch)
        # Gather VINs across available documents
        vin_sources = []
        if fnol_data:
            vehicles = fnol_data.get("vehicles") or []
            if isinstance(vehicles, list) and vehicles:
                v0 = vehicles[0]
                if isinstance(v0, dict) and v0.get("vin"):
                    vin_sources.append(("FNOL", str(v0.get("vin")).strip().upper()))
        if police_data:
            vehicles = police_data.get("vehicles_involved") or []
            if isinstance(vehicles, list) and vehicles:
                v0 = vehicles[0]
                if isinstance(v0, dict) and v0.get("vin"):
                    vin_sources.append(("Police Report", str(v0.get("vin")).strip().upper()))
        if estimate_data:
            v_info = estimate_data.get("vehicle_info") or {}
            if isinstance(v_info, dict) and v_info.get("vin"):
                vin_sources.append(("Repair Estimate", str(v_info.get("vin")).strip().upper()))

        if len(vin_sources) >= 2:
            src1_name, src1_vin = vin_sources[0]
            for src2_name, src2_vin in vin_sources[1:]:
                # Only compare if both have valid VIN strings > 8 chars
                if len(src1_vin) > 8 and len(src2_vin) > 8 and src1_vin != src2_vin:
                    discrepancies.append(
                        InconsistencyFinding(
                            discrepancy_id=str(uuid.uuid4())[:8],
                            category="vehicle_identity",
                            field_name="vehicle_vin",
                            source_a=f"{src1_name}: {src1_vin}",
                            value_a=src1_vin,
                            source_b=f"{src2_name}: {src2_vin}",
                            value_b=src2_vin,
                            explanation=f"Vehicle Identification Number (VIN) differs between {src1_name} and {src2_name}.",
                            severity="critical",
                            is_contradiction=True,
                            confidence=0.98,
                            investigation_notes="Check physical VIN plate or vehicle registration to confirm coverage matches the insured asset.",
                        )
                    )

        return discrepancies

    async def detect_semantic_discrepancies(
        self,
        extractions: Dict[str, Any],
        vision_observations: Dict[str, PhotoDamageAnalysis],
        doc_type_map: Dict[str, str],
    ) -> List[InconsistencyFinding]:
        """Detect narrative, damage description, and photographic severity discrepancies via Gemini."""
        # Check if we have multiple sources to compare
        has_multiple = (len(extractions) + len(vision_observations)) >= 2
        if not has_multiple:
            return []

        # Prepare evidence summaries for comparison
        evidence_summary_blocks = []

        for doc_id, data in extractions.items():
            dtype = doc_type_map.get(doc_id, "document")
            evidence_summary_blocks.append(f"### DOCUMENT [{dtype.upper()} - ID: {doc_id[:8]}]:\n{data}")

        for doc_id, vision in vision_observations.items():
            evidence_summary_blocks.append(
                f"### PHOTOGRAPHIC DAMAGE ANALYSIS [Photo ID: {doc_id[:8]}]:\n"
                f"- Visible Region: {vision.visible_vehicle_region}\n"
                f"- Apparent Severity: {vision.severity_category}\n"
                f"- Severity Explanation: {vision.severity_explanation}\n"
                f"- Observable Damage: {', '.join(vision.observable_damage)}\n"
                f"- Affected Components: {', '.join(vision.affected_components)}\n"
                f"- Supporting Observations: {', '.join(vision.supporting_visual_observations)}"
            )

        combined_evidence = "\n\n".join(evidence_summary_blocks)

        system_prompt = """You are an objective claims discrepancy investigator for US P&C Auto Insurance.
Cross-reference the submitted evidence pieces and identify genuine factual contradictions.

DISCREPANCY DOMAINS:
1. Reported Damage vs Photographic Evidence: e.g., FNOL reports 'minor bumper scratch', but damage photo reveals 'severe: crushed quarter panel and deployed airbags'.
2. Collision Story / Narrative Conflict: e.g., FNOL claims single-vehicle collision with pole, but police report describes two-vehicle intersection collision.
3. Impact Location Conflict: e.g., FNOL claims rear-end impact, but photo/estimate shows front-end damage.
4. Parties / Driver Conflict: e.g., different driver named in police report vs FNOL.

GUARDRAILS & ETHICAL CONSTRAINTS:
- Identify ONLY factual conflicts between sources.
- An inconsistency is NOT proof of fraud or bad faith; treat it as an evidentiary discrepancy requiring adjuster clarification.
- Distinguish between actual contradictions vs simple omission / missing information.
- Severity levels: 'low' (minor detail/time variance), 'medium' (part description/scope difference), 'high' (opposing collision accounts or severe damage under-reporting), 'critical' (vehicle identity conflict).
"""

        try:
            provider = self.llm or get_llm_provider()
            prompt = (
                "Review the following claims evidence extracted from distinct documents and photographs. "
                "List all genuine factual inconsistencies and contradictions:\n\n"
                f"{combined_evidence}"
            )
            result = await provider.extract_structured(
                text=prompt,
                system_prompt=system_prompt,
                response_model=SemanticComparisonOutput,
            )
            return result.inconsistencies
        except ConfigurationError:
            logger.info("Gemini provider not configured; skipping semantic cross-referencing.")
            return []
        except Exception as e:
            logger.error(f"Error during semantic consistency evaluation: {e}")
            return []

    async def evaluate_consistency(
        self,
        extractions: Dict[str, Any],
        vision_observations: Dict[str, PhotoDamageAnalysis],
        doc_type_map: Dict[str, str],
    ) -> List[InconsistencyFinding]:
        """Run both deterministic and semantic consistency checks across all package documents."""
        # 1. Deterministic checks
        discrepancies = self.detect_deterministic_discrepancies(extractions, doc_type_map)

        # 2. Semantic checks via Gemini (if provider available)
        semantic_discrepancies = await self.detect_semantic_discrepancies(
            extractions, vision_observations, doc_type_map
        )

        # Merge findings avoiding duplicate field names
        existing_keys = {(d.category, d.field_name) for d in discrepancies}
        for sd in semantic_discrepancies:
            if (sd.category, sd.field_name) not in existing_keys:
                discrepancies.append(sd)
                existing_keys.add((sd.category, sd.field_name))

        return discrepancies
