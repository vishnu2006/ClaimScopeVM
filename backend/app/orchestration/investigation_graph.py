import logging
import os
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from langgraph.graph import END, StateGraph

from app.schemas.case_state import (
    AgentExecutionRecord,
    AssessmentResult,
    CaseState,
    CrossReferenceResult,
    DocumentInventoryItem,
    ProcessingError,
    ProcessingLogEntry,
    WebVerificationResult,
)
from app.schemas.common import DocumentType
from app.schemas.evidence import (
    FNOLExtraction,
    InconsistencyFinding,
    PhotoDamageAnalysis,
    PoliceReportExtraction,
    RepairEstimateExtraction,
)
from app.services.assessment_engine import ClaimAssessmentEngine
from app.services.consistency_agent import CrossDocumentConsistencyAgent
from app.services.document_classifier import DocumentClassifier
from app.services.document_processor import DocumentProcessor
from app.services.external_verifier import ExternalVerificationService
from app.services.fnol_extractor import FNOLExtractor
from app.services.llm_provider import ConfigurationError, LLMProvider, get_llm_provider
from app.services.police_report_extractor import PoliceReportExtractor
from app.services.repair_estimate_extractor import RepairEstimateExtractor
from app.services.vision_extractor import VehicleDamageVisionAgent

logger = logging.getLogger(__name__)


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


