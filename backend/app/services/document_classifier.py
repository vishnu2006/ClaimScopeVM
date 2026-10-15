import os
import re
from typing import Optional, Tuple
from pydantic import BaseModel, Field

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
            "POLICYHOLDER REPORT",
            "ACORD 1",
            "STATEMENT OF LOSS",
            "CLAIM NOTICE",
            "CLAIMANT STATEMENT",
            "INSURED'S ACCIDENT REPORT",
            "INSURED REPORT OF LOSS",
            "INCIDENT FORM",
        ]

        police_markers = [
            "POLICE DEPARTMENT",
            "STATE POLICE",
            "HIGHWAY PATROL",
            "TRAFFIC COLLISION REPORT",
            "MOTOR VEHICLE ACCIDENT REPORT",
            "TRAFFIC CRASH REPORT",
            "OFFICER'S NARRATIVE",
            "OFFICER NARRATIVE",
            "REPORTING OFFICER",
            "INVESTIGATING OFFICER",
            "CITATIONS ISSUED",
            "DEPARTMENT OF PUBLIC SAFETY",
        ]

        repair_markers = [
            "ESTIMATE OF RECORD",
            "COLLISION ESTIMATE",
            "REPAIR ORDER",
            "BODY SHOP",
            "COLLISION CENTER",
            "PARTS TOTAL",
            "LABOR TOTAL",
            "PAINT TOTAL",
            "GROSS TOTAL",
            "GROSS REPAIR TOTAL",
            "CCC ONE",
            "MITCHELL",
            "AUDATEX",
            "REPAIR ESTIMATE",
        ]

        # Calculate weighted scores
        fnol_score = sum(2 for m in fnol_markers if m in upper_text)
        if any(m in top_snippet for m in ["FIRST NOTICE OF LOSS", "AUTOMOBILE LOSS NOTICE", "POLICYHOLDER", "ACORD 1"]):
            fnol_score += 10

        police_score = sum(2 for m in police_markers if m in upper_text)
        if any(m in top_snippet for m in ["POLICE DEPARTMENT", "HIGHWAY PATROL", "TRAFFIC CRASH REPORT", "TRAFFIC COLLISION REPORT"]):
            police_score += 10

        repair_score = sum(2 for m in repair_markers if m in upper_text)
        if any(m in top_snippet for m in ["ESTIMATE", "COLLISION CENTER", "BODY SHOP", "REPAIR ORDER"]):
            repair_score += 10

        if fnol_score > max(police_score, repair_score, 0):
            return ClassificationResult(
                document_type=DocumentType.FNOL,
                confidence=0.98,
                classification_method="content_heuristics",
                rationale="Matched First Notice of Loss / Automobile Loss Notice structural headings.",
            )

        if police_score > max(fnol_score, repair_score, 0):
            return ClassificationResult(
                document_type=DocumentType.POLICE_REPORT,
                confidence=0.98,
                classification_method="content_heuristics",
                rationale="Matched law enforcement incident report headings and officer narrative markers.",
            )

        if repair_score > max(fnol_score, police_score, 0):
            return ClassificationResult(
                document_type=DocumentType.REPAIR_ESTIMATE,
                confidence=0.98,
                classification_method="content_heuristics",
                rationale="Matched auto body collision repair estimate items, labor rates, and part totals.",
            )

        # Heuristic 4: Medical records
        medical_markers = [
            "EMERGENCY DEPARTMENT",
            "HOSPITAL",
            "DISCHARGE SUMMARY",
            "ATTENDING PHYSICIAN",
            "PATIENT RECORD",
            "MEDICAL REPORT",
        ]
        if any(marker in upper_text for marker in medical_markers):
            return ClassificationResult(
                document_type=DocumentType.MEDICAL_RECORD,
                confidence=0.92,
                classification_method="content_heuristics",
                rationale="Matched healthcare/medical facility patient records.",
            )

        # If text is too short or ambiguous, check filename keywords as fallback
        base_name = os.path.basename(file_path).lower()
        if "fnol" in base_name or "notice_of_loss" in base_name or "incident_form" in base_name:
            return ClassificationResult(
                document_type=DocumentType.FNOL,
                confidence=0.75,
                classification_method="filename_fallback",
                rationale="Classified via First Notice of Loss filename pattern.",
            )
        if "police" in base_name or "crash" in base_name or "officer" in base_name:
            return ClassificationResult(
                document_type=DocumentType.POLICE_REPORT,
                confidence=0.75,
                classification_method="filename_fallback",
                rationale="Classified via police report filename pattern.",
            )
        if "estimate" in base_name or "repair" in base_name or "quote" in base_name or "bodyshop" in base_name:
            return ClassificationResult(
                document_type=DocumentType.REPAIR_ESTIMATE,
                confidence=0.75,
                classification_method="filename_fallback",
                rationale="Classified via repair estimate filename pattern.",
            )
        if any(term in base_name for term in ["photo", "image", "damage", "pic", "img"]):
            return ClassificationResult(
                document_type=DocumentType.PHOTO,
                confidence=0.75,
                classification_method="filename_fallback",
                rationale="Classified via photographic filename pattern.",
            )

        return ClassificationResult(
            document_type=DocumentType.UNKNOWN,
            confidence=0.5,
            classification_method="content_heuristics",
            rationale="Unrecognized document format without distinct claims markers.",
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
            prompt = (
                "You are an insurance document intake specialist. "
                "Classify this document content into exactly one category: "
                "fnol, police_report, repair_estimate, photo, medical_record, correspondence, other.\n"
                f"Document text snippet:\n{extracted_text[:2000] if extracted_text else 'No native text available.'}"
            )

            class GeminiClassification(BaseModel):
                category: str
                confidence: float
                rationale: str

            gemini_res = await provider.extract_structured(
                text=prompt,
                system_prompt="Classify insurance claims documents with high precision.",
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
