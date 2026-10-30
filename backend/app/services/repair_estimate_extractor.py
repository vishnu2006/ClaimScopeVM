from typing import Optional
from app.prompts import get_repair_estimate_extraction_prompt
from app.schemas.evidence import RepairEstimateExtraction
from app.services.llm_provider import LLMProvider


class RepairEstimateExtractor:
    """Specialized extraction service for collision repair estimates and body shop invoices."""

    def __init__(self, llm_provider: LLMProvider):
        self.llm = llm_provider

    async def extract(self, document_text: str, document_name: str) -> RepairEstimateExtraction:
        """Extract structured repair estimate and line items from document text."""
        system_prompt = self._build_extraction_prompt(document_name)
        result = await self.llm.extract_structured(
            text=document_text,
            system_prompt=system_prompt,
            response_model=RepairEstimateExtraction,
        )
        return result

    def _build_extraction_prompt(self, document_name: str) -> str:
        return get_repair_estimate_extraction_prompt(document_name)
