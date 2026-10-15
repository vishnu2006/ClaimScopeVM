# ClaimScope — Synthetic Incident Demonstration Packages

This directory contains five independently crafted, realistic test packages in the US Property & Casualty (P&C) Automobile Insurance domain. All names, vehicle identification numbers (VINs), policy numbers, addresses, and incident narratives are entirely fictional and designed specifically for evaluation and demonstration.

---

## Scenario Overview

| Package | Scenario Name | Included Documents | Key Investigation Demonstration |
|---|---|---|---|
| **Case A** | *FNOL-Only Partial Package* | `incident_form.pdf` | **Adaptive Routing & Graceful Degradation**: Demonstrates LangGraph supervisor dynamically executing FNOL extraction while skipping unneeded extractors (Police, Estimate, Vision). Assesses missing documentation without errors. |
| **Case B** | *FNOL + Photographs Package* | `incident_form.pdf`<br>`damage_photo_front.png`<br>`damage_photo_wheel.png` | **Multimodal Vision Integration**: Demonstrates simultaneous text extraction and computer vision damage analysis (front bumper crease, wheel rim scuff), verifying consistency between reported damage and visible components. |
| **Case C** | *Complete Consistent Package* | `incident_form.pdf`<br>`police_report.pdf`<br>`repair_estimate.pdf`<br>`rear_damage_photo.png` | **Full Multi-Agent Pipeline & Routine Review**: Exercises all 7 LangGraph stages. Cross-references policyholder statements, police collision report, and line-item repair estimate. Achieves `ROUTINE_REVIEW` with 0 discrepancies. |
| **Case D** | *Complete Package with Contradictions* | `incident_form.pdf`<br>`police_report.pdf`<br>`damage_photo_severe.png` | **Cross-Document Discrepancy & SIU Escalation**: Deliberate contradictions: driver claims hitting a deer at 21:00 with $500 plastic scuff; police cite solid red light violation broadsiding another car at 02:30 with deployed airbags; VIN suffix mismatch (`88123` vs `99999`). Triggers `TRG-MAT-01`, `TRG-VIN-02`, and `TRG-SEV-03` with `ESCALATE_FOR_HUMAN_REVIEW`. |
| **Case E** | *Incomplete / Handwritten Sparse Package* | `scanned_handwritten_note.pdf` | **Document AI OCR & Uncertainty Handling**: Sparse, low-quality scanned statement missing policy number, VIN, and collision details. Demonstrates missing value preservation (never hallucinating fields) and flagging `TRG-DOC-04` for missing core records. |

---

## Detailed Scenario Breakdown

### Case A: FNOL-Only Partial Package
- **Folder**: `case_a_fnol_only/`
- **Claimant**: Sarah Jenkins (Policy: `PA-2026-981245`)
- **Vehicle**: 2021 Toyota Camry (Silver)
- **Incident Narrative**: Vehicle parked in Oakridge Mall parking lot. Returned to find a scrape along the rear right bumper corner. No other parties present.
- **Expected Workflow**:
  - `intake_classifier` identifies single FNOL document.
  - `supervisor_router` skips `police_extractor`, `estimate_extractor`, `vision_agent`, and `consistency_agent`.
  - `external_verifier` verifies VIN structure.
  - `assessment_engine` marks `ADDITIONAL_INFORMATION_REQUIRED` due to partial package intake awaiting body shop estimate.

---

### Case B: FNOL + Photographs Package
- **Folder**: `case_b_fnol_photos/`
- **Claimant**: Marcus Brody (Policy: `PA-2025-412890`)
- **Vehicle**: 2020 Honda Civic (Modern Steel)
- **Incident Narrative**: Single-vehicle loss on wet road along State Route 17. Vehicle slid into highway guardrail.
- **Photographs**:
  1. `damage_photo_front.png`: Front bumper cover, grille, and right headlamp cluster displacement.
  2. `damage_photo_wheel.png`: Front right alloy wheel rim curb abrasion and tire sidewall scuff.
