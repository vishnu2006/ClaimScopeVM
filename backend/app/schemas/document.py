import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

from app.schemas.common import BaseSchema, DocumentType, ProcessingStatus


class DocumentUploadResponse(BaseModel):
    id: uuid.UUID
    original_filename: str
    processing_status: ProcessingStatus
    document_type: DocumentType
    file_size_bytes: int
    message: str = "Uploaded successfully"


class DocumentResponse(BaseSchema):
    id: uuid.UUID
    case_id: uuid.UUID
    original_filename: str
    stored_filename: str
    file_path: str
    file_size_bytes: int
    mime_type: str
    file_extension: str
    document_type: DocumentType
    processing_status: ProcessingStatus
    processing_error: Optional[str] = None
    extracted_text: Optional[str] = None
    page_count: Optional[int] = None
    uploaded_at: datetime
    processed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class DocumentProcessResponse(BaseModel):
    document_id: uuid.UUID
    processing_status: ProcessingStatus
    page_count: Optional[int] = None
    text_length: int = 0
    extraction: Optional[dict] = None
    message: str
