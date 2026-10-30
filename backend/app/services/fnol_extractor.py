from app.prompts import get_fnol_extraction_prompt
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
        return get_fnol_extraction_prompt(document_name)
