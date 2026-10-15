import os
import uuid
from datetime import datetime, timezone
from typing import List, Optional
import aiofiles
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.dependencies import get_db_session, get_document_processor, get_fnol_extractor
from app.models.case import Case
from app.models.document import Document
from app.models.evidence import Evidence
from app.schemas.common import DocumentType, EvidenceType, ProcessingStatus
from app.schemas.document import DocumentProcessResponse, DocumentResponse, DocumentUploadResponse
from app.services.document_processor import DocumentProcessor
from app.services.fnol_extractor import FNOLExtractor
from app.services.llm_provider import ConfigurationError
from app.utils.file_validation import infer_document_type, validate_upload
from app.utils.security import sanitize_filename

router = APIRouter(prefix="/cases/{case_id}/documents", tags=["documents"])


@router.post("", response_model=List[DocumentUploadResponse], status_code=status.HTTP_201_CREATED)
async def upload_documents(
    case_id: uuid.UUID,
    files: List[UploadFile] = File(...),
    db: AsyncSession = Depends(get_db_session),
):
    """Upload one or multiple documents for a specific case."""
    # Verify case exists
    case_query = select(Case).where(Case.id == case_id)
    case_res = await db.execute(case_query)
    case = case_res.scalar_one_or_none()
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Case with ID {case_id} not found",
        )

    if not files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No files were provided in the request.",
        )

    # Ensure uploads directory exists
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    uploaded_docs: List[DocumentUploadResponse] = []

    for file in files:
        # Validate file
        is_valid, error_msg = validate_upload(file, settings)
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_msg,
            )

        # Sanitize filename and determine storage path
        stored_filename = sanitize_filename(file.filename or "uploaded_file")
        destination_path = os.path.join(settings.UPLOAD_DIR, stored_filename)

        # Write file content asynchronously
        file_size = 0
        try:
            async with aiofiles.open(destination_path, "wb") as out_file:
                while content := await file.read(1024 * 64):  # 64KB chunks
                    file_size += len(content)
                    if file_size > settings.max_file_size_bytes:
                        # Clean up partial file
                        await out_file.close()
                        if os.path.exists(destination_path):
                            os.remove(destination_path)
                        raise HTTPException(
                            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                            detail=f"File '{file.filename}' exceeds max size of {settings.MAX_FILE_SIZE_MB}MB",
                        )
                    await out_file.write(content)
        except Exception as e:
            if isinstance(e, HTTPException):
                raise e
            if os.path.exists(destination_path):
                os.remove(destination_path)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to store file '{file.filename}': {str(e)}",
            )

        # Detect extension and mime
        _, ext = os.path.splitext(file.filename or "")
        mime = file.content_type or "application/octet-stream"
        doc_type = infer_document_type(file.filename or "", mime)

        # Save record in database
        doc = Document(
            case_id=case_id,
            original_filename=file.filename or "file",
            stored_filename=stored_filename,
            file_path=destination_path,
            file_size_bytes=file_size,
            mime_type=mime,
            file_extension=ext.lower(),
            document_type=doc_type,
            processing_status=ProcessingStatus.PENDING,
        )
        db.add(doc)
        await db.flush()
        await db.refresh(doc)

        uploaded_docs.append(
            DocumentUploadResponse(
                id=doc.id,
                original_filename=doc.original_filename,
                processing_status=doc.processing_status,
                document_type=doc.document_type,
                file_size_bytes=doc.file_size_bytes,
                message="Uploaded successfully",
            )
        )

    return uploaded_docs


@router.get("", response_model=List[DocumentResponse])
async def list_documents(
    case_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
):
    """List all documents attached to a case."""
    case_query = select(Case.id).where(Case.id == case_id)
    case_res = await db.execute(case_query)
    if not case_res.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Case with ID {case_id} not found",
        )

    query = select(Document).where(Document.case_id == case_id).order_by(Document.uploaded_at.asc())
    result = await db.execute(query)
    docs = result.scalars().all()
    return docs


@router.get("/{doc_id}", response_model=DocumentResponse)
async def get_document(
    case_id: uuid.UUID,
    doc_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
):
    """Get metadata and extracted text for a specific document."""
    query = select(Document).where(Document.id == doc_id, Document.case_id == case_id)
    result = await db.execute(query)
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with ID {doc_id} not found for case {case_id}",
        )
    return doc


