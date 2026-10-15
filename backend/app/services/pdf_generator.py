import io
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
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


class ReportPDFGenerator:
    """Generates professional, enterprise-grade Auto Accident Investigation Reports
    in PDF format using ReportLab.
    
    Structure:
    1. Header with Case Number, Date, Status, Official Wordmark
    2. Executive Incident Summary
    3. ClaimScope Assessment & Triggered Review Rules (with color-coded recommendation banner)
    4. Incident Package Document Inventory
    5. Extracted Facts Matrix with Source Provenance
    6. Photographic Damage Analysis with Severity Rubric
    7. Cross-Document Discrepancy Analysis
    8. External Public Verification (NHTSA, Historical Weather, Market Benchmarks)
    9. Investigation Scope Limitations & Uncertainties
    10. Recommended Adjuster Actions
    11. Human-in-the-Loop Decision Support Notice"""

    def generate_pdf(self, state: CaseState) -> io.BytesIO:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36,
        )

        styles = getSampleStyleSheet()
        
        # Custom Typography & Palette
        navy_dark = colors.HexColor("#0f172a")
        brand_blue = colors.HexColor("#1d4ed8")
        slate_700 = colors.HexColor("#334155")
        slate_500 = colors.HexColor("#64748b")
        slate_200 = colors.HexColor("#e2e8f0")
        slate_50 = colors.HexColor("#f8fafc")
        
        # Assessment Colors
        emerald_bg = colors.HexColor("#ecfdf5")
        emerald_border = colors.HexColor("#10b981")
        amber_bg = colors.HexColor("#fffbeb")
        amber_border = colors.HexColor("#f59e0b")
        rose_bg = colors.HexColor("#fff1f2")
        rose_border = colors.HexColor("#f43f5e")

        title_style = ParagraphStyle(
            "DocTitle",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=16,
            leading=20,
            textColor=navy_dark,
        )

        subtitle_style = ParagraphStyle(
            "DocSubtitle",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=9,
            leading=12,
            textColor=brand_blue,
        )

        meta_style = ParagraphStyle(
            "MetaText",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=8,
            leading=11,
            textColor=slate_500,
        )

        section_heading = ParagraphStyle(
            "SectionHeading",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=11,
            leading=14,
            textColor=navy_dark,
            spaceBefore=10,
            spaceAfter=4,
        )

        body_style = ParagraphStyle(
            "ReportBody",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=8.5,
            leading=12,
            textColor=slate_700,
        )

        bold_body = ParagraphStyle(
            "BoldBody",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8.5,
            leading=12,
            textColor=navy_dark,
        )

        cell_style = ParagraphStyle(
            "CellText",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=8,
            leading=10,
            textColor=slate_700,
        )

        cell_header = ParagraphStyle(
            "CellHeader",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=10,
            textColor=navy_dark,
        )

        disclaimer_style = ParagraphStyle(
            "DisclaimerText",
            parent=styles["Normal"],
            fontName="Helvetica-Oblique",
            fontSize=7.5,
            leading=10,
            textColor=slate_500,
        )

        story = []

        # ---------------------------------------------------------
        # 1. HEADER & CASE METADATA
        # ---------------------------------------------------------
        header_table = Table(
            [
                [
                    Paragraph("<b>CLAIMSCOPE</b> | Auto Accident Investigation Assessment", subtitle_style),
                    Paragraph(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M UTC')}", meta_style),
                ],
                [
                    Paragraph(f"Case Assessment File: {state.case_number}", title_style),
                    Paragraph(f"Case ID: {state.case_id[:12]}...", meta_style),
                ],
            ],
            colWidths=[4.2 * inch, 3.0 * inch],
        )
        header_table.setStyle(
            TableStyle(
                [
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("ALIGN", (1, 0), (1, -1), "RIGHT"),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
                ]
            )
        )
        story.append(header_table)
        story.append(Spacer(1, 4))
        story.append(HRFlowable(width="100%", thickness=1.5, color=brand_blue, spaceBefore=2, spaceAfter=8))

        # ---------------------------------------------------------
        # 2. ASSESSMENT & RECOMMENDATION BANNER
        # ---------------------------------------------------------
        assessment = state.assessment
        outcome = getattr(assessment, "outcome", "ROUTINE_REVIEW") if assessment else "ROUTINE_REVIEW"
        rationale = getattr(assessment, "rationale", "Evidence reviewed.") if assessment else "Preliminary processing."
        
        if outcome == "ESCALATE_FOR_HUMAN_REVIEW":
            banner_bg = rose_bg
            banner_border = rose_border
            banner_title = "RECOMMENDATION: ESCALATE FOR HUMAN ADJUSTER REVIEW"
            banner_sub = "Material inconsistencies, vehicle identity contradictions, or severe exposure detected."
        elif outcome == "ADDITIONAL_INFORMATION_REQUIRED":
            banner_bg = amber_bg
            banner_border = amber_border
            banner_title = "RECOMMENDATION: ADDITIONAL DOCUMENTATION REQUIRED"
            banner_sub = "Missing official records (police report, estimate) or minor discrepancies requiring follow-up."
        else:
            banner_bg = emerald_bg
            banner_border = emerald_border
            banner_title = "RECOMMENDATION: ROUTINE REVIEW"
            banner_sub = "All submitted incident records are mutually consistent. Standard claim processing recommended."

        rec_table = Table(
            [
                [
                    Paragraph(f"<b>{banner_title}</b>", ParagraphStyle("RecT", parent=bold_body, fontSize=9.5, textColor=navy_dark)),
                ],
                [
                    Paragraph(f"<b>Rationale:</b> {rationale}", body_style),
                ],
                [
                    Paragraph(f"<b>Key Guidance:</b> {banner_sub}", meta_style),
                ],
            ],
            colWidths=[7.2 * inch],
        )
        rec_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), banner_bg),
                    ("BOX", (0, 0), (-1, -1), 1.5, banner_border),
                    ("TOPPADDING", (0, 0), (-1, -1), 6),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                    ("LEFTPADDING", (0, 0), (-1, -1), 10),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ]
            )
        )
        story.append(rec_table)
        story.append(Spacer(1, 8))

        # ---------------------------------------------------------
        # 3. TRIGGERED REVIEW RULES (If any)
        # ---------------------------------------------------------
        rules = getattr(assessment, "triggered_rules", []) if assessment else []
        if rules:
            story.append(Paragraph("Triggered Review Triggers & Explainable Rules", section_heading))
            rule_rows = [
                [
                    Paragraph("Rule ID", cell_header),
                    Paragraph("Trigger Description", cell_header),
                    Paragraph("Severity", cell_header),
                    Paragraph("Recommended Action", cell_header),
                ]
            ]
            for r in rules:
                rule_rows.append(
                    [
                        Paragraph(f"<b>{getattr(r, 'rule_id', 'TRG')}</b>", cell_style),
                        Paragraph(getattr(r, "description", ""), cell_style),
                        Paragraph(getattr(r, "severity", "medium").upper(), cell_style),
                        Paragraph(getattr(r, "recommended_action", ""), cell_style),
                    ]
                )
            rule_table = Table(rule_rows, colWidths=[1.1 * inch, 2.7 * inch, 0.9 * inch, 2.5 * inch])
            rule_table.setStyle(
                TableStyle(
                    [
                        ("BACKGROUND", (0, 0), (-1, 0), slate_200),
                        ("GRID", (0, 0), (-1, -1), 0.5, slate_200),
                        ("TOPPADDING", (0, 0), (-1, -1), 3),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                        ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ]
                )
            )
            story.append(rule_table)
            story.append(Spacer(1, 8))

        # ---------------------------------------------------------
        # 4. DOCUMENT INTAKE INVENTORY
        # ---------------------------------------------------------
        story.append(Paragraph("Incident Package Document Inventory", section_heading))
        doc_rows = [
            [
                Paragraph("Filename", cell_header),
                Paragraph("Classification", cell_header),
                Paragraph("Extraction Status", cell_header),
                Paragraph("Size", cell_header),
            ]
        ]
        for d in state.documents:
            size_kb = f"{d.file_size_bytes / 1024:.1f} KB" if d.file_size_bytes else "N/A"
            doc_rows.append(
                [
                    Paragraph(d.filename, cell_style),
                    Paragraph(d.document_type.replace("_", " ").title(), cell_style),
                    Paragraph(d.status.upper(), cell_style),
                    Paragraph(size_kb, cell_style),
                ]
            )
        doc_table = Table(doc_rows, colWidths=[2.8 * inch, 1.8 * inch, 1.5 * inch, 1.1 * inch])
        doc_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), slate_200),
                    ("GRID", (0, 0), (-1, -1), 0.5, slate_200),
                    ("TOPPADDING", (0, 0), (-1, -1), 3),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                ]
            )
        )
        story.append(doc_table)
        story.append(Spacer(1, 8))

        # ---------------------------------------------------------
        # 5. CROSS-DOCUMENT DISCREPANCY ANALYSIS
        # ---------------------------------------------------------
        story.append(Paragraph(f"Cross-Document Inconsistency Checks ({len(state.inconsistencies)} Detected)", section_heading))
        if state.inconsistencies:
            inc_rows = [
                [
                    Paragraph("Category", cell_header),
                    Paragraph("Source A vs Source B", cell_header),
                    Paragraph("Discrepancy Details", cell_header),
                    Paragraph("Severity", cell_header),
                ]
            ]
            for inc in state.inconsistencies:
                inc_rows.append(
                    [
                        Paragraph(inc.category.replace("_", " ").title(), cell_style),
                        Paragraph(f"<b>{inc.source_a}:</b> {inc.value_a}<br/><b>vs</b><br/><b>{inc.source_b}:</b> {inc.value_b}", cell_style),
                        Paragraph(inc.explanation, cell_style),
                        Paragraph(f"<b>{inc.severity.upper()}</b>", cell_style),
                    ]
                )
            inc_table = Table(inc_rows, colWidths=[1.3 * inch, 2.5 * inch, 2.5 * inch, 0.9 * inch])
            inc_table.setStyle(
                TableStyle(
                    [
                        ("BACKGROUND", (0, 0), (-1, 0), slate_200),
                        ("GRID", (0, 0), (-1, -1), 0.5, slate_200),
                        ("TOPPADDING", (0, 0), (-1, -1), 4),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                        ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ]
                )
            )
            story.append(inc_table)
        else:
            story.append(Paragraph("No contradictions or cross-document discrepancies detected. Reported narratives, dates, VINs, and impact points match across all submitted files.", body_style))
        story.append(Spacer(1, 8))

        # ---------------------------------------------------------
        # 6. PHOTOGRAPHIC DAMAGE ANALYSIS
        # ---------------------------------------------------------
        if state.vision_observations:
            story.append(Paragraph("Photographic Damage Vision Analysis", section_heading))
            photo_rows = [
                [
                    Paragraph("Photo ID", cell_header),
                    Paragraph("Visible Region", cell_header),
                    Paragraph("Severity Rating", cell_header),
                    Paragraph("Observable Physical Damage", cell_header),
                ]
            ]
            for photo_id, p in state.vision_observations.items():
                photo_rows.append(
                    [
                        Paragraph(photo_id[:12], cell_style),
                        Paragraph(p.visible_vehicle_region, cell_style),
                        Paragraph(f"<b>{p.severity_category.replace('_', ' ').upper()}</b>", cell_style),
                        Paragraph("; ".join(p.observable_damage) if p.observable_damage else p.severity_explanation, cell_style),
                    ]
                )
            photo_table = Table(photo_rows, colWidths=[1.2 * inch, 1.8 * inch, 1.4 * inch, 2.8 * inch])
            photo_table.setStyle(
                TableStyle(
                    [
                        ("BACKGROUND", (0, 0), (-1, 0), slate_200),
                        ("GRID", (0, 0), (-1, -1), 0.5, slate_200),
                        ("TOPPADDING", (0, 0), (-1, -1), 3),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                    ]
                )
            )
            story.append(photo_table)
            story.append(Spacer(1, 8))

        # ---------------------------------------------------------
        # 7. EXTERNAL PUBLIC VERIFICATION (NHTSA, Weather, Benchmarks)
        # ---------------------------------------------------------
        if state.web_verifications:
            story.append(Paragraph("External Database & Public Source Verifications", section_heading))
            ext_rows = [
                [
                    Paragraph("Verification Query", cell_header),
                    Paragraph("Source Authority & URL", cell_header),
                    Paragraph("Retrieved Information", cell_header),
                    Paragraph("Status", cell_header),
                ]
            ]
            for ver in state.web_verifications:
                ext_rows.append(
                    [
                        Paragraph(ver.verification_question, cell_style),
                        Paragraph(f"<b>{ver.source_name}</b><br/><font size='6.5' color='#1d4ed8'>{ver.source_url or ''}</font>", cell_style),
                        Paragraph(ver.retrieved_information, cell_style),
                        Paragraph(ver.status.upper(), cell_style),
                    ]
                )
            ext_table = Table(ext_rows, colWidths=[1.8 * inch, 2.0 * inch, 2.5 * inch, 0.9 * inch])
            ext_table.setStyle(
                TableStyle(
                    [
                        ("BACKGROUND", (0, 0), (-1, 0), slate_200),
                        ("GRID", (0, 0), (-1, -1), 0.5, slate_200),
                        ("TOPPADDING", (0, 0), (-1, -1), 3),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                        ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ]
                )
            )
            story.append(ext_table)
            story.append(Spacer(1, 8))

        # ---------------------------------------------------------
        # 8. RECOMMENDED ACTIONS & SCOPE LIMITATIONS
        # ---------------------------------------------------------
        story.append(KeepTogether([
            Paragraph("Recommended Next Actions for Adjuster", section_heading),
            Paragraph(
                "<br/>".join([f"• {a}" for a in (getattr(assessment, "recommended_adjuster_actions", []) or ["Proceed with routine claim settlement."])]),
                body_style,
            ),
            Spacer(1, 6),
            Paragraph("Investigation Limitations & Scope Caveats", section_heading),
            Paragraph(
                "<br/>".join([f"• {lim}" for lim in (state.investigation_limitations or [
                    "Photographs alone cannot determine vehicle structural frame alignment, internal suspension damage, or total loss status without physical shop teardown.",
                    "Online repair price indices are contextual benchmarks, not definitive insurance appraisals."
                ])]),
                meta_style,
            ),
            Spacer(1, 10),
            HRFlowable(width="100%", thickness=0.5, color=slate_200, spaceBefore=4, spaceAfter=6),
            Paragraph(
                "<b>REGULATORY NOTICE & HUMAN-IN-THE-LOOP DISCLAIMER:</b> ClaimScope is an assistive decision-support platform designed for licensed insurance adjusters. Automated extractions, cross-document checks, and benchmark verifications do not constitute an independent claim approval, denial, or legal fraud determination. Final liability and coverage determination remains the sole responsibility of the authorized claims adjuster.",
                disclaimer_style,
            ),
        ]))

        doc.build(story)
        buffer.seek(0)
        return buffer
