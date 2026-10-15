from app.schemas.evidence import FNOLExtraction
from app.services.llm_provider import LLMProvider


class FNOLExtractor:
    """FNOL extraction service using structured LLM outputs."""

    def __init__(self, llm_provider: LLMProvider):
        self.llm = llm_provider

    async def extract(self, document_text: str, document_name: str) -> FNOLExtraction:
        """Extract structured FNOL data from document text.
        Uses LLM to parse and structure the information.
        Never invents fields - missing data stays None.
        """
        system_prompt = self._build_extraction_prompt(document_name)
        result = await self.llm.extract_structured(
            text=document_text,
            system_prompt=system_prompt,
            response_model=FNOLExtraction,
        )
        return result

    def _build_extraction_prompt(self, document_name: str) -> str:
        return f"""You are a senior claims data extraction specialist for US P&C Auto Insurance.
Extract structured First Notice of Loss (FNOL) information from the provided document text.
Document Name: {document_name}

CRITICAL EXTRACTION RULES:
1. Extract ONLY information that is explicitly stated in the text.
2. If any field or detail is missing, unmentioned, or ambiguous, return null (None).
3. NEVER invent, hallucinate, extrapolate, or assume information.
4. For each field with provenance:
   - value: extracted parsed value (or null)
   - confidence: confidence score between 0.0 and 1.0 (null if value is missing)
   - source_document: set to "{document_name}"
   - source_text: the exact snippet or phrase quoted from the document
5. Accurately identify vehicle details (year, make, model, color, VIN, license plate, damage), parties, injuries, witnesses, and police reports.
"""
