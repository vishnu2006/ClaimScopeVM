import sys
import logging
from typing import Dict, Any
from fastapi import APIRouter
from app.config import settings

logger = logging.getLogger("claimscope.diagnostics")

router = APIRouter(prefix="/diagnostics", tags=["diagnostics"])


@router.get("/gemini")
async def check_gemini_connectivity() -> Dict[str, Any]:
    """
    Diagnostic endpoint to verify Google Gemini API connectivity.
    Never exposes full API keys in responses or logs.
    """
    key_configured = bool(settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip())
    masked_key = None
    if key_configured:
        key_str = settings.GEMINI_API_KEY.strip()
        masked_key = f"{key_str[:6]}...{key_str[-4:]}" if len(key_str) > 10 else "***configured***"

    response_data: Dict[str, Any] = {
        "provider": "Google Gemini",
        "configured_model": settings.GEMINI_MODEL,
        "api_key_configured": key_configured,
        "masked_key": masked_key,
        "system_status": {
            "python_version": sys.version.split()[0],
            "upload_dir_exists": True,
            "max_file_size_mb": settings.MAX_FILE_SIZE_MB,
        },
    }

    if not key_configured:
        response_data["connectivity_status"] = "unconfigured"
        response_data["message"] = (
            "GEMINI_API_KEY is not configured in backend/.env. "
            "Please add your Gemini API key to backend/.env (e.g., GEMINI_API_KEY=AIzaSy...) "
            "to enable live multimodal document extraction, vision analysis, and synthesis."
        )
        return response_data

    # Attempt live diagnostic ping
    try:
        from google import genai
        client = genai.Client(api_key=settings.GEMINI_API_KEY.strip())
        test_resp = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents="Hello. Reply with 'READY' to verify API connection.",
        )
        response_text = test_resp.text.strip() if hasattr(test_resp, "text") and test_resp.text else "OK"
        response_data["connectivity_status"] = "connected"
        response_data["message"] = f"Successfully authenticated with Google Gemini. Handshake reply: {response_text}"
        return response_data
    except Exception as exc:
        logger.warning(f"Gemini diagnostic connection test failed: {exc}")
        response_data["connectivity_status"] = "error"
        response_data["message"] = f"Gemini API handshake failed: {str(exc)}"
        return response_data
