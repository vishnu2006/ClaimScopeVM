import asyncio
import json
import logging
import re
from abc import ABC, abstractmethod
from typing import Any, List, Optional, Type, TypeVar
from google import genai
from google.genai import types
from google.genai.errors import APIError, ClientError, ServerError
from pydantic import BaseModel

from app.config import settings

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)


class ConfigurationError(Exception):
    """Raised when LLM configuration or credentials are missing/invalid."""
    pass


class LLMProvider(ABC):
    @abstractmethod
    async def extract_structured(
        self, text: str, system_prompt: str, response_model: Type[T]
    ) -> T:
        """Extract structured model from text using LLM."""
        pass

    @abstractmethod
    async def extract_multimodal_structured(
        self,
        contents: List[Any],
        system_prompt: str,
        response_model: Type[T],
    ) -> T:
        """Extract structured model from multimodal parts (images, documents, text)."""
        pass

    @abstractmethod
    async def generate_text(
        self, prompt: str, system_prompt: Optional[str] = None
    ) -> str:
        """Generate general text response."""
        pass


def _clean_json_string(raw_text: str) -> str:
    """Clean markdown code block wrappers from JSON string."""
    text = raw_text.strip()
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
    if match:
        text = match.group(1).strip()
    return text


class GeminiProvider(LLMProvider):
    """Google Gemini AI integration using the official google-genai SDK.
    Strictly free-tier optimized with backoff retries and structured validation."""

    def __init__(
        self,
        api_key: str,
        model: str = "gemini-2.5-flash",
        temperature: float = 0.1,
        max_tokens: int = 8192,
    ):
        if not api_key or not api_key.strip():
            raise ConfigurationError(
                "GEMINI_API_KEY is not configured. Set GEMINI_API_KEY in your .env file."
            )
        self.api_key = api_key.strip()
        self.model = model
        self.temperature = temperature
        self.max_tokens = max_tokens
        # Initialize official Google Gen AI Client
        self.client = genai.Client(api_key=self.api_key)

    async def _execute_with_retry(self, call_fn, max_retries: int = 3):
        """Execute async Gemini API call with exponential backoff for rate limits."""
        delay = 2.0
        last_error = None
        for attempt in range(max_retries):
            try:
                return await call_fn()
            except (APIError, ServerError, ClientError) as e:
                err_msg = str(e).lower()
                # Check for rate limit / quota exhaustion (HTTP 429)
                if "429" in err_msg or "resource_exhausted" in err_msg or "rate limit" in err_msg:
                    logger.warning(
                        f"Gemini API rate limit encountered (attempt {attempt + 1}/{max_retries}). "
                        f"Retrying in {delay}s..."
                    )
                    await asyncio.sleep(delay)
                    delay *= 2.0
                    last_error = e
                else:
                    logger.error(f"Gemini API call failed: {e}")
                    raise e
            except Exception as e:
                logger.error(f"Unexpected error during Gemini execution: {e}")
                raise e

        raise last_error or RuntimeError("Exceeded maximum retries for Gemini API call.")

    async def extract_structured(
        self, text: str, system_prompt: str, response_model: Type[T]
    ) -> T:
        """Extract structured Pydantic schema from text using Gemini."""
        return await self.extract_multimodal_structured(
            contents=[text],
            system_prompt=system_prompt,
            response_model=response_model,
        )

    async def extract_multimodal_structured(
        self,
        contents: List[Any],
        system_prompt: str,
        response_model: Type[T],
    ) -> T:
        """Extract structured Pydantic schema from multimodal contents (text, images, PDFs)."""
        config = types.GenerateContentConfig(
            temperature=self.temperature,
            max_output_tokens=self.max_tokens,
            response_mime_type="application/json",
            response_schema=response_model,
            system_instruction=system_prompt,
        )

        async def _call():
            response = await self.client.aio.models.generate_content(
                model=self.model,
                contents=contents,
                config=config,
            )
            return response

        response = await self._execute_with_retry(_call)
        raw_text = response.text or "{}"
        cleaned_json = _clean_json_string(raw_text)

        try:
            return response_model.model_validate_json(cleaned_json)
        except Exception as validation_err:
            logger.warning(
                f"Direct schema validation failed, attempting dict cleanup: {validation_err}"
            )
            parsed_dict = json.loads(cleaned_json)
            return response_model.model_validate(parsed_dict)

    async def generate_text(
        self, prompt: str, system_prompt: Optional[str] = None
    ) -> str:
        """Generate unstructured text from Gemini."""
        config = types.GenerateContentConfig(
            temperature=self.temperature,
            max_output_tokens=self.max_tokens,
            system_instruction=system_prompt,
        )

        async def _call():
            response = await self.client.aio.models.generate_content(
                model=self.model,
                contents=[prompt],
                config=config,
            )
            return response

        response = await self._execute_with_retry(_call)
        return response.text or ""


def get_llm_provider() -> LLMProvider:
    """Factory that returns the configured Gemini LLM provider.
    Raises clear ConfigurationError if GEMINI_API_KEY is missing.
    """
    key = settings.effective_gemini_api_key
    if not key or not key.strip():
        raise ConfigurationError(
            "GEMINI_API_KEY is not configured. Set GEMINI_API_KEY in your backend/.env file."
        )

    return GeminiProvider(
        api_key=key,
        model=settings.GEMINI_MODEL,
        temperature=settings.GEMINI_TEMPERATURE,
        max_tokens=settings.GEMINI_MAX_TOKENS,
    )
