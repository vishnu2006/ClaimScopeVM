# ClaimScope — Insurance Industry Research & Adjuster Workflow Synthesis

## Executive Summary

ClaimScope's technical architecture, multi-agent pipeline, and explainable rule engine are grounded in authentic Property & Casualty (P&C) automobile claims workflows practiced by leading US carriers and regulated by state insurance departments. 

This document summarizes the authoritative standards, industry clearinghouse practices, and statutory guardrails that directly influenced ClaimScope's engineering decisions.

---

## 1. Regulatory Framework & Human-in-the-Loop Principles

### NAIC Model Unfair Claims Settlement Practices Act (MDL-900)
- **Regulatory Requirement**: State insurance departments (e.g., California Department of Insurance, New York DFS, Texas TDI) prohibit "failing to adopt and implement reasonable standards for the prompt investigation of claims" and "refusing to pay claims without conducting a reasonable investigation based upon all available information."
- **Architectural Impact on ClaimScope**:
  1. **Strict Assistive Boundaries**: ClaimScope explicitly positions itself as an **assistive decision-support system**. It never issues automated denials, coverage revocations, or fraud accusations.
  2. **Audit Trails & Evidence Provenance**: Under NAIC standards, every claims decision must be defendable in a market conduct examination. ClaimScope ensures that every extracted fact maintains a direct citation (`source_document`, `source_page`, and extraction confidence) back to the original submitted record.
  3. **No Unilateral Total Loss**: Automated vision algorithms cannot condemn a vehicle as a total loss without a licensed physical damage appraiser's visual teardown.

---

## 2. Document Standards & Field Ingestion

### ACORD 1 — Automobile Loss Notice Standards
- **Industry Standard**: The Association for Cooperative Operations Research and Development (ACORD) establishes the universal standard for First Notice of Loss (FNOL) forms across North American carriers.
- **Architectural Impact on ClaimScope**:
  - The `FNOLExtraction` schema (`backend/app/schemas/evidence.py`) mirrors the core structural entities of ACORD 1:
    - Policy & Coverage Identifiers (Policy Number, Effective Dates)
    - Loss Chronology (Date of Loss, Time, Exact Geospatial Location)
    - Insured & Claimant Information (Name, Contact, Driver's License)
    - Vehicle Manifest (Year, Make, Model, VIN, License Plate, Point of Initial Impact)
    - Casualty & Police Involvement (Injury indicators, Investigating Agency, Officer Badge)
  - **Preservation of Missing Values**: ACORD guidance dictates that absent data must remain unrecorded rather than populated with default values. ClaimScope enforces `Optional[T] = None` across all extraction attributes to prevent hallucinated data.

---

## 3. Fraud Indicators & Cross-Document Reconciliation

### NICB (National Insurance Crime Bureau) & ISO ClaimSearch Principles
- **Industry Standard**: The National Insurance Crime Bureau (NICB) and Verisk ISO ClaimSearch outline recognized indicators of potential claims anomalies ("red flags"):
  1. **Contradictions in Loss Dynamics**: Inconsistencies between the policyholder's narrative and third-party official records (e.g., police accident reports).
  2. **Vehicle Identity Discrepancies**: Altered, transposed, or mismatched VIN characters across incident documents, often indicative of vehicle cloning or policy substitution.
  3. **Low-Speed Narrative vs. High-Severity Damage**: Policyholder claiming a minor 5 mph parking lot bump while physical evidence exhibits severe structural cabin crush, broken suspension, or deployed airbags.
- **Architectural Impact on ClaimScope**:
  - Implemented the deterministic and semantic **Cross-Document Consistency Agent** (`backend/app/services/consistency_detector.py`).
  - Implemented specific review triggers:
    - `TRG-MAT-01`: Direct liability or narrative conflict between FNOL and police report.
    - `TRG-VIN-02`: VIN mismatch across documents (critical severity).
    - `TRG-SEV-03`: Stated minor severity contradicting photographic airbags or unibody crush.

---

## 4. Authoritative External Verification

### NHTSA 49 CFR Part 565 & vPIC API
- **Federal Standard**: Under Title 49 of the Code of Federal Regulations, Part 565, all road vehicles manufactured for US sale must possess a 17-character Vehicle Identification Number with a calculated check-digit in position 9.
- **Architectural Impact on ClaimScope**:
  - The `ExternalVerificationService` integrates the free public **NHTSA vPIC API** (`https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/`).
  - Verifies that the claimed VIN is structurally valid and decodes the model year, make, model, vehicle category, and assembly plant country, flagging discrepancies against policyholder representations (`TRG-EXT-06`).

### Meteorological Corroboration via Open-Meteo
- **Forensic Standard**: Insurance SIU investigators frequently cross-reference claims alleging "heavy rain / slippery road" against historical meteorological data.
- **Architectural Impact on ClaimScope**:
  - Integrates the free public **Open-Meteo Historical Weather Archive API** (`https://archive-api.open-meteo.com/v1/archive`).
  - Resolves location coordinates via geocoding and retrieves historical temperature, precipitation, and weather codes for the reported date and hour, corroborating or questioning weather claims (`TRG-EXT-07`).

---

## 5. Collision Estimating & Physical Damage Standards

### CCC ONE / Mitchell / I-CAR Industry Benchmarks
- **Industry Standard**: Collision repair estimates in the US are predominantly compiled using CCC ONE, Mitchell Cloud Estimating, or Audatex systems. These platforms segment costs into parts, body labor, paint labor, mechanical labor, and sublet operations.
- **I-CAR Structural Guidelines**: I-CAR (Inter-Industry Conference on Auto Collision Repair) stresses that exterior cosmetic panel damage can mask severe underlying unibody, frame rail, or apron misalignment.
- **Architectural Impact on ClaimScope**:
  - **Calibrated Vision Rubric**: Vision prompts in `vision_extractor.py` explicitly instruct Gemini to restrict photographic conclusions to *observable exterior components* and explicitly note that concealed frame alignment cannot be determined from single-angle photos.
  - **Repair Cost Benchmarks**: Grounded against regional collision index averages ($58–$72/hr body labor, $90–$115/hr mechanical labor), flagging questionable estimate totals that deviate significantly from industry norms.

---

## 6. Authoritative Citations & References

1. **National Association of Insurance Commissioners (NAIC)**. *Model Unfair Claims Settlement Practices Act*, Model Regulation #900, 2021.
2. **ACORD Corporation**. *ACORD 1: Automobile Loss Notice Standards Specification*, 2023.
3. **National Insurance Crime Bureau (NICB)**. *Vehicle Theft & Fraud Indicator Guidelines for P&C Adjusters*, 2022.
4. **National Highway Traffic Safety Administration (NHTSA)**. *Vehicle Identification Number (VIN) Requirements*, 49 C.F.R. Part 565, US Department of Transportation.
5. **CCC Intelligent Solutions**. *Crash Course: US Collision Repair Industry Trends & Benchmarks*, 2024.
6. **I-CAR (Inter-Industry Conference on Auto Collision Repair)**. *Uniform Procedures for Collision Repair: Structural & Unibody Inspection Protocols*, 2023.
