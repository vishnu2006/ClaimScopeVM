# ClaimScope — Project Master Architecture & Implementation Plan

> **Product:** ClaimScope — Auto Accident Claim Investigation Assistant  
> **Domain:** US Property & Casualty (P&C) Auto Insurance  
> **Target Persona:** Auto Claims Adjusters & SIU (Special Investigation Unit) Investigators  
> **Core Principle:** Assistive Human-in-the-Loop decision intelligence. ClaimScope **never** unilaterally approves, denies, or brands a claim fraudulent. Every insight and discrepancy is traceable directly to source evidence.

---

## 1. Executive Overview & Architecture

ClaimScope is a multimodal, evidence-driven, LangGraph-orchestrated insurance claim investigation platform designed specifically for the US P&C Auto market. It ingests mixed incident packages—including First Notice of Loss (FNOL) forms, official police accident reports, certified repair estimates, scanned/handwritten submissions, and scene/damage photographs—and executes an adaptive, conditional agent pipeline to extract structured facts, assess physical damage, verify consistency across disparate sources, and generate explainable investigation reports.

### High-Level System Architecture

```mermaid
flowchart TD
    subgraph Client ["Frontend (Next.js 16 + React 19 + Tailwind CSS)"]
        UI_Dash["Dashboard & Case Management"]
        UI_Intake["Multi-Document Drag & Drop Intake"]
        UI_Stepper["Adaptive Investigation Stepper"]
        UI_Review["5 Adjuster Workbenches (Docs, Facts, Vision, Discrepancies, Report)"]
    end

    subgraph Backend ["Backend API (FastAPI + Async Python 3.12)"]
        API_Router["REST API Router (/api/v1)"]
        Case_Service["Case & Document Persistence Service"]
        DB[(PostgreSQL / Async SQLite Storage)]
    end

    subgraph Orchestration ["Agent Orchestration (LangGraph StateGraph)"]
        State["Central CaseState Object"]
        Classifier["1. Document Classifier Node"]
        Router{"Conditional Router"}
        FNOL_Agent["2. FNOL Extraction Agent"]
        Police_Agent["3. Police Report Agent"]
        Estimate_Agent["4. Repair Estimate Agent"]
        Vision_Agent["5. Vehicle Damage Vision Agent"]
        Consistency_Agent["6. Cross-Document Consistency Agent"]
        Report_Node["7. Synthesis & Report Generator Node"]
    end

    subgraph Models ["AI Engine (Google Gemini Official SDK)"]
        Gemini_Flash["gemini-2.5-flash (Multimodal OCR & Vision Analysis)"]
    end

    UI_Intake -->|Upload Files| API_Router
    API_Router --> Case_Service
    Case_Service --> DB
    UI_Review -->|Trigger Investigation| API_Router
    API_Router --> State
    State --> Classifier
    Classifier --> Router
    Router -->|If FNOL exists| FNOL_Agent
    Router -->|If Police Report exists| Police_Agent
    Router -->|If Estimate exists| Estimate_Agent
    Router -->|If Photos exist| Vision_Agent
    FNOL_Agent & Police_Agent & Estimate_Agent & Vision_Agent --> Consistency_Agent
    Consistency_Agent --> Report_Node
    Report_Node --> DB
    
    FNOL_Agent -.-> Gemini_Flash
    Police_Agent -.-> Gemini_Flash
    Estimate_Agent -.-> Gemini_Flash
    Vision_Agent -.-> Gemini_Flash
    Consistency_Agent -.-> Gemini_Flash
```

---

## 2. Technology Stack & Design Principles

| Layer | Technology | Rationale |
|---|---|---|
| **Frontend Framework** | Next.js 16 (App Router, Turbopack, React 19) | Modern server/client rendering, type safety, production optimizations |
| **Styling & Icons** | Tailwind CSS + Lucide React | Restrained enterprise design system; zero extraneous decorative elements |
| **Backend API** | FastAPI (ASGI, Asyncio, Python 3.12) | High-performance asynchronous execution, auto OpenAPI generation |
| **Orchestration** | LangGraph (`StateGraph`) | Explicit, inspectable state machine with dynamic conditional edges |
| **Data Validation** | Pydantic v2 | Strict schema validation, provenance tracking, typed JSON serialization |
| **PDF Extraction** | PyMuPDF (`fitz`) | Fast native text and vector stream extraction with page rendering fallback |
| **AI Provider** | Google Gemini (`google-genai` SDK) | Single unified provider for text, multimodal OCR, and vision reasoning |
| **Persistence** | SQLAlchemy 2.0 (Async) + SQLite/Postgres | Clean repository pattern with async sessions and audit tracking |

