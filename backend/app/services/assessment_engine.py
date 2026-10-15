import logging
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from app.schemas.case_state import (
    AssessmentResult,
    CaseState,
    InconsistencyFinding,
    PhotoDamageAnalysis,
    TriggeredRule,
    WebVerificationResult,
)


class ClaimAssessmentEngine:
    """Hybrid Deterministic + Explainable Assessment Engine for Auto Accident Claims.
    Grounded in authentic US P&C Auto insurance adjuster standards, SIU indicator
    frameworks, and NAIC unfair claims settlement practices.

    Outcomes:
    - ROUTINE_REVIEW: All evidence consistent, minor/moderate damage, complete documentation.
    - ADDITIONAL_INFORMATION_REQUIRED: Missing essential documents, unverified vehicle/weather details.
    - ESCALATE_FOR_HUMAN_REVIEW: Material contradictions, VIN mismatches, geometry conflicts, or staged crash red flags.

    GUARANTEE: ClaimScope assists human adjusters. It never independently approves, denies,
    determines legal liability, or labels a claim fraudulent."""

    def evaluate(self, state: CaseState) -> AssessmentResult:
        triggered_rules: List[TriggeredRule] = []
        key_findings: List[str] = []
        flagged_reasons: List[str] = []
        recommended_actions: List[str] = []
        uncertainties: List[str] = []

        # -------------------------------------------------------------
        # 1. EVALUATE MATERIAL DISCREPANCIES (Deterministic)
        # -------------------------------------------------------------
        for inc in state.inconsistencies:
            # Check for VIN mismatch
            if inc.category == "vehicle_identity" or "vin" in inc.field_name.lower():
                triggered_rules.append(
                    TriggeredRule(
                        rule_id="TRG-VIN-02",
                        rule_name="Vehicle Identification Number Discrepancy",
                        category="vehicle_identity",
                        severity="critical",
                        description=f"Conflicting VINs detected across submitted records: {inc.value_a} ({inc.source_a}) vs {inc.value_b} ({inc.source_b}).",
                        supporting_evidence=[f"{inc.source_a}: {inc.value_a}", f"{inc.source_b}: {inc.value_b}"],
                        recommended_action="Conduct physical vehicle inspection to verify chassis VIN plate and dashboard sticker match policy records.",
                    )
                )
                flagged_reasons.append(f"Mismatched VIN across {inc.source_a} and {inc.source_b}")

            # Check for Material Narrative Contradiction
            elif inc.category == "narrative_fault" or "fault" in inc.field_name.lower() or "narrative" in inc.field_name.lower():
                triggered_rules.append(
                    TriggeredRule(
                        rule_id="TRG-MAT-01",
                        rule_name="Material Collision Narrative Contradiction",
                        category="narrative_fault",
                        severity="high",
                        description=f"Driver FNOL statement materially contradicts official police narrative: {inc.explanation}",
                        supporting_evidence=[f"{inc.source_a}: {inc.value_a}", f"{inc.source_b}: {inc.value_b}"],
                        recommended_action="Conduct recorded audio interview with insured regarding specific vehicle dynamics and point of first impact.",
                    )
                )
                flagged_reasons.append(f"Material narrative conflict: {inc.explanation}")

            # Check for Damage Geometry / Direction Mismatch
            elif inc.category in ["damage_severity", "damage_location"] or "damage" in inc.field_name.lower():
                triggered_rules.append(
                    TriggeredRule(
                        rule_id="TRG-SEV-03",
                        rule_name="Reported vs Observable Damage Geometry Mismatch",
                        category="damage_severity",
                        severity="high",
                        description=f"Reported damage description contradicts photographic or estimate evidence: {inc.explanation}",
                        supporting_evidence=[f"{inc.source_a}: {inc.value_a}", f"{inc.source_b}: {inc.value_b}"],
                        recommended_action="Inspect vehicle at certified repair facility for prior unrepaired damage or multi-incident signs.",
                    )
                )
                flagged_reasons.append(f"Damage geometry mismatch: {inc.explanation}")

            # Check for Date/Time/Location Mismatches
            elif inc.category in ["date_time", "location"]:
                triggered_rules.append(
                    TriggeredRule(
                        rule_id="TRG-TIM-05",
                        rule_name="Incident Temporal or Location Contradiction",
                        category=inc.category,
                        severity="medium",
                        description=f"Conflicting incident coordinates or timing: {inc.explanation}",
                        supporting_evidence=[f"{inc.source_a}: {inc.value_a}", f"{inc.source_b}: {inc.value_b}"],
                        recommended_action="Verify policy coverage active window against precise dispatch timestamp from CAD records.",
                    )
                )
                flagged_reasons.append(f"Incident temporal/location discrepancy: {inc.explanation}")

        # -------------------------------------------------------------
        # 2. EVALUATE EXTERNAL VERIFICATIONS (NHTSA, Weather, Benchmarks)
        # -------------------------------------------------------------
        for ver in state.web_verifications:
            if "DISCREPANCY" in ver.retrieved_information or "mismatch" in ver.retrieved_information.lower():
                triggered_rules.append(
                    TriggeredRule(
                        rule_id="TRG-EXT-06",
                        rule_name="External Database Verification Anomaly",
                        category="external_verification",
                        severity="high",
                        description=f"External source '{ver.source_name}' returned conflicting data: {ver.retrieved_information}",
                        supporting_evidence=[f"{ver.source_name}: {ver.retrieved_information}"],
                        recommended_action="Request registration renewal card and vehicle title to verify factory specifications.",
                    )
                )
                flagged_reasons.append(f"External verification anomaly: {ver.verification_question}")

            if "NOTABLE ANOMALY" in ver.retrieved_information:
                triggered_rules.append(
                    TriggeredRule(
                        rule_id="TRG-EXT-07",
                        rule_name="Meteorological Condition Contradiction",
                        category="weather_verification",
                        severity="medium",
                        description=ver.retrieved_information,
                        supporting_evidence=[f"{ver.source_name}: {ver.retrieved_information}"],
                        recommended_action="Request witness corroboration or 911 audio log regarding road surface conditions.",
                    )
                )
                flagged_reasons.append("Reported adverse weather contradicted by historical weather archive.")

        # -------------------------------------------------------------
        # 3. EVALUATE CRITICAL MISSING DOCUMENTATION
        # -------------------------------------------------------------
        has_severe_damage = any(
            v.severity_category in ["severe", "catastrophic_total_loss"]
            for v in state.vision_observations.values()
        )
        for missing in state.missing_documents:
            if "Police" in missing:
                rule_sev = "high" if has_severe_damage else "medium"
                triggered_rules.append(
                    TriggeredRule(
                        rule_id="TRG-DOC-04A",
                        rule_name="Missing Official Police Collision Report",
                        category="documentation",
                        severity=rule_sev,
                        description="Accident package lacks an official law enforcement collision report.",
                        supporting_evidence=["Incident Package Document Inventory"],
                        recommended_action="Request certified copy of police accident report from local law enforcement agency.",
                    )
                )
                flagged_reasons.append("Missing police collision report.")
            elif "Estimate" in missing:
                triggered_rules.append(
                    TriggeredRule(
                        rule_id="TRG-DOC-04B",
                        rule_name="Missing Certified Body Shop Estimate",
                        category="documentation",
                        severity="medium",
                        description="Package contains claimed damages without an itemized repair estimate or parts invoice.",
                        supporting_evidence=["Incident Package Document Inventory"],
                        recommended_action="Assign field appraiser or DRP network shop to write preliminary estimate.",
                    )
                )
                flagged_reasons.append("Missing itemized repair estimate.")

        # -------------------------------------------------------------
        # 4. EVALUATE PHOTOGRAPHIC DAMAGE & UNCERTAINTIES
        # -------------------------------------------------------------
        for doc_id, photo in state.vision_observations.items():
            if photo.severity_category == "catastrophic_total_loss":
                triggered_rules.append(
                    TriggeredRule(
                        rule_id="TRG-STR-08",
                        rule_name="Catastrophic Damage / Potential Total Loss Exposure",
                        category="damage_severity",
                        severity="high",
                        description=f"Visible damage indicates severe structural compromise in {photo.visible_vehicle_region}.",
                        supporting_evidence=[f"Photo {doc_id}: {photo.severity_explanation}"],
                        recommended_action="Assign total loss specialist and order salvage valuation comparison.",
                    )
                )
                key_findings.append(f"Severe photographic damage in {photo.visible_vehicle_region}.")

            # Record photo limitations
            if photo.image_quality_limitations:
                for lim in photo.image_quality_limitations:
                    uncertainties.append(f"Visual limitation ({photo.visible_vehicle_region}): {lim}")

        # Always include foundational physical damage limitation
        uncertainties.append(
            "Photographs alone cannot determine hidden structural frame alignment, internal suspension integrity, or definitive mechanical driveability."
        )

        # -------------------------------------------------------------
        # 5. SYNTHESIZE OUTCOME & RECOMMENDATION
        # -------------------------------------------------------------
        has_critical = any(r.severity == "critical" for r in triggered_rules)
        has_high = any(r.severity == "high" for r in triggered_rules)
        doc_count = len(state.documents)

        if has_critical or len([r for r in triggered_rules if r.severity == "high"]) >= 1:
            outcome = "ESCALATE_FOR_HUMAN_REVIEW"
            classification = "escalate"
            risk_score = 0.85 if has_critical else 0.70
            rationale = (
                "Material inconsistencies or critical identity/narrative contradictions detected across submitted records. "
                "Immediate adjuster interview and forensic verification required prior to coverage confirmation or payment authorization."
            )
        elif len(triggered_rules) > 0 or len(state.missing_documents) > 0 or doc_count < 2:
            outcome = "ADDITIONAL_INFORMATION_REQUIRED"
            classification = "flag_for_review"
            risk_score = 0.45
            rationale = (
                "Investigation package is missing supporting documentation or exhibits minor discrepancies that require "
                "supplementary records (e.g. police report, itemized estimate, or witness statements) to substantiate the claim."
            )
        else:
            outcome = "ROUTINE_REVIEW"
            classification = "routine"
            risk_score = 0.15
            rationale = (
                "Submitted documentation is mutually consistent across all source files. "
                "Vehicle identity, reported impact points, and visual damages align with standard loss dynamics."
            )

        # Collect unique recommended actions
        for rule in triggered_rules:
            if rule.recommended_action not in recommended_actions:
                recommended_actions.append(rule.recommended_action)

        if not recommended_actions:
            recommended_actions.append("Proceed with standard claim settlement and repair shop dispatch.")

        # Key findings summary
        key_findings.append(f"Evaluated {len(state.documents)} incident document(s) and {len(state.inconsistencies)} cross-reference point(s).")
        if state.web_verifications:
            key_findings.append(f"Conducted {len(state.web_verifications)} external public database verification check(s).")

        return AssessmentResult(
            outcome=outcome,
            classification=classification,
            risk_score=risk_score,
            rationale=rationale,
            triggered_rules=triggered_rules,
            key_findings=key_findings,
            flagged_reasons=flagged_reasons,
            recommendations=recommended_actions,
            recommended_adjuster_actions=recommended_actions,
            uncertainty_and_limitations=uncertainties,
            estimated_loss_range=None,
        )
