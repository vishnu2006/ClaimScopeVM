import os
from typing import Any, List, Optional
from google.genai import types

from app.prompts import VISION_DAMAGE_SYSTEM_PROMPT, get_vision_photo_prompt_text
from app.schemas.evidence import PhotoDamageAnalysis
from app.services.llm_provider import ConfigurationError, LLMProvider, get_llm_provider


class VehicleDamageVisionAgent:
    """Multimodal Vision Agent analyzing accident photographs using Google Gemini.
    Extracts visible physical damage, affected components, and apparent severity
    using an explainable insurance damage rubric with strict guardrails."""

    def __init__(self, llm_provider: Optional[LLMProvider] = None):
        self.llm = llm_provider or get_llm_provider()

    async def analyze_photo(
        self,
        file_path: str,
        filename: str,
        context_notes: Optional[str] = None,
    ) -> PhotoDamageAnalysis:
        """Analyze a single vehicle accident photograph using Gemini multimodal vision."""
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Image file not found: {file_path}")

        # Read image bytes
        with open(file_path, "rb") as f:
            image_bytes = f.read()

        ext = os.path.splitext(file_path)[1].lower()
        mime_map = {
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".webp": "image/webp",
            ".tiff": "image/tiff",
            ".tif": "image/tiff",
        }
        mime_type = mime_map.get(ext, "image/jpeg")

        image_part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type)

        prompt_text = get_vision_photo_prompt_text(filename, context_notes)
        system_prompt = self._build_vision_prompt()

        result = await self.llm.extract_multimodal_structured(
            contents=[image_part, prompt_text],
            system_prompt=system_prompt,
            response_model=PhotoDamageAnalysis,
        )
        return result

    def _build_vision_prompt(self) -> str:
        return VISION_DAMAGE_SYSTEM_PROMPT
