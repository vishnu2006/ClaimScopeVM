# ClaimScope — Step-by-Step Presentation & Evaluation Guide

This guide provides a structured, presentation-ready script to demonstrate ClaimScope during evaluation reviews or capstone judging.

---

## Presentation Overview (5–7 Minute Walkthrough)

| Segment | Topic | Target Time | Key Concept Demonstrated |
|---|---|---|---|
| **1. The Problem** | US Auto Claims Challenges | 1.0 min | Document overload, manual cross-referencing, human adjuster fatigue |
| **2. Case Creation & Sandbox** | Dashboard & 1-Click Loaders | 1.0 min | Instant access to Cases A through E without manual file juggling |
| **3. Adaptive Agent Execution** | LangGraph Orchestration | 1.5 min | Dynamic routing based on package files; real-time execution stepper |
| **4. Deep Evidentiary Inspection** | Workbench & Provenance | 1.5 min | Filterable facts matrix, provenance drawer, side-by-side discrepancies |
| **5. External Grounding & Assessment** | Public APIs & Explainable Rules | 1.0 min | NHTSA VIN decode, Open-Meteo weather, and adjuster review triggers |
| **6. Official PDF Export** | Multi-Page ReportLab Output | 0.5 min | Institutional multi-page investigation report with legal disclaimers |

---

## Detailed Step-by-Step Demonstration Script

### Step 1: Open the Application & Explore the Enterprise Dashboard
1. Open your browser to **`http://localhost:3000`**.
2. **Point out**:
   - The refined enterprise design: neutral zinc/slate palette, deep professional blue (`#1e3a8a`), absence of distracting AI gradients or glassmorphism.
   - Live metrics summary at the top (active cases, priority breakdown).
   - The **Synthetic Incident Package Sandbox** prominently displayed on the dashboard.

---

### Step 2: Demonstrate "Case C" (Complete Consistent Package)
1. On the dashboard sandbox, click **"Load & Investigate"** under **Case C (Comprehensive Rear-End Collision Package)**.
2. The system creates a new case (`Robert T. Vance`, Ford F-150), imports 4 files (`incident_form.pdf`, `police_report.pdf`, `repair_estimate.pdf`, `rear_damage_photo.png`), classifies each file by content, and opens the 6-tab Investigation Workbench.
3. Observe the **Adaptive Agent Orchestration Stepper** at the top:
   - All 7 stages execute sequentially.
   - Shows green checkmarks for completed agents.
4. **Highlight the Assessment Outcome**:
   - The investigation report issues **`ROUTINE_REVIEW`** with a low risk score (0.15).
   - Zero discrepancies detected; narrative, VIN, and estimate lines mutually align.

---

### Step 3: Demonstrate "Case D" (The Staged Fraud / Multi-Contradiction Case)
1. Navigate back to the Dashboard (`/`) or click the logo.
2. In the Sandbox, click **"Load & Investigate"** under **Case D (Contradictory Narrative & VIN Mismatch)**.
3. This scenario demonstrates ClaimScope's fraud detection and discrepancy reasoning:
   - Notice that `estimate_extractor` is marked **Skipped** because no repair estimate was submitted in this package.
4. The system automatically switches to the **Discrepancies** tab upon completion:
   - Point out **`DISC-01` (Narrative Contradiction)**: Driver claims hitting a deer on the highway at 21:00 vs. Police report citing running a red light at 55 mph and broadsiding another car at 02:30.
   - Point out **`DISC-02` (Vehicle Identification)**: Mismatched VIN suffix (`88123` on FNOL vs `99999` on Police Report).
   - Point out **`DISC-03` (Damage Severity)**: Claimed $500 plastic scuff vs deployed airbags and crushed front radiator.
5. Review the **Adjuster Review Triggers**:
   - `TRG-MAT-01`: Direct liability contradiction.
   - `TRG-VIN-02`: Vehicle identification discrepancy.
   - `TRG-SEV-03`: Stated vs visible damage severity mismatch.
   - Outcome is categorized as **`ESCALATE_FOR_HUMAN_REVIEW`** with high priority.

---

### Step 4: Demonstrate Deep Evidence Inspection & Provenance
1. On the Case D workbench, click the **Extracted Facts** tab.
2. Point out the enterprise features:
   - **Search Box**: Type `"BMW"` or `"VIN"` to filter facts instantly.
   - **Category Chips**: Filter by `Vehicle`, `Incident`, `Parties`, or `Policy`.
   - **Conflicting Only Toggle**: Check the box to isolate only the conflicting data points.
3. Click the **"Inspect"** button on any row:
   - Shows the Provenance Modal displaying exact source document, page number, confidence percentage, and extraction notes.
   - Emphasize: *A human reviewer can instantly trace any AI finding back to its source.*

---

### Step 5: Demonstrate External Grounding
1. Click the **External Grounding** tab.
2. Review the live public verifications:
   - **NHTSA vPIC**: Decodes the 17-character VIN, verifying make, model, year, and assembly country.
   - **Open-Meteo**: Queries historical hourly meteorological data for the accident location and time.
   - **Collision Repair Benchmarks**: Compares claimed repair totals against US national labor and parts cost indices.
3. Note the explicit status badges: `VERIFIED`, `INCONCLUSIVE`, or `SOURCE UNAVAILABLE`.

---

### Step 6: Download the Official PDF Investigation Report
1. Click either the **"PDF Report"** button in the case header or the **"Download PDF"** button in the **Investigation Report** tab.
2. Open the downloaded PDF in your browser or PDF viewer:
   - Show the official ClaimScope institutional letterhead.
   - Show the color-coded recommendation banner and risk score.
   - Show the structured tables for discrepancies, external verifications, and triggered rules.
   - Point out the statutory **NAIC Human-in-the-Loop decision-support notice** at the bottom.

---

### Step 7: Demonstrate System Diagnostics & Benchmark Runner (CLI)
1. In a terminal, run the Gemini diagnostic check:
   ```powershell
   python backend/scripts/check_gemini.py
   ```
   - Shows clean environment detection and instructions for key configuration.
2. In the terminal, run the benchmark evaluation suite:
   ```powershell
   python backend/scripts/run_evaluation.py
   ```
   - Demonstrates 100% routing accuracy, 100% human-review agreement, and transparent marking of live model metrics awaiting credentials.
