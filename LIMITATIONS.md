# ClaimScope — Responsible AI Guardrails & Technical Limitations

## 1. Responsible AI & Regulatory Guardrails

ClaimScope is strictly engineered as a **decision-support copilot** for licensed human insurance claims adjusters. It does **not** make autonomous adjudication decisions, coverage determinations, settlement authorizations, or legal accusations of insurance fraud.

### Core Ethical & Statutory Principles

1. **Human-in-the-Loop Adjudication**:
   - In accordance with the **NAIC Model Unfair Claims Settlement Practices Act (MDL-900)** and state insurance regulations, all investigative findings, discrepancy flags, and recommendations require evaluation and validation by a licensed adjuster.
   - The system categorizes recommendations into triage tiers (`ROUTINE_REVIEW`, `ADDITIONAL_INFORMATION_REQUIRED`, `ESCALATE_FOR_HUMAN_REVIEW`) to help prioritize adjuster attention; it never unilaterally approves or denies a claim.

2. **Fair Credit Reporting Act (FCRA) & Non-Discrimination**:
   - ClaimScope does not ingest or factor in demographic attributes, credit scores, socioeconomic metrics, or personal identifying traits into risk scoring or review triggers.
   - All evaluation rules (`TRG-MAT-01` to `TRG-STR-08`) evaluate exclusively factual and physical discrepancies between submitted incident records.

3. **Strict Non-Hallucination Policy**:
   - The platform strictly enforces schema-level nullability (`Optional[T] = None`). If a field (e.g., VIN, officer name, or damage total) is not explicitly present in the document, it remains unpopulated. The system never invents or approximates missing data.

---

## 2. Technical & Physical Damage Limitations

### A. 2D Photographic Vision Limitations
- **Concealed Structural Damage**: Single-angle 2D photographs capture only visible exterior cosmetic damage. Photographic analysis cannot determine:
  - Unibody frame rail squareness or structural alignment.
  - Internal suspension, steering knuckle, or tie-rod integrity.
  - Concealed engine cradle, radiator core, or transmission case cracks.
- **Driveability Determination**: While visible wheel misalignment or fluid spills suggest non-driveability, photographs alone cannot definitively certify mechanical roadworthiness. Physical rack teardowns by an I-CAR certified technician are explicitly recommended whenever structural compromise is suspected (`TRG-STR-08`).
- **Lighting & Resolution**: Image quality, glare, low light, rain droplets on camera lenses, and perspective distortion can obscure minor paint scratches or hairline bumper cracks.

### B. Document Extraction & OCR Boundaries
- **Severely Degraded Scans**: While Gemini multimodal vision handles clear and moderately legible handwriting, documents with severe physical tearing, extreme bleed-through, water damage, or resolution below 150 DPI may produce inconclusive extractions.
- **Non-Standard Freeform Formats**: Non-standard narrative memos lacking structural headers are parsed into generalized narrative fields rather than normalized table structures.

### C. External Verification & Public APIs
- **Public API Availability**: External verification relies on public endpoints (NHTSA vPIC and Open-Meteo). While these services are free and open, network outages or rate limiting can occur. ClaimScope handles these gracefully with `status="source_unavailable"` rather than failing the investigation.
- **Contextual Benchmarks vs. Binding Appraisals**: Repair cost benchmarks derived from regional CCC ONE / Mitchell collision averages represent market orientation ranges, not binding collision repair estimates. Actual repair costs depend on localized shop labor rates, OEM vs. aftermarket parts availability, and teardown discoveries.

### D. Model API & Quota Constraints
- **Gemini Free-Tier Rate Limits**: Operating under Gemini API free-tier quotas requires managing Requests Per Minute (RPM) and Tokens Per Minute (TPM). ClaimScope implements exponential backoff retries and consolidates prompt payloads to maintain operational stability.