@router.delete("/{doc_id}", status_code=status.HTTP_200_OK)
async def delete_document(
    case_id: uuid.UUID,
    doc_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
):
    """Delete a document record and its underlying stored file."""
    query = select(Document).where(Document.id == doc_id, Document.case_id == case_id)
    result = await db.execute(query)
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with ID {doc_id} not found for case {case_id}",
        )

    # Delete physical file if present
    if doc.file_path and os.path.exists(doc.file_path):
        try:
            os.remove(doc.file_path)
        except OSError:
            pass

    await db.delete(doc)
    return {"message": "Document deleted successfully", "id": str(doc_id)}


@router.post("/{doc_id}/process", response_model=DocumentProcessResponse)
async def process_document(
    case_id: uuid.UUID,
    doc_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
    processor: DocumentProcessor = Depends(get_document_processor),
    fnol_extractor: FNOLExtractor = Depends(get_fnol_extractor),
):
    """Trigger text extraction via PyMuPDF and structured FNOL extraction via LLM."""
    query = select(Document).where(Document.id == doc_id, Document.case_id == case_id)
    result = await db.execute(query)
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with ID {doc_id} not found for case {case_id}",
        )

    doc.processing_status = ProcessingStatus.PROCESSING
    await db.flush()

    try:
        # Step 1: Text extraction via PyMuPDF
        extraction_res = processor.process_document(
            file_path=doc.file_path,
            mime_type=doc.mime_type,
            file_extension=doc.file_extension,
        )

        extracted_text = extraction_res.get("text", "")
        doc.extracted_text = extracted_text
        doc.page_count = extraction_res.get("page_count")

        structured_extraction = None

        # Step 2: If document is FNOL, run structured LLM extraction
        if doc.document_type == DocumentType.FNOL:
            if not extracted_text:
                raise ValueError("No extractable text found in FNOL document.")

            fnol_data = await fnol_extractor.extract(
                document_text=extracted_text,
                document_name=doc.original_filename,
            )
            structured_extraction = fnol_data.model_dump()

            # Record extracted fields into Evidence table
            def add_evidence(cat: str, name: str, prov_dict: Optional[dict]):
                if not prov_dict or prov_dict.get("value") is None:
                    return
                ev = Evidence(
                    case_id=case_id,
                    document_id=doc.id,
                    evidence_type=EvidenceType.EXTRACTED_FIELD,
                    category=cat,
                    field_name=name,
                    field_value=str(prov_dict.get("value")),
                    confidence=prov_dict.get("confidence"),
                    source_document=prov_dict.get("source_document") or doc.original_filename,
                    source_page=prov_dict.get("source_page"),
                    source_location=prov_dict.get("source_text"),
                    notes=prov_dict.get("extraction_notes"),
                )
                db.add(ev)

            # Persist individual fields with provenance
            add_evidence("policy_info", "policy_number", structured_extraction.get("policy_number"))
            add_evidence("claim_info", "claim_number", structured_extraction.get("claim_number"))
            add_evidence("incident_details", "incident_date", structured_extraction.get("incident_date"))
            add_evidence("incident_details", "incident_time", structured_extraction.get("incident_time"))
            add_evidence("incident_details", "description", structured_extraction.get("incident_description"))
            add_evidence("incident_details", "weather", structured_extraction.get("weather_conditions"))
            add_evidence("incident_details", "road_conditions", structured_extraction.get("road_conditions"))
            add_evidence("damage_info", "estimated_damage", structured_extraction.get("estimated_damage_amount"))

        doc.processing_status = ProcessingStatus.COMPLETED
        doc.processed_at = datetime.now(timezone.utc)
        doc.processing_error = None
        await db.flush()

        return DocumentProcessResponse(
            document_id=doc.id,
            processing_status=doc.processing_status,
            page_count=doc.page_count,
            text_length=len(extracted_text),
            extraction=structured_extraction,
            message="Document processed successfully",
        )

    except ConfigurationError as ce:
        doc.processing_status = ProcessingStatus.FAILED
        doc.processing_error = str(ce)
        await db.flush()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(ce),
        )
    except Exception as e:
        doc.processing_status = ProcessingStatus.FAILED
        doc.processing_error = str(e)
        await db.flush()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing document: {str(e)}",
        )