---

## 3. Core Schemas & Provenance Framework

### Provenance Tracking: `FieldWithProvenance[T]`
To ensure strict regulatory compliance and human-in-the-loop accountability, extracted facts in ClaimScope wrap raw values in a generic provenance container:

```python
class FieldWithProvenance(BaseModel, Generic[T]):
    value: Optional[T] = None
    confidence: Optional[float] = Field(None, ge=0.0, le=1.0)
    source_document: Optional[str] = None
    source_page: Optional[int] = None
    source_text: Optional[str] = None
    extraction_notes: Optional[str] = None
```

### Shared `CaseState` Schema
The LangGraph pipeline passes a single mutable typed state across all specialized nodes:
- `case_id` & `case_number`: Immutable claim identifiers.
- `documents`: Document inventory with metadata, file size, format, and content-based classification.
- `extractions`: Keyed extractions mapped by document ID (`FNOLExtraction`, `PoliceReportExtraction`, `RepairEstimateExtraction`).
- `vision_observations`: Keyed photographic findings (`PhotoDamageAnalysis`) per image file.
- `inconsistencies`: Detected contradictions and discrepancy findings (`InconsistencyFinding`).
- `agent_executions`: Real-time lifecycle records (`AgentExecutionRecord`) with status tracking (`pending`, `completed`, `skipped`, `failed`, `unavailable`).
- `missing_documents`: Inventory of standard documentation missing from the uploaded package.
- `investigation_limitations`: Contextual alerts highlighting unanalyzed factors or image quality limitations.
- `processing_log`: ISO-timestamped audit trail of all graph operations.

---

## 4. Vehicle Damage Vision Rubric & Guardrails

The `VehicleDamageVisionAgent` analyzes submitted accident photographs using Google Gemini 2.5 Flash with strict insurance domain guardrails:

### Severity Classification Rubric
1. **Minor**: Superficial scratches, light paint transfer, minor scuffs, small bumper dents; no compromised structural integrity; vehicle remains safely driveable.
2. **Moderate**: Medium panel deformation, fractured bumper cover, cracked headlight/taillight assembly, dented quarter panel/fender; non-structural component replacement or cosmetic repair required.
3. **Severe**: Heavy intrusion, crushed radiator support, deployed airbags, compromised steering/suspension geometry, torn structural unibody/frame rails, non-driveable.
4. **Catastrophic / Total Loss**: Complete structural collapse, rollover intrusion, cab crush, complete front-end demolition, or severe burned shell exceeding projected vehicle market valuation.

### Anti-Hallucination Guardrails
- **No Micrometer Measurements**: The agent never claims exact millimeter or inch panel gap measurements from 2D images.
- **No Hidden Damage Speculation**: It explicitly states internal component conditions cannot be confirmed without physical teardown.
- **No Speed / Causation Attribution**: It never speculates on vehicle velocity at impact or definitively decides fault based on photos alone.
- **No Repair Dollar Estimates**: Financial cost estimation from raw photos is prohibited; repair figures are grounded solely in certified repair estimates.

---

## 5. Development Roadmap (Five Stages)

### Stage 1: Architectural Foundation & FNOL Ingestion *(Completed)*
- Clean Next.js + FastAPI decoupled repository structure.
- Database models for Cases, Documents, Evidences, and Reports.
- Native PDF ingestion and text extraction via PyMuPDF.
- Enterprise design system, navigation shell, and case intake workflows.
- Unit and integration tests for core schemas and CRUD operations.

### Stage 2: Multimodal Investigation Engine & Adaptive Agents *(Completed)*
- **Gemini-Only AI Integration**: Unified on `google-genai` official SDK with free-tier friendly defaults (`gemini-2.5-flash`), exponential backoff for rate limits, and clear `ConfigurationError` handling.
- **Content-Based Document Classifier**: Heuristic text analysis + Gemini multimodal fallback for classifying FNOLs, Police Reports, Repair Estimates, and Scene Photos.
- **Multimodal Document Processing**: Dedicated Pydantic extraction pipelines for police accident reports, auto body repair estimates, and handwritten/scanned documents.
- **Vehicle Damage Vision Agent**: Structured photograph analysis with an explainable damage rubric and guardrails.
- **Cross-Document Consistency Agent**: Deterministic discrepancy engine (VIN, date, plate validation) + Gemini semantic discrepancy engine (narrative and impact point contradiction detection).
- **LangGraph Dynamic Workflow**: Adaptive StateGraph execution that dynamically skips absent document types and logs omissions.
- **Synthetic Test Packages**: Automated generators for 5 test scenarios (A: Clean Minor, B: Staged Front/Rear Contradiction, C: Total Loss Rollover, D: FNOL Only, E: Hit-and-Run Unidentified).
- **Interactive Adjuster UI**: 5 dedicated workbench tabs (Incident Documents, Extracted Facts & Provenance, Vision Analysis, Discrepancies, Investigation Report) with real-time Stepper feedback.