- **Expected Workflow**:
  - `intake_classifier` classifies 1 PDF and 2 PNGs.
  - `vision_agent` analyzes observable damage regions, severity category (`moderate`), and records photographic limitations.
  - `consistency_agent` compares driver damage statement against visible impact points.

---

### Case C: Complete Consistent Incident Package
- **Folder**: `case_c_complete_consistent/`
- **Claimant**: Robert T. Vance (Policy: `PA-2024-773120`)
- **Vehicle**: 2022 Ford F-150 XLT (Oxford White, VIN: `1FTFW1ED4NFC12098`)
- **Documents**:
  1. `incident_form.pdf`: Driver report of stopped at red light when struck from behind.
  2. `police_report.pdf`: San Jose Police Dept collision report (`SJD-2026-88190`) corroborating rear-end impact, citing third party.
  3. `repair_estimate.pdf`: Itemized certified body shop estimate ($4,850.00 gross total: bumper assembly, tailgate refinish, trailer hitch alignment).
  4. `rear_damage_photo.png`: High-resolution photograph matching bumper crumple and tailgate lip indentation.
- **Expected Workflow**:
  - Full pipeline execution across all agent nodes.
  - `external_verifier` decodes VIN via NHTSA and benchmarks repair costs against regional collision indices.
  - `assessment_engine` issues `ROUTINE_REVIEW` with low risk score (0.15).

---

### Case D: Complete Package with Contradictions
- **Folder**: `case_d_contradictory/`
- **Claimant**: Mark Henderson (Policy: `PA-2026-99301`)
- **Vehicle**: 2020 BMW 330i (Black)
- **Intentional Contradictions**:
  1. **Narrative & Liability**:
     - *FNOL*: "Swerved to avoid deer on highway; scraped wooden milepost. Single vehicle, no other cars."
     - *Police Report*: "Party 1 ran solid red light at 55 mph in 25 mph zone, broadsided Honda Civic in intersection. Party 1 cited for hit-and-run and reckless speed."
  2. **Vehicle Identity**:
     - *FNOL*: VIN `WBA5R1C58LAH88123`
     - *Police Report*: VIN `WBA5R1C58LAH99999`
  3. **Temporal & Spatial**:
     - *FNOL*: October 5 at 21:00 on Hwy 101 Northbound.
     - *Police Report*: October 6 at 02:30 at 1st St & Santa Clara Ave.
  4. **Damage Severity**:
     - *FNOL*: Minor $500 plastic scuff; drove home safely.
     - *Photo & Police*: Crushed front radiator, folded hood, deployed curtain and steering wheel airbags, non-drivable, fluid spill.
- **Expected Workflow**:
  - `consistency_agent` detects all four contradictions.
  - `assessment_engine` triggers `TRG-MAT-01` (material narrative conflict), `TRG-VIN-02` (VIN mismatch), and `TRG-SEV-03` (severity discrepancy).
  - Flags `ESCALATE_FOR_HUMAN_REVIEW` with comprehensive adjuster action protocols.

---

### Case E: Incomplete / Handwritten Sparse Package
- **Folder**: `case_e_incomplete/`
- **Claimant**: Thomas (Sparse statement)
- **Document**: `scanned_handwritten_note.pdf` — informal note stating: "I had an accident on Tuesday afternoon. A car bumped me while parallel parking on Oak Street. My bumper is dented. Call 555-0192."
- **Expected Workflow**:
  - Demonstrates robust handling of unstructured, minimal inputs.
  - Avoids hallucination: missing policy number, VIN, vehicle make/model, and officer details remain strictly null/None.
  - Flags missing required documentation (`TRG-DOC-04`) for human adjuster follow-up.

---

## 1-Click Sandbox Execution

To load any of these packages into the ClaimScope UI:
1. Open the dashboard at `http://localhost:3000`.
2. Scroll to the **Synthetic Incident Package Sandbox**.
3. Click **"Load & Investigate"** on the desired scenario card.
4. The system automatically creates a new database case, imports the verified files into the upload repository, runs content classification, and opens the 6-tab investigation workbench.
