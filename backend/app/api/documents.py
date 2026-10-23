import os
import uuid
from datetime import datetime, timezone
from typing import List, Optional
import aiofiles
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.auth import get_optional_current_user
from app.auth_utils import get_authorized_case
from app.dependencies import get_db_session, get_document_processor, get_fnol_extractor
from app.models.case import Case
from app.models.user import User
from app.models.document import Document
from app.models.evidence import Evidence
from app.schemas.common import DocumentType, EvidenceType, ProcessingStatus
from app.schemas.document import DocumentProcessResponse, DocumentResponse, DocumentUploadResponse
from app.services.document_classifier import DocumentClassifier
from app.services.document_processor import DocumentProcessor
from app.services.fnol_extractor import FNOLExtractor
from app.services.llm_provider import ConfigurationError, get_llm_provider
from app.services.police_report_extractor import PoliceReportExtractor
from app.services.repair_estimate_extractor import RepairEstimateExtractor
from app.services.vision_extractor import VehicleDamageVisionAgent
from app.utils.file_validation import validate_upload
from app.utils.security import sanitize_filename

router = APIRouter(prefix="/cases/{case_id}/documents", tags=["documents"])


@router.post("", response_model=List[DocumentUploadResponse], status_code=status.HTTP_201_CREATED)
async def upload_documents(
    case_id: uuid.UUID,
    files: List[UploadFile] = File(...),
    db: AsyncSession = Depends(get_db_session),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """Upload one or multiple documents for a specific case with automated content classification."""
    case = await get_authorized_case(case_id=case_id, db=db, user=current_user)

    if not files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No files were provided in the request.",
        )

    # Ensure uploads directory exists
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    uploaded_docs: List[DocumentUploadResponse] = []
    classifier = DocumentClassifier()

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

        # Content-based document classification
        classification = classifier.classify_by_content(destination_path, mime_type=mime)
        doc_type = classification.document_type

        # Save record in database with explicit pre-generated UUID
        doc_id = uuid.uuid4()
        doc = Document(
            id=doc_id,
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
        uploaded_docs.append(
            DocumentUploadResponse(
                id=doc_id,
                original_filename=doc.original_filename,
                processing_status=doc.processing_status,
                document_type=doc.document_type,
                file_size_bytes=doc.file_size_bytes,
                message=f"Uploaded and classified as {doc.document_type.value}",
            )
        )

    await db.flush()
    return uploaded_docs


@router.get("", response_model=List[DocumentResponse])
async def list_documents(
    case_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """List all documents attached to a case with user authorization."""
    await get_authorized_case(case_id=case_id, db=db, user=current_user)

    query = select(Document).where(Document.case_id == case_id).order_by(Document.uploaded_at.asc())
    result = await db.execute(query)
    docs = result.scalars().all()
    return docs


@router.get("/{doc_id}", response_model=DocumentResponse)
async def get_document(
    case_id: uuid.UUID,
    doc_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    await get_authorized_case(case_id=case_id, db=db, user=current_user)
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


@router.get("/{doc_id}/raw")
async def get_document_raw_file(
    case_id: uuid.UUID,
    doc_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    await get_authorized_case(case_id=case_id, db=db, user=current_user)
    """Serve the raw uploaded document or image file directly for in-browser inspection."""
    query = select(Document).where(Document.id == doc_id, Document.case_id == case_id)
    result = await db.execute(query)
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with ID {doc_id} not found for case {case_id}",
        )
    if not doc.file_path or not os.path.exists(doc.file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Raw document file not found at path: {doc.file_path}",
        )

    mime = doc.mime_type or "application/octet-stream"
    return FileResponse(
        path=doc.file_path,
        media_type=mime,
        filename=doc.original_filename,
        content_disposition_type="inline",
    )


@router.delete("/{doc_id}", status_code=status.HTTP_200_OK)
async def delete_document(
    case_id: uuid.UUID,
    doc_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    await get_authorized_case(case_id=case_id, db=db, user=current_user)
    """Delete a document record and its underlying stored file."""
    query = select(Document).where(Document.id == doc_id, Document.case_id == case_id)
    result = await db.execute(query)
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with ID {doc_id} not found for case {case_id}",
        )

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
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    await get_authorized_case(case_id=case_id, db=db, user=current_user)
    """Trigger text extraction via PyMuPDF/Gemini and structured extraction based on document type."""
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

        # Re-check classification if unknown
        if doc.document_type in [DocumentType.UNKNOWN, DocumentType.OTHER]:
            classifier = DocumentClassifier(processor)
            class_res = classifier.classify_by_content(doc.file_path, extracted_text=extracted_text)
            doc.document_type = class_res.document_type

        # Step 2: Handle extraction based on document type
        if doc.document_type == DocumentType.FNOL:
            if not extracted_text and doc.file_extension == ".pdf":
                provider = get_llm_provider()
                extracted_text = await processor.transcribe_scanned_document(doc.file_path, provider)
                doc.extracted_text = extracted_text

            if not extracted_text:
                raise ValueError("No extractable text found in FNOL document.")

            fnol_data = await fnol_extractor.extract(
                document_text=extracted_text,
                document_name=doc.original_filename,
            )
            structured_extraction = fnol_data.model_dump()

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
                    confidence=prov_dict.get("confidence") or 0.9,
                    source_document=prov_dict.get("source_document") or doc.original_filename,
                    source_page=prov_dict.get("source_page"),
                    source_location=prov_dict.get("source_text"),
                    notes=prov_dict.get("extraction_notes"),
                )
                db.add(ev)

            add_evidence("policy_info", "policy_number", structured_extraction.get("policy_number"))
            add_evidence("claim_info", "claim_number", structured_extraction.get("claim_number"))
            add_evidence("incident_details", "incident_date", structured_extraction.get("incident_date"))
            add_evidence("incident_details", "incident_time", structured_extraction.get("incident_time"))
            add_evidence("incident_details", "description", structured_extraction.get("incident_description"))
            add_evidence("incident_details", "weather", structured_extraction.get("weather_conditions"))
            add_evidence("incident_details", "road_conditions", structured_extraction.get("road_conditions"))
            add_evidence("damage_info", "estimated_damage", structured_extraction.get("estimated_damage_amount"))

        elif doc.document_type == DocumentType.POLICE_REPORT:
            provider = get_llm_provider()
            if not extracted_text and doc.file_extension == ".pdf":
                extracted_text = await processor.transcribe_scanned_document(doc.file_path, provider)
                doc.extracted_text = extracted_text

            police_extractor = PoliceReportExtractor(provider)
            police_data = await police_extractor.extract(extracted_text, doc.original_filename)
            structured_extraction = police_data.model_dump()

            # Record police evidence
            if police_data.narrative and police_data.narrative.value:
                db.add(
                    Evidence(
                        case_id=case_id,
                        document_id=doc.id,
                        evidence_type=EvidenceType.EXTRACTED_FIELD,
                        category="police_narrative",
                        field_name="officer_narrative",
                        field_value=police_data.narrative.value,
                        confidence=police_data.narrative.confidence or 0.95,
                        source_document=doc.original_filename,
                    )
                )

        elif doc.document_type == DocumentType.REPAIR_ESTIMATE:
            provider = get_llm_provider()
            if not extracted_text and doc.file_extension == ".pdf":
                extracted_text = await processor.transcribe_scanned_document(doc.file_path, provider)
                doc.extracted_text = extracted_text

            estimate_extractor = RepairEstimateExtractor(provider)
            est_data = await estimate_extractor.extract(extracted_text, doc.original_filename)
            structured_extraction = est_data.model_dump()

        elif doc.document_type == DocumentType.PHOTO:
            provider = get_llm_provider()
            vision_agent = VehicleDamageVisionAgent(provider)
            photo_analysis = await vision_agent.analyze_photo(doc.file_path, doc.original_filename)
            structured_extraction = photo_analysis.model_dump()

            db.add(
                Evidence(
                    case_id=case_id,
                    document_id=doc.id,
                    evidence_type=EvidenceType.VISUAL_OBSERVATION,
                    category="visual_damage",
                    field_name=photo_analysis.visible_vehicle_region,
                    field_value=f"Severity: {photo_analysis.severity_category.upper()}. {photo_analysis.severity_explanation}",
                    confidence=photo_analysis.confidence_score,
                    source_document=doc.original_filename,
                    conflicting_values={
                        "observable_damage": photo_analysis.observable_damage,
                        "affected_components": photo_analysis.affected_components,
                    },
                )
            )

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
