import os
import re
from typing import Optional, Tuple
from pydantic import BaseModel, Field

from app.prompts import (
    DOCUMENT_CLASSIFIER_SYSTEM_PROMPT,
    get_document_classification_prompt,
)
from app.schemas.common import DocumentType
from app.services.document_processor import DocumentProcessor
from app.services.llm_provider import ConfigurationError, LLMProvider, get_llm_provider


class ClassificationResult(BaseModel):
    document_type: DocumentType
    confidence: float = Field(0.9, ge=0.0, le=1.0)
    classification_method: str  # content_heuristics, gemini_multimodal, filename_fallback
    rationale: str


class DocumentClassifier:
    """Classifies claim package documents based on actual content, textual markers,
    and Gemini multimodal analysis for scanned/handwritten materials."""

    def __init__(self, processor: Optional[DocumentProcessor] = None):
        self.processor = processor or DocumentProcessor()

    def classify_by_content(
        self,
        file_path: str,
        extracted_text: Optional[str] = None,
        mime_type: Optional[str] = None,
    ) -> ClassificationResult:
        """Classify a document using extracted content heuristics."""
        ext = os.path.splitext(file_path)[1].lower()

        # 1. Images are classified as damage photos by default
        if ext in [".jpg", ".jpeg", ".png", ".tiff", ".tif", ".webp"]:
            return ClassificationResult(
                document_type=DocumentType.PHOTO,
                confidence=0.95,
                classification_method="content_heuristics",
                rationale="Image file uploaded to incident package recognized as photographic evidence.",
            )

        # 2. Analyze PDF / textual content
        text = extracted_text or ""
        if not text and ext == ".pdf" and os.path.exists(file_path):
            try:
                extraction = self.processor.extract_text_from_pdf(file_path)
                text = extraction.get("text", "")
            except Exception:
                text = ""

        upper_text = text.upper()

        # Check title / header in first 350 characters
        top_snippet = upper_text[:350]

        fnol_markers = [
            "FIRST NOTICE OF LOSS",
            "AUTOMOBILE LOSS NOTICE",
            "POLICYHOLDER'S REPORT",
            "CLAIM REPORT",
            "ACCIDENT REPORT FORM",
            "INSURED STATEMENT",
            "DRIVER REPORT OF ACCIDENT",
            "FNOL",
        ]
        for marker in fnol_markers:
            if marker in top_snippet:
                return ClassificationResult(
                    document_type=DocumentType.FNOL,
                    confidence=0.95,
                    classification_method="content_heuristics",
                    rationale=f"Header explicitly identifies document as FNOL/Incident Form ('{marker}').",
                )

        police_markers = [
            "POLICE ACCIDENT REPORT",
            "POLICE CRASH REPORT",
            "MOTOR VEHICLE CRASH REPORT",
            "TRAFFIC COLLISION REPORT",
            "STATE POLICE",
            "HIGHWAY PATROL",
            "DEPARTMENT OF PUBLIC SAFETY",
            "OFFICER'S REPORT",
            "BADGE #",
            "CAD INCIDENT",
        ]
        for marker in police_markers:
            if marker in top_snippet or marker in upper_text[:800]:
                return ClassificationResult(
                    document_type=DocumentType.POLICE_REPORT,
                    confidence=0.95,
                    classification_method="content_heuristics",
                    rationale=f"Document contains official law enforcement collision markers ('{marker}').",
                )

        estimate_markers = [
            "ESTIMATE OF RECORD",
            "COLLISION ESTIMATE",
            "BODY SHOP ESTIMATE",
            "CCC ONE",
            "MITCHELL",
            "AUDATEX",
            "PARTS & LABOR ESTIMATE",
            "PRELIMINARY ESTIMATE",
            "REPAIR ORDER",
            "AUTO BODY",
        ]
        for marker in estimate_markers:
            if marker in top_snippet or marker in upper_text[:800]:
                return ClassificationResult(
                    document_type=DocumentType.REPAIR_ESTIMATE,
                    confidence=0.95,
                    classification_method="content_heuristics",
                    rationale=f"Document contains certified automotive repair estimate markers ('{marker}').",
                )

        # Keyword density scoring
        scores = {
            DocumentType.FNOL: 0,
            DocumentType.POLICE_REPORT: 0,
            DocumentType.REPAIR_ESTIMATE: 0,
            DocumentType.MEDICAL_RECORD: 0,
        }

        # FNOL keyword matches
        for kw in ["POLICY NUMBER", "INSURED NAME", "DATE OF LOSS", "TIME OF ACCIDENT", "CLAIMANT", "DEDUCTIBLE"]:
            if kw in upper_text:
                scores[DocumentType.FNOL] += 1

        # Police Report keyword matches
        for kw in ["INVESTIGATING OFFICER", "CITATION", "DIAGRAM", "WEATHER CONDITIONS", "ROAD SURFACE", "CONTRIBUTING FACTORS", "DISPATCH"]:
            if kw in upper_text:
                scores[DocumentType.POLICE_REPORT] += 1

        # Repair Estimate keyword matches
        for kw in ["LABOR RATE", "OEM", "AFTERMARKET", "PAINT / MATERIALS", "OVERHAUL", "SUBLET", "PARTS TOTAL", "GROSS TOTAL"]:
            if kw in upper_text:
                scores[DocumentType.REPAIR_ESTIMATE] += 1.5

        # Medical keywords
        for kw in ["EMERGENCY ROOM", "TREATMENT", "DISCHARGE SUMMARY", "ATTENDING PHYSICIAN", "DIAGNOSIS"]:
            if kw in upper_text:
                scores[DocumentType.MEDICAL_RECORD] += 1

        best_type = max(scores, key=scores.get)
        max_score = scores[best_type]

        if max_score >= 3:
            return ClassificationResult(
                document_type=best_type,
                confidence=min(0.70 + (max_score * 0.05), 0.95),
                classification_method="content_heuristics",
                rationale=f"High density of domain-specific terminology matched {best_type.value} pattern (score: {max_score}).",
            )

        # Filename fallback heuristic
        lower_filename = os.path.basename(file_path).lower()
        if any(w in lower_filename for w in ["fnol", "incident", "first_notice", "loss_report"]):
            return ClassificationResult(
                document_type=DocumentType.FNOL,
                confidence=0.75,
                classification_method="filename_fallback",
                rationale="Classified from file naming convention.",
            )
        if any(w in lower_filename for w in ["police", "crash", "traffic_report", "chp", "officer"]):
            return ClassificationResult(
                document_type=DocumentType.POLICE_REPORT,
                confidence=0.75,
                classification_method="filename_fallback",
                rationale="Classified from file naming convention.",
            )
        if any(w in lower_filename for w in ["estimate", "repair", "body_shop", "appraisal"]):
            return ClassificationResult(
                document_type=DocumentType.REPAIR_ESTIMATE,
                confidence=0.75,
                classification_method="filename_fallback",
                rationale="Classified from file naming convention.",
            )

        return ClassificationResult(
            document_type=DocumentType.UNKNOWN,
            confidence=0.0,
            classification_method="unrecognized",
            rationale="Insufficient content markers to classify document definitively.",
        )

    async def classify_with_gemini_fallback(
        self,
        file_path: str,
        extracted_text: Optional[str] = None,
        llm_provider: Optional[LLMProvider] = None,
    ) -> ClassificationResult:
        """Classify document, using Gemini multimodal intelligence when text is ambiguous or scanned."""
        result = self.classify_by_content(file_path, extracted_text)
        if result.document_type != DocumentType.UNKNOWN:
            return result

        # Attempt Gemini multimodal classification if provider available
        try:
            provider = llm_provider or get_llm_provider()
            prompt = get_document_classification_prompt(extracted_text)

            class GeminiClassification(BaseModel):
                category: str
                confidence: float
                rationale: str

            gemini_res = await provider.extract_structured(
                text=prompt,
                system_prompt=DOCUMENT_CLASSIFIER_SYSTEM_PROMPT,
                response_model=GeminiClassification,
            )

            cat_map = {
                "fnol": DocumentType.FNOL,
                "police_report": DocumentType.POLICE_REPORT,
                "repair_estimate": DocumentType.REPAIR_ESTIMATE,
                "photo": DocumentType.PHOTO,
                "medical_record": DocumentType.MEDICAL_RECORD,
                "correspondence": DocumentType.CORRESPONDENCE,
                "other": DocumentType.OTHER,
            }
            matched_type = cat_map.get(gemini_res.category.lower().strip(), DocumentType.OTHER)
            return ClassificationResult(
                document_type=matched_type,
                confidence=gemini_res.confidence,
                classification_method="gemini_multimodal",
                rationale=gemini_res.rationale,
            )
        except Exception:
            return result