class ClaimInvestigationOrchestrator:
    """Adaptive LangGraph-powered Claims Investigation Engine.
    Dynamically routes across document extractors, vision agents, and
    cross-document consistency analyzers based on package composition."""

    def __init__(self, llm_provider: Optional[LLMProvider] = None):
        self.llm_provider = llm_provider
        self.processor = DocumentProcessor()
        self.classifier = DocumentClassifier(self.processor)
        self.verifier = ExternalVerificationService()
        self.assessment_engine = ClaimAssessmentEngine()

    def _get_provider(self) -> Optional[LLMProvider]:
        if self.llm_provider:
            return self.llm_provider
        try:
            return get_llm_provider()
        except ConfigurationError:
            return None

    # -------------------------------------------------------------
    # GRAPH NODES
    # -------------------------------------------------------------

    async def intake_and_classification_node(self, state: CaseState) -> Dict[str, Any]:
        """Node 1: Inspects documents, executes content classification for unclassified files."""
        updated_docs: List[DocumentInventoryItem] = []
        logs: List[ProcessingLogEntry] = list(state.processing_log)

        logs.append(
            ProcessingLogEntry(
                stage="intake",
                message=f"Intake started with {len(state.documents)} documents in case package.",
            )
        )

        for doc in state.documents:
            # Re-classify if unknown or generic
            if doc.document_type in [DocumentType.UNKNOWN.value, "unknown", DocumentType.OTHER.value]:
                classification = self.classifier.classify_by_content(doc.file_path)
                doc.document_type = classification.document_type.value
                doc.classification_confidence = classification.confidence
                logs.append(
                    ProcessingLogEntry(
                        stage="intake",
                        message=f"Classified '{doc.filename}' as {doc.document_type} (conf: {classification.confidence:.2f}).",
                    )
                )
            updated_docs.append(doc)

        return {
            "documents": updated_docs,
            "processing_log": logs,
            "current_stage": "intake_complete",
            "stages_completed": list(state.stages_completed) + ["intake_classification"],
        }

    async def supervisor_routing_node(self, state: CaseState) -> Dict[str, Any]:
        """Node 2: Supervisor inspects package composition and creates adaptive execution plan."""
        doc_types = [d.document_type for d in state.documents]
        has_fnol = any(t == DocumentType.FNOL.value for t in doc_types)
        has_police = any(t == DocumentType.POLICE_REPORT.value for t in doc_types)
        has_estimate = any(t == DocumentType.REPAIR_ESTIMATE.value for t in doc_types)
        has_photos = any(t == DocumentType.PHOTO.value for t in doc_types)

        executions: List[AgentExecutionRecord] = list(state.agent_executions)
        skipped: List[str] = list(state.stages_skipped)
        missing_docs: List[str] = []
        logs: List[ProcessingLogEntry] = list(state.processing_log)

        # Plan FNOL
        if not has_fnol:
            executions.append(
                AgentExecutionRecord(
                    agent_id="fnol_extractor",
                    display_name="First Notice of Loss (FNOL) Extractor",
                    status="skipped",
                    skip_reason="No First Notice of Loss document submitted in incident package.",
                )
            )
            skipped.append("fnol_extraction")
            missing_docs.append("First Notice of Loss (FNOL)")

        # Plan Police Report
        if not has_police:
            executions.append(
                AgentExecutionRecord(
                    agent_id="police_extractor",
                    display_name="Police Collision Report Extractor",
                    status="skipped",
                    skip_reason="No police collision report submitted in incident package.",
                )
            )
            skipped.append("police_extraction")
            missing_docs.append("Official Police Collision Report")

        # Plan Repair Estimate
        if not has_estimate:
            executions.append(
                AgentExecutionRecord(
                    agent_id="estimate_extractor",
                    display_name="Repair Estimate & Parts Extractor",
                    status="skipped",
                    skip_reason="No body shop repair estimate or itemized parts invoice attached.",
                )
            )
            skipped.append("estimate_extraction")
            missing_docs.append("Collision Repair Estimate")

        # Plan Vision Agent
        if not has_photos:
            executions.append(
                AgentExecutionRecord(
                    agent_id="vision_agent",
                    display_name="Vehicle Damage Vision Agent",
                    status="skipped",
                    skip_reason="No accident scene or damage photographs provided.",
                )
            )
            skipped.append("vision_analysis")
            missing_docs.append("Accident Photographs")

        # Plan Consistency Agent
        total_sources = sum([has_fnol, has_police, has_estimate, has_photos])
        if total_sources < 2:
            executions.append(
                AgentExecutionRecord(
                    agent_id="consistency_agent",
                    display_name="Cross-Document Consistency Agent",
                    status="skipped",
                    skip_reason=f"Insufficient evidence sources ({total_sources}/2 needed for cross-referencing).",
                )
            )
            skipped.append("cross_referencing")

        logs.append(
            ProcessingLogEntry(
                stage="supervisor",
                message=f"Supervisor planned execution. Active: {total_sources} source categories. Missing: {len(missing_docs)} categories.",
            )
        )

        return {
            "agent_executions": executions,
            "stages_skipped": skipped,
            "missing_documents": missing_docs,
            "processing_log": logs,
            "current_stage": "routing_complete",
            "stages_completed": list(state.stages_completed) + ["supervisor_routing"],
        }

    async def fnol_agent_node(self, state: CaseState) -> Dict[str, Any]:
        """Node 3: Extracts structured First Notice of Loss data."""
        started_at = _utc_now()
        provider = self._get_provider()
        extractions = dict(state.extractions)
        executions = list(state.agent_executions)
        errors = list(state.errors)
        logs = list(state.processing_log)

        fnol_docs = [d for d in state.documents if d.document_type == DocumentType.FNOL.value]
        if not fnol_docs:
            return {}

        fnol_doc = fnol_docs[0]
        logs.append(ProcessingLogEntry(stage="fnol_extractor", message=f"Parsing FNOL from {fnol_doc.filename}..."))

        if not provider:
            executions.append(
                AgentExecutionRecord(
                    agent_id="fnol_extractor",
                    display_name="First Notice of Loss (FNOL) Extractor",
                    status="failed",
                    started_at=started_at,
                    completed_at=_utc_now(),
                    error_message="GEMINI_API_KEY is not configured in backend/.env.",
                )
            )
            errors.append(ProcessingError(stage="fnol_extraction", error_message="GEMINI_API_KEY is unconfigured."))
            return {"agent_executions": executions, "errors": errors, "processing_log": logs}

        try:
            # Extract text
            extract_res = self.processor.extract_text_from_pdf(fnol_doc.file_path)
            text = extract_res.get("text", "")
            if not text:
                text = await self.processor.transcribe_scanned_document(fnol_doc.file_path, provider)

            extractor = FNOLExtractor(provider)
            fnol_result = await extractor.extract(text, fnol_doc.filename)
            extractions[fnol_doc.document_id] = fnol_result.model_dump()

            executions.append(
                AgentExecutionRecord(
                    agent_id="fnol_extractor",
                    display_name="First Notice of Loss (FNOL) Extractor",
                    status="completed",
                    started_at=started_at,
                    completed_at=_utc_now(),
                    details={"document_id": fnol_doc.document_id, "fields_extracted": len(extractions[fnol_doc.document_id])},
                )
            )
            logs.append(ProcessingLogEntry(stage="fnol_extractor", message="FNOL extraction completed successfully."))
        except Exception as e:
            logger.error(f"FNOL extraction error: {e}")
            executions.append(
                AgentExecutionRecord(
                    agent_id="fnol_extractor",
                    display_name="First Notice of Loss (FNOL) Extractor",
                    status="failed",
                    started_at=started_at,
                    completed_at=_utc_now(),
                    error_message=str(e),
                )
            )
            errors.append(ProcessingError(stage="fnol_extraction", error_message=str(e), document_id=fnol_doc.document_id))

        return {
            "extractions": extractions,
            "agent_executions": executions,
            "errors": errors,
            "processing_log": logs,
            "stages_completed": list(state.stages_completed) + ["fnol_extraction"],
        }

    async def police_agent_node(self, state: CaseState) -> Dict[str, Any]:
        """Node 4: Extracts structured Police Traffic Collision Report data."""
        started_at = _utc_now()
        provider = self._get_provider()
        extractions = dict(state.extractions)
        executions = list(state.agent_executions)
        errors = list(state.errors)
        logs = list(state.processing_log)

        police_docs = [d for d in state.documents if d.document_type == DocumentType.POLICE_REPORT.value]
        if not police_docs:
            return {}

        police_doc = police_docs[0]
        logs.append(ProcessingLogEntry(stage="police_extractor", message=f"Parsing Police Report from {police_doc.filename}..."))

        if not provider:
            executions.append(
                AgentExecutionRecord(
                    agent_id="police_extractor",
                    display_name="Police Collision Report Extractor",
                    status="failed",
                    started_at=started_at,
                    completed_at=_utc_now(),
                    error_message="GEMINI_API_KEY is not configured.",
                )
            )
            errors.append(ProcessingError(stage="police_extraction", error_message="GEMINI_API_KEY is unconfigured."))
            return {"agent_executions": executions, "errors": errors, "processing_log": logs}

        try:
            extract_res = self.processor.extract_text_from_pdf(police_doc.file_path)
            text = extract_res.get("text", "")
            if not text:
                text = await self.processor.transcribe_scanned_document(police_doc.file_path, provider)

            extractor = PoliceReportExtractor(provider)
            police_result = await extractor.extract(text, police_doc.filename)
            extractions[police_doc.document_id] = police_result.model_dump()

            executions.append(
                AgentExecutionRecord(
                    agent_id="police_extractor",
                    display_name="Police Collision Report Extractor",
                    status="completed",
                    started_at=started_at,
                    completed_at=_utc_now(),
                    details={"document_id": police_doc.document_id},
                )
            )
            logs.append(ProcessingLogEntry(stage="police_extractor", message="Police report extraction completed."))
        except Exception as e:
            logger.error(f"Police extraction error: {e}")
            executions.append(
                AgentExecutionRecord(
                    agent_id="police_extractor",
                    display_name="Police Collision Report Extractor",
                    status="failed",
                    started_at=started_at,
                    completed_at=_utc_now(),
                    error_message=str(e),
                )
            )
            errors.append(ProcessingError(stage="police_extraction", error_message=str(e), document_id=police_doc.document_id))

        return {
            "extractions": extractions,
            "agent_executions": executions,
            "errors": errors,
            "processing_log": logs,
            "stages_completed": list(state.stages_completed) + ["police_extraction"],
        }

    async def estimate_agent_node(self, state: CaseState) -> Dict[str, Any]:
        """Node 5: Extracts structured collision repair estimate and parts line items."""
        started_at = _utc_now()
        provider = self._get_provider()
        extractions = dict(state.extractions)
        executions = list(state.agent_executions)
        errors = list(state.errors)
        logs = list(state.processing_log)

        estimate_docs = [d for d in state.documents if d.document_type == DocumentType.REPAIR_ESTIMATE.value]
        if not estimate_docs:
            return {}

        estimate_doc = estimate_docs[0]
        logs.append(ProcessingLogEntry(stage="estimate_extractor", message=f"Parsing Estimate from {estimate_doc.filename}..."))

        if not provider:
            executions.append(
                AgentExecutionRecord(
                    agent_id="estimate_extractor",
                    display_name="Repair Estimate & Parts Extractor",
                    status="failed",
                    started_at=started_at,
                    completed_at=_utc_now(),
                    error_message="GEMINI_API_KEY is not configured.",
                )
            )
            errors.append(ProcessingError(stage="estimate_extraction", error_message="GEMINI_API_KEY is unconfigured."))
            return {"agent_executions": executions, "errors": errors, "processing_log": logs}

        try:
            extract_res = self.processor.extract_text_from_pdf(estimate_doc.file_path)
            text = extract_res.get("text", "")
            if not text:
                text = await self.processor.transcribe_scanned_document(estimate_doc.file_path, provider)

            extractor = RepairEstimateExtractor(provider)
            estimate_result = await extractor.extract(text, estimate_doc.filename)
            extractions[estimate_doc.document_id] = estimate_result.model_dump()

            executions.append(
                AgentExecutionRecord(
                    agent_id="estimate_extractor",
                    display_name="Repair Estimate & Parts Extractor",
                    status="completed",
                    started_at=started_at,
                    completed_at=_utc_now(),
                    details={"document_id": estimate_doc.document_id},
                )
            )
            logs.append(ProcessingLogEntry(stage="estimate_extractor", message="Repair estimate extraction completed."))
        except Exception as e:
            logger.error(f"Estimate extraction error: {e}")
            executions.append(
                AgentExecutionRecord(
                    agent_id="estimate_extractor",
                    display_name="Repair Estimate & Parts Extractor",
                    status="failed",
                    started_at=started_at,
                    completed_at=_utc_now(),
                    error_message=str(e),
                )
            )
            errors.append(ProcessingError(stage="estimate_extraction", error_message=str(e), document_id=estimate_doc.document_id))

        return {
            "extractions": extractions,
            "agent_executions": executions,
            "errors": errors,
            "processing_log": logs,
            "stages_completed": list(state.stages_completed) + ["estimate_extraction"],
        }

    async def vision_agent_node(self, state: CaseState) -> Dict[str, Any]:
        """Node 6: Analyzes vehicle accident photographs using Gemini multimodal vision."""
        started_at = _utc_now()
        provider = self._get_provider()
        vision_obs = dict(state.vision_observations)
        executions = list(state.agent_executions)
        errors = list(state.errors)
        logs = list(state.processing_log)

        photos = [d for d in state.documents if d.document_type == DocumentType.PHOTO.value]
        if not photos:
            return {}

        logs.append(ProcessingLogEntry(stage="vision_agent", message=f"Analyzing {len(photos)} accident photos..."))

        if not provider:
            executions.append(
                AgentExecutionRecord(
                    agent_id="vision_agent",
                    display_name="Vehicle Damage Vision Agent",
                    status="failed",
                    started_at=started_at,
                    completed_at=_utc_now(),
                    error_message="GEMINI_API_KEY is not configured.",
                )
            )
            errors.append(ProcessingError(stage="vision_analysis", error_message="GEMINI_API_KEY is unconfigured."))
            return {"agent_executions": executions, "errors": errors, "processing_log": logs}

        vision_agent = VehicleDamageVisionAgent(provider)
        analyzed_count = 0

        for photo in photos:
            try:
                analysis = await vision_agent.analyze_photo(
                    file_path=photo.file_path,
                    filename=photo.filename,
                )
                vision_obs[photo.document_id] = analysis
                analyzed_count += 1
                logs.append(
                    ProcessingLogEntry(
                        stage="vision_agent",
                        message=f"Photo '{photo.filename}' evaluated as {analysis.severity_category.upper()} (conf: {analysis.confidence_score:.2f}).",
                    )
                )
            except Exception as e:
                logger.error(f"Vision error on {photo.filename}: {e}")
                errors.append(ProcessingError(stage="vision_analysis", error_message=str(e), document_id=photo.document_id))

        executions.append(
            AgentExecutionRecord(
                agent_id="vision_agent",
                display_name="Vehicle Damage Vision Agent",
                status="completed" if analyzed_count > 0 else "failed",
                started_at=started_at,
                completed_at=_utc_now(),
                details={"photos_analyzed": analyzed_count, "total_photos": len(photos)},
            )
        )

        return {
            "vision_observations": vision_obs,
            "agent_executions": executions,
            "errors": errors,
            "processing_log": logs,
            "stages_completed": list(state.stages_completed) + ["vision_analysis"],
        }

    async def consistency_agent_node(self, state: CaseState) -> Dict[str, Any]:
        """Node 7: Cross-references facts across all present documents and photos."""
        started_at = _utc_now()
        provider = self._get_provider()
        executions = list(state.agent_executions)
        logs = list(state.processing_log)
        errors = list(state.errors)

        doc_type_map = {d.document_id: d.document_type for d in state.documents}
        consistency_agent = CrossDocumentConsistencyAgent(provider)

        logs.append(ProcessingLogEntry(stage="consistency_agent", message="Running cross-document consistency checks..."))

        try:
            findings = await consistency_agent.evaluate_consistency(
                extractions=state.extractions,
                vision_observations=state.vision_observations,
                doc_type_map=doc_type_map,
            )

            # Map into CrossReferenceResult for backwards compatibility
            cross_refs = [
                CrossReferenceResult(
                    field_name=f.field_name,
                    category=f.category,
                    is_consistent=not f.is_contradiction,
                    source_a=f.source_a,
                    value_a=f.value_a,
                    source_b=f.source_b,
                    value_b=f.value_b,
                    discrepancy_description=f.explanation,
                    severity=f.severity,
                )
                for f in findings
            ]

            executions.append(
                AgentExecutionRecord(
                    agent_id="consistency_agent",
                    display_name="Cross-Document Consistency Agent",
                    status="completed",
                    started_at=started_at,
                    completed_at=_utc_now(),
                    details={"discrepancies_detected": len(findings)},
                )
            )

            logs.append(
                ProcessingLogEntry(
                    stage="consistency_agent",
                    message=f"Consistency evaluation complete. Detected {len(findings)} review items.",
                )
            )

            return {
                "inconsistencies": findings,
                "cross_references": cross_refs,
                "agent_executions": executions,
                "processing_log": logs,
                "stages_completed": list(state.stages_completed) + ["cross_referencing"],
            }
        except Exception as e:
            logger.error(f"Consistency agent error: {e}")
            executions.append(
                AgentExecutionRecord(
                    agent_id="consistency_agent",
                    display_name="Cross-Document Consistency Agent",
                    status="failed",
                    started_at=started_at,
                    completed_at=_utc_now(),
                    error_message=str(e),
                )
            )
            errors.append(ProcessingError(stage="cross_referencing", error_message=str(e)))
            return {
                "agent_executions": executions,
                "errors": errors,
                "processing_log": logs,
            }

    async def external_verifier_node(self, state: CaseState) -> Dict[str, Any]:
        """Node 7: Selectively queries external authoritative databases (NHTSA, Open-Meteo, CCC benchmarks)."""
        started_at = _utc_now()
        executions = list(state.agent_executions)
        logs = list(state.processing_log)
        verifications: List[WebVerificationResult] = list(state.web_verifications)

        logs.append(ProcessingLogEntry(stage="external_verifier", message="Evaluating selective external verification triggers..."))

        # Find 17-character VIN
        vin_to_verify = None
        rep_year, rep_make, rep_model = None, None, None
        for doc_id, data in state.extractions.items():
            if not isinstance(data, dict):
                continue
            vehicles = data.get("vehicles") or data.get("vehicles_involved") or []
            if isinstance(vehicles, list):
                for v in vehicles:
                    if isinstance(v, dict):
                        cand_vin = v.get("vin")
                        if cand_vin and isinstance(cand_vin, dict):
                            cand_vin = cand_vin.get("value")
                        if cand_vin and len(str(cand_vin).strip()) == 17:
                            vin_to_verify = str(cand_vin).strip()
                            rep_year = v.get("year", {}).get("value") if isinstance(v.get("year"), dict) else v.get("year")
                            rep_make = v.get("make", {}).get("value") if isinstance(v.get("make"), dict) else v.get("make")
                            rep_model = v.get("model", {}).get("value") if isinstance(v.get("model"), dict) else v.get("model")
                            break
            v_info = data.get("vehicle_info")
            if isinstance(v_info, dict):
                cand_vin = v_info.get("vin")
                if cand_vin and isinstance(cand_vin, dict):
                    cand_vin = cand_vin.get("value")
                if cand_vin and len(str(cand_vin).strip()) == 17:
                    vin_to_verify = str(cand_vin).strip()
                    rep_year = rep_year or (v_info.get("year", {}).get("value") if isinstance(v_info.get("year"), dict) else v_info.get("year"))
                    rep_make = rep_make or (v_info.get("make", {}).get("value") if isinstance(v_info.get("make"), dict) else v_info.get("make"))
                    rep_model = rep_model or (v_info.get("model", {}).get("value") if isinstance(v_info.get("model"), dict) else v_info.get("model"))

        # 1. NHTSA VIN Verification
        if vin_to_verify:
            logs.append(ProcessingLogEntry(stage="external_verifier", message=f"Triggering NHTSA VIN verification for {vin_to_verify}..."))
            vin_res = await self.verifier.verify_vin(
                vin=vin_to_verify,
                reported_year=str(rep_year) if rep_year else None,
                reported_make=str(rep_make) if rep_make else None,
                reported_model=str(rep_model) if rep_model else None,
            )
            verifications.append(vin_res)

        # 2. Historical Weather Verification
        inc_date = None
        inc_city = None
        inc_state = "CA"
        reported_wx = None
        for doc_id, data in state.extractions.items():
            if not isinstance(data, dict):
                continue
            d_val = data.get("incident_date")
            if d_val and isinstance(d_val, dict):
                d_val = d_val.get("value")
            if d_val and not inc_date:
                inc_date = str(d_val)

            loc_val = data.get("incident_location")
            if loc_val and isinstance(loc_val, dict):
                val_dict = loc_val.get("value")
                if isinstance(val_dict, dict):
                    inc_city = val_dict.get("city") or inc_city
                    inc_state = val_dict.get("state") or inc_state
                elif isinstance(val_dict, str):
                    inc_city = val_dict.split(",")[0]

            wx_val = data.get("weather_conditions")
            if wx_val and isinstance(wx_val, dict):
                wx_val = wx_val.get("value")
            if wx_val and not reported_wx:
                reported_wx = str(wx_val)

        if inc_date and inc_city:
            logs.append(ProcessingLogEntry(stage="external_verifier", message=f"Triggering Open-Meteo historical weather verification for {inc_city}, {inc_state} on {inc_date}..."))
            wx_res = await self.verifier.verify_weather(
                city=str(inc_city),
                state=str(inc_state),
                incident_date=inc_date,
                reported_conditions=reported_wx,
            )
            verifications.append(wx_res)

        # 3. Repair Cost Benchmarking
        for doc_id, data in state.extractions.items():
            if not isinstance(data, dict):
                continue
            gross = data.get("gross_total")
            if gross and isinstance(gross, dict):
                gross = gross.get("value")
            if gross is not None:
                try:
                    g_val = float(gross)
                    labor = data.get("labor_total", {}).get("value") if isinstance(data.get("labor_total"), dict) else data.get("labor_total")
                    parts = data.get("parts_total", {}).get("value") if isinstance(data.get("parts_total"), dict) else data.get("parts_total")
                    bench_res = await self.verifier.verify_repair_cost_benchmarks(
                        vehicle_desc=f"{rep_year or ''} {rep_make or ''} {rep_model or 'Vehicle'}".strip(),
                        gross_total=g_val,
                        labor_total=float(labor) if labor is not None else None,
                        parts_total=float(parts) if parts is not None else None,
                    )
                    verifications.append(bench_res)
                    break
                except (ValueError, TypeError):
                    pass

        # Execution tracking
        if verifications:
            executions.append(
                AgentExecutionRecord(
                    agent_id="external_verifier",
                    display_name="External Public Verification Agent",
                    status="completed",
                    started_at=started_at,
                    completed_at=_utc_now(),
                    details={"verifications_performed": len(verifications)},
                )
            )
            logs.append(ProcessingLogEntry(stage="external_verifier", message=f"External verification completed with {len(verifications)} source checks."))
        else:
            executions.append(
                AgentExecutionRecord(
                    agent_id="external_verifier",
                    display_name="External Public Verification Agent",
                    status="skipped",
                    skip_reason="No triggering criteria (17-char VIN, incident date/city, or repair lines) detected.",
                    started_at=started_at,
                    completed_at=_utc_now(),
                )
            )
            logs.append(ProcessingLogEntry(stage="external_verifier", message="External verification skipped (no triggering criteria)."))

        return {
            "web_verifications": verifications,
            "agent_executions": executions,
            "processing_log": logs,
            "stages_completed": list(state.stages_completed) + ["external_verification"],
        }

    async def assessment_node(self, state: CaseState) -> Dict[str, Any]:
        """Node 8: Evaluates hybrid deterministic + explainable rules to produce adjuster recommendation."""
        started_at = _utc_now()
        executions = list(state.agent_executions)
        logs = list(state.processing_log)

        logs.append(ProcessingLogEntry(stage="assessment_engine", message="Evaluating claim assessment rules..."))
        assessment_res = self.assessment_engine.evaluate(state)

        executions.append(
            AgentExecutionRecord(
                agent_id="assessment_engine",
                display_name="Claim Assessment Engine",
                status="completed",
                started_at=started_at,
                completed_at=_utc_now(),
                details={
                    "outcome": assessment_res.outcome,
                    "classification": assessment_res.classification,
                    "triggered_rules_count": len(assessment_res.triggered_rules),
                    "risk_score": assessment_res.risk_score,
                },
            )
        )
        logs.append(ProcessingLogEntry(stage="assessment_engine", message=f"Assessment complete: {assessment_res.outcome} (Risk Score: {assessment_res.risk_score:.2f})."))

        return {
            "assessment": assessment_res,
            "agent_executions": executions,
            "processing_log": logs,
            "stages_completed": list(state.stages_completed) + ["assessment_evaluation"],
        }

    async def synthesis_agent_node(self, state: CaseState) -> Dict[str, Any]:
        """Node 9: Consolidates normalized facts, limitations, and generates report-ready synthesis."""
        logs = list(state.processing_log)
        limitations: List[str] = list(state.investigation_limitations)

        # Build limitations from missing documents
        for missing in state.missing_documents:
            if "Police" in missing:
                limitations.append("Absence of official law enforcement collision report precludes independent officer fault verification.")
            elif "Estimate" in missing:
                limitations.append("Absence of certified repair estimate prevents itemized parts and labor cost cross-examination.")
            elif "Photographs" in missing:
                limitations.append("Absence of accident scene and damage photographs precludes visual severity assessment.")

        limitations.append("Photographs alone cannot determine vehicle structural frame alignment, internal suspension damage, or total loss status without physical shop teardown.")
        limitations.append("Online repair price indices are contextual benchmarks, not definitive insurance appraisals.")

        # Build normalized facts
        normalized: Dict[str, Any] = {}
        for doc_id, data in state.extractions.items():
            if not isinstance(data, dict):
                continue
            for k in ["policy_number", "claim_number", "incident_date", "incident_time", "incident_location"]:
                val = data.get(k)
                if val and isinstance(val, dict) and val.get("value"):
                    normalized[k] = val.get("value")
                elif val and not isinstance(val, dict):
                    normalized[k] = val

            if "vehicles" in data and data["vehicles"]:
                normalized["vehicles"] = data["vehicles"]
            elif "vehicles_involved" in data and data["vehicles_involved"]:
                normalized["vehicles"] = data["vehicles_involved"]

        # Aggregate vision summaries into normalized damages
        photo_damage_summaries = []
        for doc_id, vision in state.vision_observations.items():
            photo_damage_summaries.append(
                {
                    "photo_id": doc_id,
                    "region": vision.visible_vehicle_region,
                    "severity": vision.severity_category,
                    "damage_items": vision.observable_damage,
                }
            )
        if photo_damage_summaries:
            normalized["visual_damage_assessments"] = photo_damage_summaries

        # Synthesize 11-section investigation report
        assessment = state.assessment
        discrepancy_count = len(state.inconsistencies)
        analyzed_count = len(state.extractions) + len(state.vision_observations)

        report_summary = {
            "case_number": state.case_number,
            "case_id": state.case_id,
            "generated_at": _utc_now().isoformat(),
            "status": "final",
            "outcome": assessment.outcome if assessment else "ROUTINE_REVIEW",
            "recommendation": assessment.classification if assessment else "routine",
            "recommendation_rationale": assessment.rationale if assessment else "Evidence reviewed.",
            "triggered_rules": [r.model_dump() for r in (assessment.triggered_rules if assessment else [])],
            "discrepancies_count": discrepancy_count,
            "analyzed_sources_count": analyzed_count,
            "missing_evidence_categories": state.missing_documents,
            "incident_summary": (
                f"Incident investigation for claim {state.case_number} compiled from {len(state.documents)} submitted document(s). "
                f"Analysis conducted across {len(state.extractions)} document extraction(s) and {len(state.vision_observations)} photographic assessment(s)."
            ),
            "document_analysis": {
                "analyzed_documents": [d.filename for d in state.documents if d.status == "completed" or d.document_type != "unknown"],
                "missing_documents": state.missing_documents,
            },
            "extracted_facts": normalized,
            "vision_observations": [v.model_dump() for v in state.vision_observations.values()],
            "inconsistencies": [
                {
                    "title": f"Conflict in {inc.category.replace('_', ' ').title()}",
                    "description": inc.explanation,
                    "severity": inc.severity,
                    "sources": [inc.source_a, inc.source_b],
                }
                for inc in state.inconsistencies
            ],
            "web_verifications": [
                {
                    "query": v.verification_question,
                    "finding": v.retrieved_information,
                    "source_url": v.source_url,
                    "source_name": v.source_name,
                    "status": v.status,
                }
                for v in state.web_verifications
            ],
            "limitations": limitations,
            "recommended_actions": (assessment.recommended_adjuster_actions if assessment else ["Proceed with standard claim review."]),
            "disclaimer": "ClaimScope is an assistive decision-support system for licensed claims adjusters. It does not independently approve, deny, or label claims fraudulent.",
        }

        logs.append(
            ProcessingLogEntry(
                stage="synthesis",
                message=f"Investigation report generated with recommendation: {report_summary['recommendation'].upper()}.",
            )
        )

        return {
            "normalized_facts": normalized,
            "investigation_limitations": limitations,
            "generated_report": report_summary,
            "processing_log": logs,
            "current_stage": "investigation_completed",
            "stages_completed": list(state.stages_completed) + ["investigation_synthesis"],
        }

    # -------------------------------------------------------------
    # CONDITIONAL ROUTING FUNCTIONS
    # -------------------------------------------------------------

    @staticmethod
    def _has_doc_type(state: CaseState, dtype: str) -> bool:
        return any(d.document_type == dtype for d in state.documents)

    def route_after_router(self, state: CaseState) -> str:
        if self._has_doc_type(state, DocumentType.FNOL.value):
            return "fnol_agent"
        if self._has_doc_type(state, DocumentType.POLICE_REPORT.value):
            return "police_agent"
        if self._has_doc_type(state, DocumentType.REPAIR_ESTIMATE.value):
            return "estimate_agent"
        if self._has_doc_type(state, DocumentType.PHOTO.value):
            return "vision_agent"
        return "external_verifier"

    def route_after_fnol(self, state: CaseState) -> str:
        if self._has_doc_type(state, DocumentType.POLICE_REPORT.value):
            return "police_agent"
        if self._has_doc_type(state, DocumentType.REPAIR_ESTIMATE.value):
            return "estimate_agent"
        if self._has_doc_type(state, DocumentType.PHOTO.value):
            return "vision_agent"
        if (len(state.extractions) + len(state.vision_observations)) >= 2:
            return "consistency_agent"
        return "external_verifier"

    def route_after_police(self, state: CaseState) -> str:
        if self._has_doc_type(state, DocumentType.REPAIR_ESTIMATE.value):
            return "estimate_agent"
        if self._has_doc_type(state, DocumentType.PHOTO.value):
            return "vision_agent"
        if (len(state.extractions) + len(state.vision_observations)) >= 2:
            return "consistency_agent"
        return "external_verifier"

    def route_after_estimate(self, state: CaseState) -> str:
        if self._has_doc_type(state, DocumentType.PHOTO.value):
            return "vision_agent"
        if (len(state.extractions) + len(state.vision_observations)) >= 2:
            return "consistency_agent"
        return "external_verifier"

    def route_after_vision(self, state: CaseState) -> str:
        total_sources = len(state.extractions) + (1 if state.vision_observations else 0)
        if total_sources >= 2:
            return "consistency_agent"
        return "external_verifier"

    # -------------------------------------------------------------
    # BUILD AND COMPILE GRAPH
    # -------------------------------------------------------------

    def build_graph(self):
        """Construct and compile the LangGraph Investigation Workflow."""
        graph = StateGraph(CaseState)

        # Register nodes
        graph.add_node("intake_classifier", self.intake_and_classification_node)
        graph.add_node("supervisor_router", self.supervisor_routing_node)
        graph.add_node("fnol_agent", self.fnol_agent_node)
        graph.add_node("police_agent", self.police_agent_node)
        graph.add_node("estimate_agent", self.estimate_agent_node)
        graph.add_node("vision_agent", self.vision_agent_node)
        graph.add_node("consistency_agent", self.consistency_agent_node)
        graph.add_node("external_verifier", self.external_verifier_node)
        graph.add_node("assessment_node", self.assessment_node)
        graph.add_node("synthesis_agent", self.synthesis_agent_node)

        # Entry point
        graph.set_entry_point("intake_classifier")
        graph.add_edge("intake_classifier", "supervisor_router")

        # Dynamic conditional routing
        graph.add_conditional_edges(
            "supervisor_router",
            self.route_after_router,
            {
                "fnol_agent": "fnol_agent",
                "police_agent": "police_agent",
                "estimate_agent": "estimate_agent",
                "vision_agent": "vision_agent",
                "external_verifier": "external_verifier",
            },
        )

        graph.add_conditional_edges(
            "fnol_agent",
            self.route_after_fnol,
            {
                "police_agent": "police_agent",
                "estimate_agent": "estimate_agent",
                "vision_agent": "vision_agent",
                "consistency_agent": "consistency_agent",
                "external_verifier": "external_verifier",
            },
        )

        graph.add_conditional_edges(
            "police_agent",
            self.route_after_police,
            {
                "estimate_agent": "estimate_agent",
                "vision_agent": "vision_agent",
                "consistency_agent": "consistency_agent",
                "external_verifier": "external_verifier",
            },
        )

        graph.add_conditional_edges(
            "estimate_agent",
            self.route_after_estimate,
            {
                "vision_agent": "vision_agent",
                "consistency_agent": "consistency_agent",
                "external_verifier": "external_verifier",
            },
        )

        graph.add_conditional_edges(
            "vision_agent",
            self.route_after_vision,
            {
                "consistency_agent": "consistency_agent",
                "external_verifier": "external_verifier",
            },
        )

        graph.add_edge("consistency_agent", "external_verifier")
        graph.add_edge("external_verifier", "assessment_node")
        graph.add_edge("assessment_node", "synthesis_agent")
        graph.add_edge("synthesis_agent", END)

        return graph.compile()
