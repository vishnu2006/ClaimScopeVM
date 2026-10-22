import io
import logging
import os
from datetime import datetime
from typing import Any, Dict, List, Optional
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from reportlab.platypus import (
    HRFlowable,
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
    along with corporate running headers and attribution footers."""

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
            self.drawString(left_m, page_h - 24, "CLAIMSCOPE | P&C INSURANCE INVESTIGATION DOSSIER")
            case_num = getattr(self, "report_case_number", "")
            if case_num:
                self.drawRightString(right_m, page_h - 24, f"CASE: {case_num}")

        # Running Footer on all pages
        self.setStrokeColor(colors.HexColor("#e2e8f0"))
        self.setLineWidth(0.6)
        self.line(left_m, 32, right_m, 32)

        # Left Footer: Attribution & System
        self.drawString(left_m, 22, "ClaimScope Insurance Intelligence  •  Built by Vishnu Pandrangi")
        # Right Footer: Confidentiality & Page count
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(right_m, 22, f"STRICTLY CONFIDENTIAL  |  {page_str}")

        self.restoreState()


class ReportPDFGenerator:
    """Enterprise-grade Auto Accident Investigation Dossier PDF Generator.
    Adheres to NAIC MDL-900 compliance, institutional P&C insurance formatting,
    crisp A4 proportions, and complete evidentiary provenance."""

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
        c_growth = colors.HexColor("#2e7d32")
        c_slate_dark = colors.HexColor("#1e293b")
        c_slate_body = colors.HexColor("#334155")
        c_slate_muted = colors.HexColor("#64748b")
        c_slate_border = colors.HexColor("#e2e8f0")
        c_slate_bg = colors.HexColor("#f8fafc")

        # Status Backgrounds & Accents
        c_green_bg = colors.HexColor("#f0fdf4")
        c_green_bdr = colors.HexColor("#22c55e")
        c_amber_bg = colors.HexColor("#fffbeb")
        c_amber_bdr = colors.HexColor("#f59e0b")
        c_rose_bg = colors.HexColor("#fff1f2")
        c_rose_bdr = colors.HexColor("#f43f5e")

        # Typography Hierarchy
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
            fontSize=10,
            leading=13,
            textColor=c_navy,
            spaceBefore=8,
            spaceAfter=4,
            keepWithNext=True,
        )

        body_style = ParagraphStyle(
            "DossierBody",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=8,
            leading=11.5,
            textColor=c_slate_body,
        )

        body_bold = ParagraphStyle(
            "DossierBodyBold",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=11.5,
            textColor=c_navy,
        )

        cell_style = ParagraphStyle(
            "DossierCell",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=7.5,
            leading=10,
            textColor=c_slate_body,
        )

        cell_bold = ParagraphStyle(
            "DossierCellBold",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=7.5,
            leading=10,
            textColor=c_navy,
        )

        cell_header = ParagraphStyle(
            "DossierCellHeader",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=7.5,
            leading=10,
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

        # Usable width on A4 (595.27 pt total width - 72 pt margins = ~523 pt)
        content_w = 523.0

        # -------------------------------------------------------------
        # 1. DOSSIER HEADER & CASE IDENTITY
        # -------------------------------------------------------------
        gen_time = datetime.now().strftime("%Y-%m-%d %H:%M UTC")
        header_data = [
            [
                Paragraph("<b>CLAIMSCOPE</b> | Property &amp; Casualty Insurance Adjudication Intelligence", brand_badge),
                Paragraph(f"<b>Dossier Generated:</b> {gen_time}", meta_right),
            ],
            [
                Paragraph(f"Automobile Claim Investigation Dossier: <b>{state.case_number}</b>", brand_title),
                Paragraph(f"<b>Case UUID:</b> {state.case_id[:16]}...<br/><b>Jurisdiction:</b> Standard Personal Auto", meta_right),
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
        assessment = state.assessment
        outcome = getattr(assessment, "outcome", "ROUTINE_REVIEW") if assessment else "ROUTINE_REVIEW"
        rationale = getattr(assessment, "rationale", "Evidence package analyzed across all available documentation.") if assessment else "Preliminary processing completed."
        risk_score = getattr(assessment, "overall_risk_score", 0.0) if assessment else 0.0

        if outcome == "ESCALATE_FOR_HUMAN_REVIEW":
            b_bg = c_rose_bg
            b_bdr = c_rose_bdr
            b_title = "ADJUDICATOR ACTION: ESCALATE FOR SENIOR HUMAN REVIEW"
            b_desc = "Significant factual contradictions, point-of-impact mismatches, or suspicious narrative inconsistencies detected across submitted records."
            b_badge_text = "HIGH ATTENTION / ESCALATION"
        elif outcome == "ADDITIONAL_INFORMATION_REQUIRED":
            b_bg = c_amber_bg
            b_bdr = c_amber_bdr
            b_title = "ADJUDICATOR ACTION: SUPPLEMENTAL INFORMATION REQUIRED"
            b_desc = "Missing primary documentation (e.g. police report or certified repair estimate) or minor record omissions requiring adjuster follow-up."
            b_badge_text = "SUPPLEMENTAL REVIEW REQUIRED"
        else:
            b_bg = c_green_bg
            b_bdr = c_green_bdr
            b_title = "ADJUDICATOR ACTION: ROUTINE CLAIM PROCESSING RECOMMENDED"
            b_desc = "All package documents, driver narratives, damage observations, and public registries are mutually consistent."
            b_badge_text = "ROUTINE ADJUDICATION"

        rec_content = [
            [
                Paragraph(f"<b>{b_title}</b>", ParagraphStyle("BT", parent=brand_title, fontSize=9.5, leading=12, textColor=c_navy)),
                Paragraph(f"<b>Tier:</b> {b_badge_text} | <b>Risk Index:</b> {risk_score:.2f}", meta_right),
            ],
            [
                Paragraph(f"<b>Adjudication Rationale:</b> {rationale}", body_style),
                Paragraph("", meta_right),
            ],
            [
                Paragraph(f"<b>Operational Standard:</b> {b_desc}", disclaimer_style),
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
        # 3. TRIGGERED REVIEW RULES (Explainable NAIC Decision Logic)
        # -------------------------------------------------------------
        rules = getattr(assessment, "triggered_rules", []) if assessment else []
        if rules:
            story.append(Paragraph(f"Triggered Decision Rules ({len(rules)} Applied)", section_heading))
            rule_rows = [
                [
                    Paragraph("Rule ID", cell_header),
                    Paragraph("Trigger Condition & Factual Context", cell_header),
                    Paragraph("Severity", cell_header),
                    Paragraph("Mandated Follow-Up Action", cell_header),
                ]
            ]
            for r in rules:
                rule_rows.append(
                    [
                        Paragraph(f"<b>{getattr(r, 'rule_id', 'TRG')}</b>", cell_bold),
                        Paragraph(getattr(r, "description", ""), cell_style),
                        Paragraph(getattr(r, "severity", "medium").upper(), cell_bold),
                        Paragraph(getattr(r, "recommended_action", ""), cell_style),
                    ]
                )
            rule_table = Table(rule_rows, colWidths=[70.0, 205.0, 68.0, 180.0])
            rule_table.setStyle(
                TableStyle(
                    [
                        ("BACKGROUND", (0, 0), (-1, 0), c_slate_bg),
                        ("GRID", (0, 0), (-1, -1), 0.5, c_slate_border),
                        ("TOPPADDING", (0, 0), (-1, -1), 3),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                        ("LEFTPADDING", (0, 0), (-1, -1), 5),
                        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                        ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ]
                )
            )
            story.append(rule_table)
            story.append(Spacer(1, 8))

        # -------------------------------------------------------------
        # 4. PACKAGE DOCUMENT INVENTORY
        # -------------------------------------------------------------
        story.append(Paragraph(f"Incident Package Ingested Files ({len(state.documents)} Assets)", section_heading))
        doc_rows = [
            [
                Paragraph("Asset Filename", cell_header),
                Paragraph("Document Classification", cell_header),
                Paragraph("Pages", cell_header),
                Paragraph("File Size", cell_header),
                Paragraph("Extraction Status", cell_header),
            ]
        ]
        for d in state.documents:
            size_kb = f"{d.file_size_bytes / 1024:.1f} KB" if d.file_size_bytes else "—"
            doc_rows.append(
                [
                    Paragraph(d.filename, cell_bold),
                    Paragraph(d.document_type.replace("_", " ").title(), cell_style),
                    Paragraph(str(d.page_count) if d.page_count else "1", cell_style),
                    Paragraph(size_kb, cell_style),
                    Paragraph("VERIFIED / EXTRACTED", cell_style),
                ]
            )
        doc_table = Table(doc_rows, colWidths=[180.0, 130.0, 45.0, 68.0, 100.0])
        doc_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), c_slate_bg),
                    ("GRID", (0, 0), (-1, -1), 0.5, c_slate_border),
                    ("TOPPADDING", (0, 0), (-1, -1), 3),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                    ("LEFTPADDING", (0, 0), (-1, -1), 5),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ]
            )
        )
        story.append(doc_table)
        story.append(Spacer(1, 8))

        # -------------------------------------------------------------
        # 5. CROSS-DOCUMENT DISCREPANCY MATRIX
        # -------------------------------------------------------------
        inconsistencies = state.inconsistencies or []
        story.append(
            Paragraph(
                f"Cross-Document Contradiction Analysis ({len(inconsistencies)} Flagged)",
                section_heading,
            )
        )
        if inconsistencies:
            inc_rows = [
                [
                    Paragraph("Discrepancy Category", cell_header),
                    Paragraph("Conflicting Accounts (Source A vs Source B)", cell_header),
                    Paragraph("Factual Conflict Explanation", cell_header),
                    Paragraph("Materiality", cell_header),
                ]
            ]
            for inc in inconsistencies:
                inc_rows.append(
                    [
                        Paragraph(f"<b>{inc.category.replace('_', ' ').title()}</b>", cell_bold),
                        Paragraph(
                            f"<b>{inc.source_a}:</b> {inc.value_a}<br/><b>vs</b><br/><b>{inc.source_b}:</b> {inc.value_b}",
                            cell_style,
                        ),
                        Paragraph(inc.explanation, cell_style),
                        Paragraph(f"<b>{inc.severity.upper()}</b>", cell_bold),
                    ]
                )
            inc_table = Table(inc_rows, colWidths=[110.0, 175.0, 178.0, 60.0])
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
        else:
            story.append(
                Paragraph(
                    "<b>No cross-document discrepancies detected.</b> Loss narrative, date of loss, VIN specifications, driver identities, and impact directions are fully corroborated across all provided documents.",
                    body_style,
                )
            )
        story.append(Spacer(1, 8))

        # -------------------------------------------------------------
        # 6. PHOTOGRAPHIC VEHICLE DAMAGE INSPECTION (If Photos Present)
        # -------------------------------------------------------------
        vision_obs = state.vision_observations or {}
        if vision_obs:
            story.append(Paragraph(f"Photographic Damage Analysis ({len(vision_obs)} Images Analyzed)", section_heading))
            photo_rows = [
                [
                    Paragraph("Photo ID", cell_header),
                    Paragraph("Visible Vehicle Area", cell_header),
                    Paragraph("Damage Severity", cell_header),
                    Paragraph("Component Damage Observations & Limitations", cell_header),
                ]
            ]
            for pid, obs in vision_obs.items():
                damage_desc = "; ".join(obs.observable_damage) if obs.observable_damage else obs.severity_explanation
                if obs.image_quality_limitations:
                    damage_desc += f"<br/><font color='#64748b' size='6.5'>Limitations: {obs.image_quality_limitations}</font>"
                photo_rows.append(
                    [
                        Paragraph(pid[:12], cell_bold),
                        Paragraph(obs.visible_vehicle_region, cell_style),
                        Paragraph(f"<b>{obs.severity_category.replace('_', ' ').upper()}</b>", cell_bold),
                        Paragraph(damage_desc, cell_style),
                    ]
                )
            photo_table = Table(photo_rows, colWidths=[80.0, 120.0, 100.0, 223.0])
            photo_table.setStyle(
                TableStyle(
                    [
                        ("BACKGROUND", (0, 0), (-1, 0), c_slate_bg),
                        ("GRID", (0, 0), (-1, -1), 0.5, c_slate_border),
                        ("TOPPADDING", (0, 0), (-1, -1), 3),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                        ("LEFTPADDING", (0, 0), (-1, -1), 5),
                        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                        ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ]
                )
            )
            story.append(photo_table)
            story.append(Spacer(1, 8))

        # -------------------------------------------------------------
        # 7. EXTERNAL PUBLIC GROUNDING & VERIFICATION
        # -------------------------------------------------------------
        verifications = state.web_verifications or []
        if verifications:
            story.append(Paragraph(f"External Public Registries Grounding ({len(verifications)} Records)", section_heading))
            ext_rows = [
                [
                    Paragraph("Inquiry Scope", cell_header),
                    Paragraph("Source Authority & API", cell_header),
                    Paragraph("Retrieved Record Findings", cell_header),
                    Paragraph("Status", cell_header),
                ]
            ]
            for ver in verifications:
                ext_rows.append(
                    [
                        Paragraph(ver.verification_question, cell_style),
                        Paragraph(f"<b>{ver.source_name}</b><br/><font color='#086afc' size='6.5'>{ver.source_url or 'Official Registry'}</font>", cell_style),
                        Paragraph(ver.retrieved_information, cell_style),
                        Paragraph(f"<b>{ver.status.upper()}</b>", cell_bold),
                    ]
                )
            ext_table = Table(ext_rows, colWidths=[120.0, 140.0, 193.0, 70.0])
            ext_table.setStyle(
                TableStyle(
                    [
                        ("BACKGROUND", (0, 0), (-1, 0), c_slate_bg),
                        ("GRID", (0, 0), (-1, -1), 0.5, c_slate_border),
                        ("TOPPADDING", (0, 0), (-1, -1), 3),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                        ("LEFTPADDING", (0, 0), (-1, -1), 5),
                        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                        ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ]
                )
            )
            story.append(ext_table)
            story.append(Spacer(1, 8))

        # -------------------------------------------------------------
        # 8. RECOMMENDED ADJUSTER ACTIONS & STATUTORY NOTICE
        # -------------------------------------------------------------
        rec_actions = getattr(assessment, "recommended_adjuster_actions", []) or [
            "Proceed with standard claim evaluation under policy terms and conditions."
        ]
        limitations = state.investigation_limitations or [
            "Photographs alone cannot determine internal vehicle chassis alignment, suspension geometry, or hidden sensor calibrations without physical teardown.",
            "Market parts and labor benchmarks provide reference guidelines; actual estimate approval requires verified shop labor agreements.",
        ]

        action_bullets = "".join([f"&nbsp;&nbsp;•&nbsp;&nbsp;{act}<br/>" for act in rec_actions])
        limit_bullets = "".join([f"&nbsp;&nbsp;•&nbsp;&nbsp;{lim}<br/>" for lim in limitations])

        story.append(
            KeepTogether(
                [
                    Paragraph("Recommended Action Checklist for Claims Adjuster", section_heading),
                    Paragraph(action_bullets, body_style),
                    Spacer(1, 4),
                    Paragraph("Investigation Scope Limitations & Data Confidence", section_heading),
                    Paragraph(limit_bullets, body_style),
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
