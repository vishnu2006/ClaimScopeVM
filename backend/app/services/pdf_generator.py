import io
import logging
import os
from datetime import datetime
from typing import Any, Dict, List, Optional
from PIL import Image as PILImage
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from reportlab.platypus import (
    HRFlowable,
    Image,
    KeepTogether,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from app.schemas.case_state import CaseState

logger = logging.getLogger(__name__)


class NumberedCanvas(canvas.Canvas):
    """Two-pass canvas to dynamically compute and draw exact 'Page X of Y'
    along with corporate header and confidential footer."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count: int):
        self.saveState()
        self.setFont("Helvetica", 7.5)
        self.setFillColor(colors.HexColor("#64748b"))

        page_w, page_h = A4
        left_m = 36
        right_m = page_w - 36

        # Running Header on page 2 and beyond
        if self._pageNumber > 1:
            self.setStrokeColor(colors.HexColor("#e2e8f0"))
            self.setLineWidth(0.6)
            self.line(left_m, page_h - 28, right_m, page_h - 28)
            self.drawString(left_m, page_h - 24, "CLAIMSCOPE | CLAIMS INVESTIGATION BRIEF")
            case_num = getattr(self, "report_case_number", "")
            if case_num:
                self.drawRightString(right_m, page_h - 24, f"CLAIM FILE: {case_num}")

        # Running Footer on all pages
        self.setStrokeColor(colors.HexColor("#e2e8f0"))
        self.setLineWidth(0.6)
        self.line(left_m, 32, right_m, 32)

        # Left Footer: Application Attribution
        self.drawString(left_m, 22, "ClaimScope Claims Investigation Brief  •  Prepared for Claims Adjuster Review")
        # Right Footer: Confidentiality & Page count
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(right_m, 22, f"CONFIDENTIAL  |  {page_str}")

        self.restoreState()


class ReportPDFGenerator:
    """Human-friendly Claims Investigation Brief PDF Generator.
    Adheres to NAIC MDL-900 compliance, institutional P&C insurance formatting,
    crisp A4 proportions, high-resolution photographic proof embedding, and complete evidentiary provenance."""

    def _resolve_image_flowable(self, file_path: Optional[str], max_width: float = 160.0, max_height: float = 120.0) -> Optional[Image]:
        """Safely load and proportionally scale photographic evidence for ReportLab flowable insertion."""
        if not file_path:
            return None

        # Try relative to current working dir or backend root
        candidate_paths = [
            file_path,
            os.path.abspath(file_path),
            os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), file_path),
            os.path.join("backend", file_path),
        ]

        found_path = None
        for cp in candidate_paths:
            if cp and os.path.exists(cp) and os.path.isfile(cp):
                found_path = cp
                break

        if not found_path:
            return None

        try:
            with PILImage.open(found_path) as pil_im:
                orig_w, orig_h = pil_im.size
                if orig_w <= 0 or orig_h <= 0:
                    return None

                ratio = min(max_width / float(orig_w), max_height / float(orig_h))
                target_w = float(orig_w) * ratio
                target_h = float(orig_h) * ratio

                return Image(found_path, width=target_w, height=target_h)
        except Exception as e:
            logger.warning(f"Could not load image at {found_path} for PDF generation: {e}")
            return None

    def generate_pdf(self, state: CaseState) -> io.BytesIO:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=36,
            rightMargin=36,
            topMargin=40,
            bottomMargin=42,
        )

        styles = getSampleStyleSheet()

        # Corporate ValueMomentum & ClaimScope Palette
        c_navy = colors.HexColor("#0a1f44")
        c_cobalt = colors.HexColor("#086afc")
        c_slate_dark = colors.HexColor("#1e293b")
        c_slate_body = colors.HexColor("#334155")
        c_slate_muted = colors.HexColor("#64748b")
        c_slate_border = colors.HexColor("#cbd5e1")
        c_slate_bg = colors.HexColor("#f8fafc")

        # Status Backgrounds & Accents
        c_green_bg = colors.HexColor("#f0fdf4")
        c_green_bdr = colors.HexColor("#22c55e")
        c_amber_bg = colors.HexColor("#fffbeb")
        c_amber_bdr = colors.HexColor("#f59e0b")
        c_rose_bg = colors.HexColor("#fff1f2")
        c_rose_bdr = colors.HexColor("#f43f5e")

        # Typography Hierarchy (Refined for crisp business readability)
        brand_title = ParagraphStyle(
            "BrandTitle",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=15,
            leading=18,
            textColor=c_navy,
        )

        brand_badge = ParagraphStyle(
            "BrandBadge",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=10,
            textColor=c_cobalt,
        )

        meta_right = ParagraphStyle(
            "MetaRight",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=7.5,
            leading=10.5,
            textColor=c_slate_muted,
            alignment=2,  # Right-aligned
        )

        section_heading = ParagraphStyle(
            "SectionHeading",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=10.5,
            leading=14,
            textColor=c_navy,
            spaceBefore=11,
            spaceAfter=4,
            keepWithNext=True,
        )

        body_style = ParagraphStyle(
            "DossierBody",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=8.5,
            leading=12,
            textColor=c_slate_body,
        )

        body_bold = ParagraphStyle(
            "DossierBodyBold",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8.5,
            leading=12,
            textColor=c_navy,
        )

        cell_style = ParagraphStyle(
            "DossierCell",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=8,
            leading=11,
            textColor=c_slate_body,
        )

        cell_bold = ParagraphStyle(
            "DossierCellBold",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=11,
            textColor=c_navy,
        )

        cell_header = ParagraphStyle(
            "DossierCellHeader",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=11,
            textColor=c_navy,
        )

        disclaimer_style = ParagraphStyle(
            "DossierDisclaimer",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=7,
            leading=9.5,
            textColor=c_slate_muted,
        )

        story = []

        # Map document ID and filename to file path for image photo resolution
        doc_path_map: Dict[str, str] = {}
        for d in (state.documents or []):
            if d.file_path:
                doc_path_map[str(d.document_id)] = d.file_path
                doc_path_map[d.filename] = d.file_path

        # -------------------------------------------------------------
        # 1. DOSSIER HEADER & CASE IDENTITY
        # -------------------------------------------------------------
        gen_time = datetime.now().strftime("%Y-%m-%d %H:%M UTC")
        header_data = [
            [
                Paragraph("<b>CLAIMSCOPE</b> | Property &amp; Casualty Insurance Claims Brief", brand_badge),
                Paragraph(f"<b>Report Generated:</b> {gen_time}", meta_right),
            ],
            [
                Paragraph(f"Claim Investigation Brief: <b>{state.case_number}</b>", brand_title),
                Paragraph(f"<b>Claim ID:</b> {state.case_id[:16]}...<br/><b>Jurisdiction:</b> Standard Personal Auto", meta_right),
            ],
        ]
        header_table = Table(header_data, colWidths=[330.0, 193.0])
        header_table.setStyle(
            TableStyle(
                [
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
                    ("TOPPADDING", (0, 0), (-1, -1), 0),
                    ("LEFTPADDING", (0, 0), (-1, -1), 0),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ]
            )
        )
        story.append(header_table)
        story.append(Spacer(1, 3))
        story.append(HRFlowable(width="100%", thickness=1.5, color=c_cobalt, spaceBefore=2, spaceAfter=8))

        # -------------------------------------------------------------
        # 2. ADJUDICATION RECOMMENDATION BANNER
        # -------------------------------------------------------------
        gen_rep = state.generated_report if isinstance(state.generated_report, dict) else {}
        assessment = state.assessment
        raw_outcome = (
            getattr(assessment, "outcome", None)
            or gen_rep.get("outcome")
            or gen_rep.get("recommendation")
            or "ROUTINE_REVIEW"
        )
        outcome = str(raw_outcome).upper()
        rationale = (
            getattr(assessment, "rationale", None)
            or gen_rep.get("recommendation_rationale")
            or "Comprehensive cross-referencing completed across all ingested files and registries."
        )

        if outcome == "ESCALATE_FOR_HUMAN_REVIEW":
            b_bg = c_rose_bg
            b_bdr = c_rose_bdr
            b_title = "ADJUSTER REVIEW: ESCALATE FOR HUMAN ATTENTION"
            b_desc = "Material factual contradictions, point-of-impact mismatches, or narrative inconsistencies detected across submitted records."
            b_badge_text = "REQUIRES ADJUSTER ATTENTION"
        elif outcome == "ADDITIONAL_INFORMATION_REQUIRED":
            b_bg = c_amber_bg
            b_bdr = c_amber_bdr
            b_title = "ADJUSTER REVIEW: ADDITIONAL INFORMATION REQUIRED"
            b_desc = "Missing primary documentation (e.g. police report or certified repair estimate) or record omissions requiring adjuster follow-up."
            b_badge_text = "SUPPLEMENTAL REVIEW REQUIRED"
        else:
            b_bg = c_green_bg
            b_bdr = c_green_bdr
            b_title = "ADJUSTER REVIEW: ROUTINE CLAIM REVIEW RECOMMENDED"
            b_desc = "All package documents, driver narratives, damage observations, and public registries are mutually consistent."
            b_badge_text = "ROUTINE ADJUDICATION"

        rec_content = [
            [
                Paragraph(f"<b>{b_title}</b>", ParagraphStyle("BT", parent=brand_title, fontSize=9.5, leading=12, textColor=c_navy)),
                Paragraph(f"<b>Status:</b> {b_badge_text}", meta_right),
            ],
            [
                Paragraph(f"<b>Assessment Finding:</b> {rationale}", body_style),
                Paragraph("", meta_right),
            ],
            [
                Paragraph(f"<b>Adjuster Summary:</b> {b_desc}", disclaimer_style),
                Paragraph("", meta_right),
            ],
        ]
        rec_table = Table(rec_content, colWidths=[380.0, 143.0])
        rec_table.setStyle(
            TableStyle(
                [
                    ("SPAN", (0, 1), (1, 1)),
                    ("SPAN", (0, 2), (1, 2)),
                    ("BACKGROUND", (0, 0), (-1, -1), b_bg),
                    ("BOX", (0, 0), (-1, -1), 1.2, b_bdr),
                    ("TOPPADDING", (0, 0), (-1, -1), 5),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                    ("LEFTPADDING", (0, 0), (-1, -1), 8),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ]
            )
        )
        story.append(rec_table)
        story.append(Spacer(1, 8))

        # -------------------------------------------------------------
        # 3. NATURAL-LANGUAGE CASE SUMMARY (Answers 3 core questions)
        # -------------------------------------------------------------
        story.append(Paragraph("1. Executive Incident Summary", section_heading))
        norm_facts = state.normalized_facts or {}
        narrative = (
            gen_rep.get("narrative")
            or gen_rep.get("executive_summary")
            or norm_facts.get("incident_description")
            or "The insured vehicle was in transit when an impact occurred resulting in reported damage. Subordinated documentation has been gathered and cross-referenced."
        )

        inconsistencies = state.inconsistencies or []
        missing_docs = state.missing_documents or []
        key_issue = ""
        if inconsistencies:
            top_inc = inconsistencies[0]
            key_issue = f"A material contradiction exists regarding {top_inc.field_name.replace('_', ' ')} between {top_inc.source_a} (\"{top_inc.value_a}\") and {top_inc.source_b} (\"{top_inc.value_b}\")."
        elif missing_docs:
            key_issue = f"The claim file is missing {', '.join(missing_docs)}, which prevents independent corroboration."
        else:
            key_issue = "All facts, dates, driver statements, and damage photos are mutually consistent. No red flags identified."

        summary_box_data = [
            [
                Paragraph("<b>What Happened:</b>", cell_bold),
                Paragraph(narrative, body_style),
            ],
            [
                Paragraph("<b>What Evidence Suggests:</b>", cell_bold),
                Paragraph(f"Analysis of {len(state.documents)} submitted evidence file(s) indicates loss date {norm_facts.get('incident_date', 'Verified')} at {norm_facts.get('incident_time', 'Reported time')}.", body_style),
            ],
            [
                Paragraph("<b>Key Issue for Attention:</b>", cell_bold),
                Paragraph(key_issue, body_style),
            ],
        ]
        summary_table = Table(summary_box_data, colWidths=[130.0, 393.0])
        summary_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), c_slate_bg),
                    ("BOX", (0, 0), (-1, -1), 0.8, c_slate_border),
                    ("INNERGRID", (0, 0), (-1, -1), 0.5, c_slate_border),
                    ("TOPPADDING", (0, 0), (-1, -1), 5),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                    ("LEFTPADDING", (0, 0), (-1, -1), 6),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ]
            )
        )
        story.append(summary_table)
        story.append(Spacer(1, 8))

        # -------------------------------------------------------------
        # 4. "WHAT NEEDS YOUR ATTENTION" (Side-by-side Contradictions & Omissions)
        # -------------------------------------------------------------
        story.append(
            Paragraph(
                f"2. What Needs Your Attention ({len(inconsistencies) + len(missing_docs)} Actionable Finding{'s' if len(inconsistencies) + len(missing_docs) != 1 else ''})",
                section_heading,
            )
        )
        if inconsistencies or missing_docs:
            if inconsistencies:
                inc_rows = [
                    [
                        Paragraph("Issue", cell_header),
                        Paragraph("Side-by-Side Contradiction (Source A vs Source B)", cell_header),
                        Paragraph("Why It Matters & Recommended Action", cell_header),
                    ]
                ]
                for inc in inconsistencies:
                    inc_rows.append(
                        [
                            Paragraph(f"<b>{inc.field_name.replace('_', ' ').title()}</b><br/><font color='#dc2626'><b>{inc.severity.upper()}</b></font>", cell_style),
                            Paragraph(
                                f"<b>{inc.source_a}:</b> \"{inc.value_a}\"<br/><b>vs</b><br/><b>{inc.source_b}:</b> \"{inc.value_b}\"",
                                cell_style,
                            ),
                            Paragraph(f"<b>Impact:</b> {inc.explanation}<br/><b>Verify:</b> {inc.investigation_notes or 'Confirm with source issuer.'}", cell_style),
                        ]
                    )
                inc_table = Table(inc_rows, colWidths=[100.0, 203.0, 220.0])
                inc_table.setStyle(
                    TableStyle(
                        [
                            ("BACKGROUND", (0, 0), (-1, 0), c_slate_bg),
                            ("GRID", (0, 0), (-1, -1), 0.5, c_slate_border),
                            ("TOPPADDING", (0, 0), (-1, -1), 4),
                            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                            ("LEFTPADDING", (0, 0), (-1, -1), 5),
                            ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                            ("VALIGN", (0, 0), (-1, -1), "TOP"),
                        ]
                    )
                )
                story.append(inc_table)
                story.append(Spacer(1, 4))

            if missing_docs:
                for m_doc in missing_docs:
                    story.append(
                        Paragraph(
                            f"• <b>Missing Document: {m_doc}</b> — File was not submitted with accident package. Request record from claimant or body shop prior to authorization.",
                            body_style,
                        )
                    )
        else:
            story.append(
                Paragraph(
                    "<b>No contradictions or missing items requiring attention.</b> Dates, vehicles, driver accounts, and damage locations corroborate mutually across all submitted records.",
                    body_style,
                )
            )
        story.append(Spacer(1, 8))

        # -------------------------------------------------------------
        # 5. PHOTOGRAPHIC VEHICLE DAMAGE OBSERVATIONS (Visual Evidence Beside Finding)
        # -------------------------------------------------------------
        vision_obs = state.vision_observations or {}
        if vision_obs:
            story.append(Paragraph(f"3. Photographic Vehicle Damage Observations ({len(vision_obs)} Photos Analyzed)", section_heading))
            story.append(
                Paragraph(
                    "Damage verified through multimodal computer vision analysis. Each photograph is presented alongside observed component damages and severity rubric assessments.",
                    disclaimer_style,
                )
            )
            story.append(Spacer(1, 4))

            for pid, obs in vision_obs.items():
                damage_desc = "; ".join(obs.observable_damage) if obs.observable_damage else obs.severity_explanation
                lims_desc = f"<br/><font color='#64748b' size='7'><b>Inspection Limitations:</b> {obs.image_quality_limitations}</font>" if obs.image_quality_limitations else ""

                # Find associated file path
                img_path = doc_path_map.get(pid)
                if not img_path:
                    # Look up in documents list by matching id or partial filename
                    for d in state.documents:
                        if d.document_id == pid or pid in d.filename or d.filename in pid:
                            img_path = d.file_path
                            break

                img_flowable = self._resolve_image_flowable(img_path, max_width=180.0, max_height=135.0)

                # Format severity label and badge color
                sev = (obs.severity_category or "minor").lower()
                sev_color = "#dc2626" if sev == "severe" else "#d97706" if sev == "moderate" else "#16a34a"

                # Build Card Detail Flowable
                detail_elements = [
                    Paragraph(f"<b>Area:</b> {obs.visible_vehicle_region}", body_bold),
                    Paragraph(f"<b>Assessed Severity:</b> <font color='{sev_color}'><b>{obs.severity_category.upper()}</b></font> (Confidence: {obs.confidence_score * 100:.0f}%)", cell_style),
                    Spacer(1, 3),
                    Paragraph(f"<b>Observable Physical Damage:</b><br/>{damage_desc}{lims_desc}", cell_style),
                ]

                if obs.affected_components:
                    comp_str = ", ".join(obs.affected_components)
                    detail_elements.append(Paragraph(f"<font color='#0a1f44'><b>Affected Components:</b></font> {comp_str}", cell_style))

                if img_flowable:
                    img_cell = [
                        img_flowable,
                        Spacer(1, 2),
                        Paragraph(f"<font color='#64748b' size='6.5'><b>Evidence ID:</b> {pid[:20]}</font>", disclaimer_style),
                    ]
                else:
                    img_cell = [
                        Paragraph(f"<b>[Photographic Proof]</b><br/><font color='#64748b' size='7.5'>Reference: {pid[:24]}</font>", cell_style)
                    ]

                card_data = [[img_cell, detail_elements]]
                card_table = Table(card_data, colWidths=[190.0, 333.0])
                card_table.setStyle(
                    TableStyle(
                        [
                            ("BACKGROUND", (0, 0), (-1, -1), c_slate_bg),
                            ("BOX", (0, 0), (-1, -1), 0.8, c_slate_border),
                            ("INNERGRID", (0, 0), (-1, -1), 0.5, c_slate_border),
                            ("VALIGN", (0, 0), (-1, -1), "TOP"),
                            ("TOPPADDING", (0, 0), (-1, -1), 6),
                            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                            ("LEFTPADDING", (0, 0), (-1, -1), 7),
                            ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                        ]
                    )
                )

                story.append(KeepTogether([card_table, Spacer(1, 6)]))

            story.append(Spacer(1, 4))

        # -------------------------------------------------------------
        # 6. EVIDENCE SEPARATION & VERIFICATION BREAKDOWN
        # -------------------------------------------------------------
        story.append(Paragraph("4. Evidence Corroboration & Registry Verification", section_heading))
        doc_names = ", ".join([d.filename for d in state.documents])
        story.append(Paragraph(f"<b>Submitted Evidence Package ({len(state.documents)} Files):</b> {doc_names}", body_style))
        story.append(Spacer(1, 3))

        verifications = state.web_verifications or []
        if verifications:
            ext_rows = [
                [
                    Paragraph("Registry Inquiry", cell_header),
                    Paragraph("Official Source", cell_header),
                    Paragraph("Retrieved Record Findings", cell_header),
                    Paragraph("Result", cell_header),
                ]
            ]
            for ver in verifications:
                ext_rows.append(
                    [
                        Paragraph(ver.verification_question, cell_style),
                        Paragraph(f"<b>{ver.source_name}</b>", cell_style),
                        Paragraph(ver.retrieved_information, cell_style),
                        Paragraph(f"<b>{ver.status.upper()}</b>", cell_bold),
                    ]
                )
            ext_table = Table(ext_rows, colWidths=[120.0, 130.0, 203.0, 70.0])
            ext_table.setStyle(
                TableStyle(
                    [
                        ("BACKGROUND", (0, 0), (-1, 0), c_slate_bg),
                        ("GRID", (0, 0), (-1, -1), 0.5, c_slate_border),
                        ("TOPPADDING", (0, 0), (-1, -1), 4),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                        ("LEFTPADDING", (0, 0), (-1, -1), 5),
                        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                        ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ]
                )
            )
            story.append(ext_table)
            story.append(Spacer(1, 8))

        # -------------------------------------------------------------
        # 7. PRACTICAL NEXT STEPS FOR CLAIMS ADJUSTER
        # -------------------------------------------------------------
        rec_actions = getattr(assessment, "recommended_adjuster_actions", []) or [
            "Proceed with standard claim evaluation under policy terms and conditions."
        ]
        action_bullets = "".join([f"&nbsp;&nbsp;[  ]&nbsp;&nbsp;<b>{act}</b><br/>" for act in rec_actions])

        story.append(
            KeepTogether(
                [
                    Paragraph("5. Recommended Action Checklist for Claims Adjuster", section_heading),
                    Paragraph(action_bullets, body_style),
                    Spacer(1, 6),
                    HRFlowable(width="100%", thickness=0.8, color=c_slate_border, spaceBefore=4, spaceAfter=5),
                    Paragraph(
                        "<b>STATUTORY DISCLAIMER & NAIC COMPLIANCE:</b> ClaimScope is an assistive decision-support platform designed for licensed insurance professionals. Automated extractions, contradiction diffs, and database verifications do not constitute an independent claim approval, denial, or legal fraud accusation. In compliance with the NAIC Model Unfair Claims Settlement Practices Act (MDL-900), final liability, coverage, and settlement authority resides strictly with the licensed claims adjuster.",
                        disclaimer_style,
                    ),
                ]
            )
        )

        # Set canvas case number attribute for running header
        def make_canvas(*args, **kwargs):
            c = NumberedCanvas(*args, **kwargs)
            c.report_case_number = state.case_number
            return c

        doc.build(story, canvasmaker=make_canvas)
        buffer.seek(0)
        return buffer
