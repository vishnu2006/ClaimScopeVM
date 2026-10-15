import os
from typing import Any, List, Optional
from google.genai import types

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

        prompt_text = (
            f"Accident photo filename: {filename}\n"
            f"{f'Claim context: {context_notes}' if context_notes else ''}\n"
            "Analyze the vehicle damage visible in this photograph. Adhere strictly to the insurance evaluation rubric."
        )

        system_prompt = self._build_vision_prompt()

        result = await self.llm.extract_multimodal_structured(
            contents=[image_part, prompt_text],
            system_prompt=system_prompt,
            response_model=PhotoDamageAnalysis,
        )
        return result

    def _build_vision_prompt(self) -> str:
        return """You are a senior physical damage appraiser and forensic photo investigator for US P&C Auto Insurance.
Inspect the submitted accident photograph and provide a structured visual damage assessment.

EVIDENCE-BASED SEVERITY RUBRIC:
- 'minor': Superficial paint scuffs, light surface scratches, shallow dings (<1 inch depth), lenses intact, exterior trim clips popped, no visible structural displacement. (Note: Mechanical driveability cannot be confirmed from photographs alone).
- 'moderate': Deep panel creases, dented sheet metal, cracked bumper fascia, fractured headlamp/taillamp assemblies, misalignment of adjacent body seams (hood gap, fender gap), requiring panel beating or bolt-on part replacement. No visible unibody crush.
- 'severe': Major visible structural crumple, deep quarter panel intrusion, deployed airbags, shattered glass/windshield, wheel or suspension displacement, heavy hood buckle, visible fluid leaks. (Note: Internal mechanical, sensor, or frame alignment requires physical shop teardown inspection).
- 'catastrophic_total_loss': Massive structural crush, passenger compartment intrusion, rollover roof crush, severe firewall or A/B/C pillar collapse. (Note: Definitive total loss determination requires certified body shop appraisal and statutory salvage threshold calculation).

STRICT INSURANCE GUARDRAILS:
1. ONLY describe what is visibly evident in the frame.
2. DO NOT state exact physical millimeter or centimeter measurements.
3. DO NOT speculate on concealed/internal frame damage unless the deformation is explicitly visible from this camera angle.
4. DO NOT estimate vehicle collision speed or pre-crash deceleration.
5. DO NOT estimate dollar repair costs or total repair bills.
6. DO NOT declare legal fault or assign liability to any driver.
7. Identify image limitations honestly (e.g. night glare, low resolution, oblique angle, partial obstruction).
8. Photographs alone CANNOT establish hidden structural damage, mechanical driveability, or definitive total-loss status; physical shop teardown is always required.
"""