### Stage 3: Selective External Verification, Assessment Engine & PDF Reports *(Completed)*
- **Selective External Verification**: Real public API grounding capability integrated into LangGraph (`external_verifier_node`):
  - **NHTSA vPIC Government API**: Authoritative VIN decoding (Year/Make/Model/Plant Country/Vehicle Type) with format and checksum checks.
  - **Open-Meteo Historical Weather Archive**: Free geocoding + hourly meteorological observation lookups for reported crash location and timestamp (verifying wet road, heavy rain, or clear weather claims).
  - **Collision Repair Benchmarks**: Regional labor rate and gross total cost range comparisons grounded against US national CCC ONE / Mitchell repair benchmarks.
  - **Transparent Evidence Provenance**: Statuses (`verified`, `inconclusive`, `source_unavailable`); no fabricated search results or hallucinations.
- **Explainable Claim Assessment Engine**: Hybrid deterministic rule engine grounded in authentic US P&C adjuster workflows:
  - `TRG-MAT-01`: Direct liability or physical impact contradiction (FNOL vs. Police Report).
  - `TRG-VIN-02`: Vehicle identification or VIN mismatch across sources.
  - `TRG-SEV-03`: Stated low-speed impact versus severe or catastrophic structural damage.
  - `TRG-DOC-04`: Missing required core casualty documentation.
  - `TRG-TIM-05`: Suspicious delayed loss reporting (>14 calendar days).
  - `TRG-EXT-06`: External weather or VIN verification discrepancy.
  - `TRG-STR-08`: Suspected structural or frame rail compromise requiring physical rack teardown.
  - **Adjuster Outcomes**: `ROUTINE_REVIEW`, `ADDITIONAL_INFORMATION_REQUIRED`, `ESCALATE_FOR_HUMAN_REVIEW`.
- **Calibrated Vision Rubric**: Guardrails preventing overconfident conclusions regarding hidden unibody damage or unilateral driveability from single-angle 2D photographs.
- **Institutional PDF Report Generator**: ReportLab-powered multi-page investigation document (`GET /api/v1/cases/{case_id}/report/pdf`) with official letterhead, recommendation banner, discrepancies table, external verification citations, and decision-support notices.
- **Synthetic Investigation Sandbox**: 1-click dashboard runner (`POST /api/v1/cases/synthetic/{scenario_id}`) allowing instant loading and examination of Cases A through E.
- **Frontend Workbench Refinement**: Live polling during investigation execution, 7-stage adaptive stepper, PDF download buttons on case headers and report preview, and visual display of triggered review rules and recommended adjuster action items.

### Stage 4: Final Product Engineering, Evaluation Framework & Release Readiness *(Completed)*
- **Lightweight Quantitative Evaluation Framework**:
  - Independent ground-truth dataset in `backend/app/evaluation/ground_truth.json` covering Cases A through E.
  - Mathematical metric formulations in `backend/app/evaluation/metrics.py` (routing accuracy, inconsistency precision/recall/F1, human-review tier agreement, evidence traceability, and report completeness).
  - Reproducible evaluation runner executable via `python backend/scripts/run_evaluation.py` and `python -m app.evaluation.runner`.
  - Offline deterministic benchmarks achieve **100% routing accuracy**, **100% human-review tier agreement**, and **100% schema completeness**, while live Gemini extraction metrics are transparently marked `[NOT EVALUATED — AWAITING GEMINI_API_KEY]`.
- **Enhanced Investigation Workbench & Evidence Inspection**:
  - Full 6-tab enterprise workspace: Incident Documents, Extracted Facts, Vision Analysis, Discrepancies, External Grounding, and Investigation Report.
  - Interactive `EvidenceInspection` component with instant search, category filtering chips, conflict-only toggles, and click-to-open provenance modal.
  - Dedicated `ExternalVerificationList` tab detailing NHTSA VIN decodes, Open-Meteo weather records, and collision repair cost benchmarks.
  - Accidental duplicate run prevention (`disabled={isInvestigating}`).
