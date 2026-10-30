import os
from typing import Optional, Tuple
from fastapi import UploadFile

from app.config import Settings, settings as default_settings
from app.schemas.common import DocumentType


ALLOWED_MIME_TYPES = {
    "application/pdf": [".pdf"],
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
    "image/webp": [".webp"],
    "image/tiff": [".tiff", ".tif"],
    "application/msword": [".doc"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    "application/octet-stream": [".pdf", ".jpg", ".jpeg", ".png", ".webp", ".tiff", ".tif", ".doc", ".docx"],
}


def validate_upload(
    file: UploadFile,
    settings: Optional[Settings] = None,
) -> Tuple[bool, str]:
    """Validate uploaded file for filename presence, extension, MIME type, and size.

    Returns (is_valid, error_message).
    """
    config = settings or default_settings

    if not file.filename or not file.filename.strip():
        return False, "File must have a non-empty filename."

    _, ext = os.path.splitext(file.filename.lower())
    if ext not in config.allowed_extensions_list:
        allowed = ", ".join(config.allowed_extensions_list)
        return False, f"File extension '{ext}' is not allowed. Supported extensions: {allowed}"

    # Size check if size attribute is present on UploadFile
    if file.size is not None and file.size > config.max_file_size_bytes:
        return (
            False,
            f"File '{file.filename}' exceeds maximum allowed size of {config.MAX_FILE_SIZE_MB}MB.",
        )

    return True, ""


def infer_document_type(filename: str, content_type: Optional[str] = None) -> DocumentType:
    """Heuristically infer document type from filename or content type."""
    lower_name = filename.lower()
    _, ext = os.path.splitext(lower_name)

    if ext in [".jpg", ".jpeg", ".png", ".webp", ".tiff", ".tif"]:
        return DocumentType.PHOTO

    if "police" in lower_name or "accident_report" in lower_name:
        return DocumentType.POLICE_REPORT
    elif "fnol" in lower_name or "first_notice" in lower_name or "incident" in lower_name:
        return DocumentType.FNOL
    elif "estimate" in lower_name or "repair" in lower_name or "appraisal" in lower_name:
        return DocumentType.REPAIR_ESTIMATE
    elif "medical" in lower_name or "treatment" in lower_name or "billing" in lower_name:
        return DocumentType.MEDICAL_RECORD
    elif "statement" in lower_name or "witness" in lower_name:
        return DocumentType.CORRESPONDENCE
    elif "note" in lower_name or "handwritten" in lower_name:
        return DocumentType.OTHER

    return DocumentType.UNKNOWN
