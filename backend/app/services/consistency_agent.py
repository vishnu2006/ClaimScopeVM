import logging
import uuid
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from app.prompts import CONSISTENCY_CHECK_SYSTEM_PROMPT, get_consistency_check_user_prompt
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
                            discrepancy_id=f"disc_date_{uuid.uuid4().hex[:8]}",
                            field_name="incident_date",
                            category="date_time",
                            severity="high",
                            source_a="FNOL Incident Report",
                            value_a=str(fnol_date),
                            source_b="Police Collision Report",
                            value_b=str(police_date),
                            is_contradiction=True,
                            explanation=(
                                f"Accident dates differ between FNOL report ('{fnol_date}') and "
                                f"Police collision documentation ('{police_date}')."
                            ),
                            investigation_notes="Verify dispatch logs or date-stamped tow receipt to establish exact collision occurrence date.",
                        )
                    )

        # 2. VIN Discrepancy (Estimate vs Police Report / FNOL)
        vin_sources: Dict[str, str] = {}
        for doc_id, data in extractions.items():
            if not isinstance(data, dict):
                continue
            doc_type = doc_type_map.get(doc_id, "document")
            # Extract VIN from vehicles list or vehicle_info
            vehicles = data.get("vehicles") or data.get("vehicles_involved") or []
            if isinstance(vehicles, list) and vehicles:
                for v in vehicles:
                    cand_vin = v.get("vin") if isinstance(v, dict) else None
                    if cand_vin and isinstance(cand_vin, dict):
                        cand_vin = cand_vin.get("value")
                    if cand_vin and len(str(cand_vin).strip()) >= 10:
                        vin_sources[f"{doc_type}"] = str(cand_vin).strip().upper()
                        break
            v_info = data.get("vehicle_info")
            if isinstance(v_info, dict) and v_info.get("vin"):
                v_cand = v_info.get("vin")
                if isinstance(v_cand, dict):
                    v_cand = v_cand.get("value")
                if v_cand and len(str(v_cand).strip()) >= 10:
                    vin_sources[f"{doc_type}"] = str(v_cand).strip().upper()

        if len(set(vin_sources.values())) > 1:
            sources = list(vin_sources.keys())
            discrepancies.append(
                InconsistencyFinding(
                    discrepancy_id=f"disc_vin_{uuid.uuid4().hex[:8]}",
                    field_name="vehicle_identification_number",
                    category="vehicle_identity",
                    severity="critical",
                    source_a=f"{sources[0].replace('_', ' ').title()}",
                    value_a=vin_sources[sources[0]],
                    source_b=f"{sources[1].replace('_', ' ').title()}",
                    value_b=vin_sources[sources[1]],
                    is_contradiction=True,
                    explanation=(
                        f"Inconsistent Vehicle Identification Numbers (VINs) cited across submitted claim records: "
                        f"{vin_sources[sources[0]]} vs {vin_sources[sources[1]]}."
                    ),
                    investigation_notes="Adjuster must inspect vehicle door jamb B-pillar VIN tag or vehicle title prior to total settlement authorization.",
                )
            )

        # 3. Location Discrepancy
        if fnol_data and police_data:
            loc_fnol = fnol_data.get("incident_location")
            if isinstance(loc_fnol, dict) and "value" in loc_fnol:
                loc_fnol = loc_fnol.get("value")
            loc_police = police_data.get("incident_location")
            if isinstance(loc_police, dict) and "value" in loc_police:
                loc_police = loc_police.get("value")

            str_fnol = str(loc_fnol.get("address") if isinstance(loc_fnol, dict) else loc_fnol or "")
            str_police = str(loc_police.get("address") if isinstance(loc_police, dict) else loc_police or "")

            if str_fnol and str_police:
                norm_fnol_loc = self._normalize_string(str_fnol)
                norm_police_loc = self._normalize_string(str_police)
                # Check for significant mismatch (excluding common directional abbreviations)
                if len(norm_fnol_loc) > 5 and len(norm_police_loc) > 5:
                    if norm_fnol_loc not in norm_police_loc and norm_police_loc not in norm_fnol_loc:
                        discrepancies.append(
                            InconsistencyFinding(
                                discrepancy_id=f"disc_loc_{uuid.uuid4().hex[:8]}",
                                field_name="incident_location",
                                category="location_discrepancy",
                                severity="medium",
                                source_a="FNOL Report",
                                value_a=str_fnol,
                                source_b="Police Collision Report",
                                value_b=str_police,
                                is_contradiction=True,
                                explanation=f"Reported collision scene location differs: '{str_fnol}' vs '{str_police}'.",
                                investigation_notes="Verify precise mile marker or intersection from officer CAD CAD report notes.",
                            )
                        )

        return discrepancies

    async def detect_semantic_discrepancies(
        self,
        extractions: Dict[str, Any],
        vision_observations: Dict[str, PhotoDamageAnalysis],
        doc_type_map: Dict[str, str],
    ) -> List[InconsistencyFinding]:
        """Detect subtle narrative contradictions and damage severity conflicts using Gemini."""
        evidence_summary_blocks: List[str] = []

        for doc_id, data in extractions.items():
            if not isinstance(data, dict):
                continue
            doc_type = doc_type_map.get(doc_id, "Document")
            desc = data.get("incident_description") or data.get("narrative")
            if isinstance(desc, dict):
                desc = desc.get("value")
            damages = data.get("property_damage") or data.get("identified_damage_regions")
            if isinstance(damages, dict):
                damages = damages.get("value")
            summary = (
                f"Document: {doc_type.upper()} (ID: {doc_id[:8]})\n"
                f"- Narrative: {desc or 'N/A'}\n"
                f"- Reported Damage: {damages or 'N/A'}"
            )
            evidence_summary_blocks.append(summary)

        for photo_id, vision in vision_observations.items():
            evidence_summary_blocks.append(
                f"Evidence: PHOTOGRAPH (ID: {photo_id[:8]})\n"
                f"- Visible Area: {vision.visible_vehicle_region}\n"
                f"- Assessed Severity: {vision.severity_category}\n"
                f"- Observed Damages: {', '.join(vision.observable_damage)}\n"
                f"- Supporting Observations: {', '.join(vision.supporting_visual_observations)}"
            )

        combined_evidence = "\n\n".join(evidence_summary_blocks)

        system_prompt = CONSISTENCY_CHECK_SYSTEM_PROMPT

        try:
            provider = self.llm or get_llm_provider()
            prompt = get_consistency_check_user_prompt(combined_evidence)
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