- **Gemini Diagnostic Utility & Readiness**:
  - FastAPI diagnostic endpoint: `GET /api/v1/diagnostics/gemini`.
  - Standalone terminal utility: `python backend/scripts/check_gemini.py`.
- **Synthetic Demonstration Suite**:
  - Complete documentation in `backend/synthetic_packages/README.md` detailing Cases A through E.
  - 1-click execution sandbox on dashboard.
- **Comprehensive Documentation Suite**:
  - `ARCHITECTURE.md`: Complete system design, LangGraph StateGraph flowcharts, and security model.
  - `RESEARCH_SUMMARY.md`: Authoritative P&C claims research (NAIC MDL-900, ACORD 1, NICB, NHTSA, CCC ONE, I-CAR).
  - `EVALUATION.md`: Formal evaluation methodology, ground-truth data, metrics, and baseline results.
  - `DEMO_GUIDE.md`: Step-by-step presentation script for capstone reviews.
  - `LIMITATIONS.md`: Responsible AI guardrails, NAIC compliance, and technical physical damage constraints.
  - `README.md`: Peak-quality enterprise repository documentation.

---

## 6. Synthetic Demonstration Package Scenarios

ClaimScope includes 5 synthetic incident packages located in `backend/synthetic_packages/`:

| Case | Scenario Title | Included Documents | Expected Engine Behavior |
|---|---|---|---|
| **Case A** | *FNOL-Only Partial Package* | `incident_form.pdf` | Partial intake: skips police/estimate/vision agents; flags `ADDITIONAL_INFORMATION_REQUIRED` due to pending body shop estimate. |
| **Case B** | *FNOL + Photographs Package* | `incident_form.pdf`<br>`damage_photo_front.png`<br>`damage_photo_wheel.png` | Multimodal ingestion: analyzes front bumper and alloy wheel rim damage; flags missing police/estimate documentation. |
| **Case C** | *Complete Consistent Package* | `incident_form.pdf`<br>`police_report.pdf`<br>`repair_estimate.pdf`<br>`rear_damage_photo.png` | Full multi-agent pipeline: all 7 stages execute; mutually consistent facts; decodes VIN via NHTSA; `ROUTINE_REVIEW` outcome. |
| **Case D** | *Complete Package with Contradictions* | `incident_form.pdf`<br>`police_report.pdf`<br>`damage_photo_severe.png` | Staged collision / fraud indicators: driver claims deer collision at 21:00 with $500 scuff; police cite running red light at 55mph at 02:30 broadsiding car with deployed airbags; VIN suffix mismatch; `ESCALATE_FOR_HUMAN_REVIEW` (`TRG-MAT-01`, `TRG-VIN-02`, `TRG-SEV-03`). |
| **Case E** | *Incomplete / Handwritten Sparse Package* | `scanned_handwritten_note.pdf` | Document AI OCR & non-hallucination: sparse handwritten note; missing fields remain null; flags `TRG-DOC-04` for missing core records. |

---

## 7. Configuration & Environment Setup

ClaimScope is pre-configured to operate on Google Gemini without requiring any paid subscription.

1. **Backend Environment** (`backend/.env`):
   ```bash
   APP_NAME="ClaimScope API"
   APP_VERSION="0.2.0"
   DEBUG=false
   
   # Database (defaults to async SQLite if Postgres is omitted)
   DATABASE_URL="sqlite+aiosqlite:///./claimscope.db"
   
   # AI Provider (Google Gemini ONLY)
   GEMINI_API_KEY="your-gemini-api-key-here"
   GEMINI_MODEL="gemini-2.5-flash"
   GEMINI_TEMPERATURE=0.1
   GEMINI_MAX_TOKENS=4096
   
   # Uploads & Storage
   UPLOAD_DIR="uploads"
   MAX_FILE_SIZE_MB=50
   CORS_ORIGINS="http://localhost:3000"
   ```

2. **Frontend Environment** (`frontend/.env.local`):
   ```bash
   NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
   ```

3. **Running the Application**:
   ```powershell
   # Terminal 1: Backend Server
   cd backend; python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

   # Terminal 2: Frontend Server
   cd frontend; npm run dev
   ```
