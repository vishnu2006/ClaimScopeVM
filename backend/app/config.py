from typing import List, Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "ClaimScope API"
    APP_VERSION: str = "0.2.0"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./claimscope.db"

    # File Upload
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE_MB: int = 50
    ALLOWED_EXTENSIONS: str = ".pdf,.jpg,.jpeg,.png,.tiff,.tif,.doc,.docx"

    # Gemini-only AI Configuration
    GEMINI_API_KEY: Optional[str] = None
    LLM_API_KEY: Optional[str] = None  # Fallback alias for backward compatibility
    GEMINI_MODEL: str = "gemini-2.5-flash"  # Highly capable, multimodal, free-tier eligible
    GEMINI_TEMPERATURE: float = 0.1
    GEMINI_MAX_TOKENS: int = 8192

    # CORS
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000,https://claimscopevm.vishnu-pandrangi123.workers.dev"
    CORS_ORIGIN_REGEX: Optional[str] = r"^https:\/\/(.*\.(pages\.dev|workers\.dev)|localhost(:\d+)?)$"

    @property
    def effective_gemini_api_key(self) -> Optional[str]:
        """Return the configured Gemini API key from GEMINI_API_KEY or LLM_API_KEY."""
        return self.GEMINI_API_KEY or self.LLM_API_KEY

    @property
    def allowed_extensions_list(self) -> List[str]:
        return [e.strip().lower() for e in self.ALLOWED_EXTENSIONS.split(",") if e.strip()]

    @property
    def max_file_size_bytes(self) -> int:
        return self.MAX_FILE_SIZE_MB * 1024 * 1024

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


settings = Settings()
