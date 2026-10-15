from typing import Optional
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
        return f"""You are a licensed auto physical damage appraiser and claims estimator.
Extract structured repair estimate data from the provided document text.
Document Name: {document_name}

CRITICAL RULES:
1. Extract ONLY items explicitly listed in the estimate or repair order.
2. If any subtotal, line item, or vehicle field is missing or illegible, leave it null.
3. NEVER fabricate parts prices, labor hours, or repair totals.
4. For monetary values, extract numbers as floats (e.g. 1250.50).
5. Extract key line items including operation type (Replace, Repair, Refinish, Blend), part description, part type (OEM, Aftermarket, Recycled), and costs.
6. Identify the primary vehicle body regions scheduled for repair (e.g. Front Bumper, Left Fender, Rear Liftgate).
"""
