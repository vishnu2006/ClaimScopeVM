# ClaimScope Backend API

Production-grade FastAPI backend for **ClaimScope** — an Agentic Multi-Document AI Platform for US P&C Auto Accident Claim Investigation.

---

## Overview

ClaimScope ingests heterogeneous auto accident incident packages (FNOL forms, police reports, repair estimates, and scene photos), extracts structured facts with full provenance, cross-references findings across documents to detect discrepancies, verifies repair costs and conditions, and generates structured investigation reports for claims adjusters.

---

## Tech Stack

- **Framework**: FastAPI 0.115.0
- **Runtime**: Python 3.12
- **Database**: SQLAlchemy 2.0 (Async) with asyncpg (PostgreSQL) / aiosqlite (in-memory for tests)
- **Document AI / Text Extraction**: PyMuPDF (fitz)
- **Structured Extraction**: Instructor with OpenAI, Anthropic, or Google Gemini
- **Validation**: Pydantic v2 & Pydantic-Settings
- **Testing**: Pytest & pytest-asyncio with HTTPX AsyncClient

---

## Directory Structure

```text
backend/
├── app/
│   ├── main.py                  # FastAPI application factory and lifespan
│   ├── config.py                # Pydantic BaseSettings configuration
│   ├── database.py              # Async SQLAlchemy engine and session
│   ├── dependencies.py          # FastAPI dependency injection
│   ├── api/
│   │   ├── router.py            # Main API router aggregation (/api/v1)
│   │   ├── cases.py             # Case CRUD & evidence endpoints
│   │   ├── documents.py         # Multipart upload & processing endpoints
│   │   └── reports.py           # Investigation report generation
│   ├── models/                  # SQLAlchemy 2.0 Declarative Models
│   │   ├── base.py              # Base and TimestampMixin
│   │   ├── case.py              # Case DB model
│   │   ├── document.py          # Document DB model
│   │   ├── evidence.py          # Evidence observation DB model
│   │   └── report.py            # Report DB model
│   ├── schemas/                 # Pydantic Schemas
│   │   ├── common.py            # Domain enums (CaseStatus, DocumentType, etc.)
│   │   ├── case.py              # CaseCreate, CaseResponse, CaseSummary
│   │   ├── document.py          # DocumentResponse, UploadResponse, ProcessResponse
│   │   ├── evidence.py          # FieldWithProvenance, FNOLExtraction
│   │   ├── case_state.py        # Shared CaseState for LangGraph pipeline
│   │   └── report.py            # InvestigationReport, ReportSection
│   ├── services/
│   │   ├── document_processor.py # PyMuPDF native PDF text extraction
│   │   ├── llm_provider.py       # Configurable LLM provider (OpenAI/Anthropic/Google)
│   │   └── fnol_extractor.py     # Structured FNOL data extraction
│   └── utils/
│       ├── file_validation.py    # MIME, extension, and file size checks
│       └── security.py           # Path sanitization and secure naming
├── tests/
│   ├── conftest.py              # Async test fixtures with SQLite in-memory
│   ├── test_schemas.py          # Schema validation tests
│   ├── test_cases.py            # Case CRUD and report endpoint tests
│   └── test_documents.py        # Document upload and validation tests
├── uploads/                     # Uploaded documents storage (gitignored)
├── requirements.txt
├── .env.example
└── README.md
```

---

## Setup & Running

### 1. Configure Environment
Copy `.env.example` to `.env` and fill in credentials:
```powershell
cp .env.example .env
```

Key environment variables:
- `DATABASE_URL`: PostgreSQL connection string (`postgresql+asyncpg://postgres:postgres@localhost:5432/claimscope`)
- `LLM_PROVIDER`: `openai`, `anthropic`, or `google`
- `LLM_MODEL`: `gpt-4o` (or `claude-3-5-sonnet-20241022`, `gemini-1.5-pro`)
- `LLM_API_KEY`: API key for your chosen provider
- `UPLOAD_DIR`: Path to uploaded documents folder (default: `uploads`)

### 2. Install Dependencies
```powershell
pip install -r requirements.txt
```

### 3. Run FastAPI Development Server
```powershell
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The interactive API docs will be available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

---

## Running Tests

Execute the automated test suite with pytest:
```powershell
pytest -v
```

Tests run fully in-memory using `aiosqlite` and don't require external PostgreSQL or live LLM credentials.

---

## Core API Endpoints

### Cases
- `POST /api/v1/cases` — Create a case (generates unique `CS-YYYY-XXXXXX` number)
- `GET /api/v1/cases` — List cases with document and evidence metrics
- `GET /api/v1/cases/{case_id}` — Get full case detail with attached documents
- `PATCH /api/v1/cases/{case_id}` — Update case title, priority, or status
- `DELETE /api/v1/cases/{case_id}` — Delete case and cascade delete artifacts
- `GET /api/v1/cases/{case_id}/evidence` — Get all extracted evidence observations

### Documents
- `POST /api/v1/cases/{case_id}/documents` — Multipart file upload (multiple files supported)
- `GET /api/v1/cases/{case_id}/documents` — List documents for a case
- `GET /api/v1/cases/{case_id}/documents/{doc_id}` — Get document metadata
- `DELETE /api/v1/cases/{case_id}/documents/{doc_id}` — Remove document
- `POST /api/v1/cases/{case_id}/documents/{doc_id}/process` — Trigger PyMuPDF text extraction & FNOL LLM extraction

### Reports
- `POST /api/v1/cases/{case_id}/reports` — Generate structured adjuster investigation report
- `GET /api/v1/cases/{case_id}/reports` — List generated reports for case
- `GET /api/v1/cases/{case_id}/reports/{report_id}` — View specific investigation report
