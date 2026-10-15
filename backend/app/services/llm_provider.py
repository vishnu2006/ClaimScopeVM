from abc import ABC, abstractmethod
from typing import Any, Type, TypeVar
import instructor
from pydantic import BaseModel

from app.config import settings

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


class OpenAIProvider(LLMProvider):
    def __init__(
        self,
        api_key: str,
        model: str = "gpt-4o",
        temperature: float = 0.1,
        max_tokens: int = 4096,
    ):
        self.api_key = api_key
        self.model = model
        self.temperature = temperature
        self.max_tokens = max_tokens

    async def extract_structured(
        self, text: str, system_prompt: str, response_model: Type[T]
    ) -> T:
        from openai import AsyncOpenAI

        client = instructor.from_openai(AsyncOpenAI(api_key=self.api_key))
        response = await client.chat.completions.create(
            model=self.model,
            response_model=response_model,
            temperature=self.temperature,
            max_tokens=self.max_tokens,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": text},
            ],
        )
        return response


class AnthropicProvider(LLMProvider):
    def __init__(
        self,
        api_key: str,
        model: str = "claude-3-5-sonnet-20241022",
        temperature: float = 0.1,
        max_tokens: int = 4096,
    ):
        self.api_key = api_key
        self.model = model
        self.temperature = temperature
        self.max_tokens = max_tokens

    async def extract_structured(
        self, text: str, system_prompt: str, response_model: Type[T]
    ) -> T:
        from anthropic import AsyncAnthropic

        client = instructor.from_anthropic(AsyncAnthropic(api_key=self.api_key))
        response = await client.messages.create(
            model=self.model,
            max_tokens=self.max_tokens,
            temperature=self.temperature,
            response_model=response_model,
            system=system_prompt,
            messages=[
                {"role": "user", "content": text},
            ],
        )
        return response


class GoogleProvider(LLMProvider):
    def __init__(
        self,
        api_key: str,
        model: str = "gemini-1.5-pro",
        temperature: float = 0.1,
        max_tokens: int = 4096,
    ):
        self.api_key = api_key
        self.model = model
        self.temperature = temperature
        self.max_tokens = max_tokens

    async def extract_structured(
        self, text: str, system_prompt: str, response_model: Type[T]
    ) -> T:
        import google.generativeai as genai

        genai.configure(api_key=self.api_key)
        client = instructor.from_gemini(
            client=genai.GenerativeModel(
                model_name=self.model,
                generation_config={"temperature": self.temperature, "max_output_tokens": self.max_tokens},
            )
        )
        prompt = f"{system_prompt}\n\nDocument text:\n{text}"
        response = await client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            response_model=response_model,
        )
        return response


def get_llm_provider() -> LLMProvider:
    """Factory that returns the configured LLM provider.
    Raises clear ConfigurationError if API key is missing.
    """
    if not settings.LLM_API_KEY:
        raise ConfigurationError(
            "LLM_API_KEY is not configured. Set LLM_API_KEY in your .env file."
        )

    provider_name = settings.LLM_PROVIDER.lower().strip()
    if provider_name == "openai":
        return OpenAIProvider(
            api_key=settings.LLM_API_KEY,
            model=settings.LLM_MODEL,
            temperature=settings.LLM_TEMPERATURE,
            max_tokens=settings.LLM_MAX_TOKENS,
        )
    elif provider_name == "anthropic":
        return AnthropicProvider(
            api_key=settings.LLM_API_KEY,
            model=settings.LLM_MODEL,
            temperature=settings.LLM_TEMPERATURE,
            max_tokens=settings.LLM_MAX_TOKENS,
        )
    elif provider_name in ["google", "gemini"]:
        return GoogleProvider(
            api_key=settings.LLM_API_KEY,
            model=settings.LLM_MODEL,
            temperature=settings.LLM_TEMPERATURE,
            max_tokens=settings.LLM_MAX_TOKENS,
        )
    else:
        raise ConfigurationError(
            f"Unsupported LLM_PROVIDER: '{settings.LLM_PROVIDER}'. Supported providers: openai, anthropic, google"
        )
