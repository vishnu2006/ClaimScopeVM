from typing import Optional
from app.prompts import get_police_report_extraction_prompt
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
        return get_police_report_extraction_prompt(document_name)
