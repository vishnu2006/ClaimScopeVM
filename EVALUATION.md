# ClaimScope — Benchmark Evaluation & Quantitative Methodology

## 1. Evaluation Methodology

ClaimScope includes a lightweight, reproducible evaluation framework (`backend/app/evaluation/`) designed to evaluate performance across all stages of the multi-agent claims investigation pipeline.

The evaluation framework evaluates two distinct operational tiers:
1. **Deterministic Benchmark Tier (Offline-Validated)**: Evaluates agent supervisor routing decisions, consistency detection heuristics, hybrid rule assessment triggers, report schema completeness, and evidence traceability against independently labelled ground-truth data.
2. **Live Multimodal Model Tier (Awaiting Gemini Credentials)**: Evaluates live Gemini structured field extraction precision/recall, vision damage classification accuracy, and end-to-end model latency.

---

## 2. Ground-Truth Dataset

The benchmark dataset is defined in [`backend/app/evaluation/ground_truth.json`](file:///c:/Users/vishn/Downloads/ClaimScopeVM/backend/app/evaluation/ground_truth.json) and comprises five verified synthetic incident packages:

| Case | Package Folder | Total Files | Key Testing Characteristic | Target Assessment Outcome |
|---|---|---|---|---|
| **Case A** | `case_a_fnol_only` | 1 PDF | Partial Intake: Only FNOL submitted; tests adaptive skipping of absent extractors | `ADDITIONAL_INFORMATION_REQUIRED` |
| **Case B** | `case_b_fnol_photos` | 1 PDF, 2 PNGs | Multimodal Ingestion: FNOL paired with damage photos; tests visual damage analysis | `ADDITIONAL_INFORMATION_REQUIRED` |
| **Case C** | `case_c_complete_consistent` | 3 PDFs, 1 PNG | Full Consistent Package: FNOL, police report, itemized estimate, and rear photos | `ROUTINE_REVIEW` |
| **Case D** | `case_d_contradictory` | 2 PDFs, 1 PNG | Multi-Point Contradiction: Narrative conflict, VIN suffix mismatch, severity discrepancy | `ESCALATE_FOR_HUMAN_REVIEW` |
| **Case E** | `case_e_incomplete` | 1 PDF | Sparse Incomplete: Handwritten scanned notice missing policy, VIN, and details | `ADDITIONAL_INFORMATION_REQUIRED` |

---

## 3. Quantitative Metric Formulations

### A. Agent Routing Accuracy
Measures whether the LangGraph supervisor conditionally executes only necessary extractors and gracefully skips absent document types:
$$\text{Execution Accuracy} = \frac{|\text{Executed}_{\text{actual}} \cap \text{Executed}_{\text{expected}}|}{|\text{Executed}_{\text{expected}}|}$$
$$\text{Skip Accuracy} = \frac{|\text{Skipped}_{\text{actual}} \cap \text{Skipped}_{\text{expected}}|}{|\text{Skipped}_{\text{expected}}|}$$

### B. Inconsistency Detection Metrics
Measures precision and recall of cross-document discrepancies detected against ground-truth contradictions:
$$\text{Precision} = \frac{\text{True Positives}}{\text{True Positives} + \text{False Positives}}$$
$$\text{Recall} = \frac{\text{True Positives}}{\text{True Positives} + \text{False Negatives}}$$
$$F_1 = \frac{2 \cdot \text{Precision} \cdot \text{Recall}}{\text{Precision} + \text{Recall}}$$

### C. Human-Review Tier Agreement
Evaluates whether the automated recommendation matches the expected adjuster triage outcome (`ROUTINE_REVIEW`, `ADDITIONAL_INFORMATION_REQUIRED`, or `ESCALATE_FOR_HUMAN_REVIEW`):
$$\text{Agreement Rate} = \frac{\sum_{i=1}^N \mathbb{I}(\text{Outcome}_{\text{actual}}^{(i)} = \text{Outcome}_{\text{expected}}^{(i)})}{N}$$

### D. Evidence Traceability & Provenance Score
Calculates the proportion of extracted facts with verified source citations:
$$\text{Traceability Score} = \frac{\text{Count of Facts with Non-Null } \texttt{source\_document}}{\text{Total Extracted Facts}}$$

### E. Report Schema Completeness
Validates that all 11 required institutional investigation report sections are populated without omissions.

---

## 4. Current Baseline Results

### Offline Deterministic Benchmark Results (Validated)
Executed via `python backend/scripts/run_evaluation.py`:

```
======================================================================
       CLAIMSCOPE -- COMPREHENSIVE BENCHMARK EVALUATION SUITE
======================================================================

[1] Benchmark Dataset: 5 Verified Ground-Truth Scenarios Loaded
    * [CASE_A] Case A - FNOL-Only Partial Package (1 files)
    * [CASE_B] Case B - FNOL + Photographs Package (3 files)
    * [CASE_C] Case C - Complete Consistent Incident Package (4 files)
    * [CASE_D] Case D - Complete Package with Contradictions (3 files)
    * [CASE_E] Case E - Incomplete / Handwritten Sparse Package (1 files)

[2] Evaluating Adaptive LangGraph Agent Routing...
    [PASS] Mean Execution Accuracy: 100.0%
    [PASS] Mean Skip Accuracy:      100.0%

[3] Evaluating Claim Assessment Engine & Review Triggers...
    [PASS] Human-Review Tier Agreement: 100.0%
      [PASS] CASE_A: Predicted 'ADDITIONAL_INFORMATION_REQUIRED' | Rules: []
      [PASS] CASE_B: Predicted 'ADDITIONAL_INFORMATION_REQUIRED' | Rules: ['TRG-DOC-04A', 'TRG-DOC-04B']
      [PASS] CASE_C: Predicted 'ROUTINE_REVIEW' | Rules: []
      [PASS] CASE_D: Predicted 'ESCALATE_FOR_HUMAN_REVIEW' | Rules: ['TRG-MAT-01', 'TRG-VIN-02', 'TRG-SEV-03', 'TRG-DOC-04B']
      [PASS] CASE_E: Predicted 'ADDITIONAL_INFORMATION_REQUIRED' | Rules: ['TRG-DOC-04A', 'TRG-DOC-04B']

[4] Evaluating ReportLab PDF Engine & 11-Section Schema...
    [PASS] Valid Multi-Page PDF Stream: True (3707 bytes)
    [PASS] Report Schema Completeness:  100.0% (11/11 sections)

[5] Evaluating Evidence Traceability & Provenance...
    [PASS] Provenance Traceability Score: 100.0%
    [PASS] Confidence Coverage:           100.0%

======================================================================
  LIVE AI MODEL EVALUATION (Gemini 2.5 Flash)
======================================================================
  STATUS: [NOT EVALUATED — AWAITING GEMINI_API_KEY]
  Rationale: GEMINI_API_KEY is not configured in backend/.env.
  Notice:    Per Part 4 specifications, live model metrics remain explicitly
             NOT EVALUATED until real credentials are supplied.
======================================================================
```

---

## 5. How to Run Live Evaluation After Providing Gemini Credentials

1. Open `backend/.env` and paste your Gemini API key:
   ```bash
   GEMINI_API_KEY="AIzaSy...your_gemini_key"
   ```
2. Confirm API connectivity:
   ```powershell
   python backend/scripts/check_gemini.py
   ```
3. Run the automated benchmark suite:
   ```powershell
   python backend/scripts/run_evaluation.py
   ```
4. The runner will execute real multimodal calls, compute field-level extraction precision and recall against ground truth, and display token counts and end-to-end latency.
