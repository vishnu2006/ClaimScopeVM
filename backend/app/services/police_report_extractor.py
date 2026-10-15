from typing import Optional
from app.schemas.evidence import PoliceReportExtraction
from app.services.llm_provider import LLMProvider


class PoliceReportExtractor:
    """Specialized extraction service for police collision and incident reports."""

    def __init__(self, llm_provider: LLMProvider):
        self.llm = llm_provider

    async def extract(self, document_text: str, document_name: str) -> PoliceReportExtraction:
        """Extract structured Police Report data from document text."""
        system_prompt = self._build_extraction_prompt(document_name)
        result = await self.llm.extract_structured(
            text=document_text,
            system_prompt=system_prompt,
            response_model=PoliceReportExtraction,
        )
        return result

    def _build_extraction_prompt(self, document_name: str) -> str:
        return f"""You are a specialized legal and claims evidence analyst for US P&C Auto Insurance.
Extract structured police traffic collision report data from the provided document text.
Document Name: {document_name}

CRITICAL RULES:
1. Extract ONLY facts explicitly recorded in the police report.
2. If any field or detail is not documented, leave it as null (None).
3. NEVER assume liability, citations, or speeds unless specifically documented in the officer's findings.
4. For fields with provenance:
   - value: the factual value extracted
   - confidence: score between 0.0 and 1.0 based on clarity in the report
   - source_document: "{document_name}"
   - source_text: verbatim phrase or section from the report
5. Pay strict attention to:
   - Official report number and law enforcement agency
   - Incident date, time, and precise street/intersection location
   - Officer narrative describing the collision sequence
   - Any fault determinations, contributing factors, or traffic citations
   - Vehicle details for all involved units (Unit 1, Unit 2, etc.)
   - Injuries and EMS transports
"""
