"""
PDF Report Generator for GlowAI skin analysis results.
Uses ReportLab to produce a structured, branded PDF.
"""
import io
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT

BRAND_COLOR = colors.HexColor("#c0392b")  # GlowAI red
LIGHT_GRAY = colors.HexColor("#f5f5f5")
DARK_GRAY = colors.HexColor("#333333")


def _build_styles():
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(
        name="BrandTitle",
        fontSize=24,
        textColor=BRAND_COLOR,
        alignment=TA_CENTER,
        spaceAfter=4,
        fontName="Helvetica-Bold",
    ))
    styles.add(ParagraphStyle(
        name="SubTitle",
        fontSize=12,
        textColor=DARK_GRAY,
        alignment=TA_CENTER,
        spaceAfter=2,
    ))
    styles.add(ParagraphStyle(
        name="SectionHeader",
        fontSize=13,
        textColor=BRAND_COLOR,
        fontName="Helvetica-Bold",
        spaceBefore=12,
        spaceAfter=6,
    ))
    styles.add(ParagraphStyle(
        name="BodyText2",
        fontSize=10,
        textColor=DARK_GRAY,
        spaceAfter=4,
    ))
    return styles


def generate_report(analysis: dict, user: dict) -> bytes:
    """
    Generate a PDF report for a completed skin analysis.

    Args:
        analysis: Analysis document from MongoDB
        user: User document from MongoDB

    Returns:
        PDF as bytes
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=2 * cm,
        leftMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
    )

    styles = _build_styles()
    story = []

    # --- Header ---
    story.append(Paragraph("✨ GlowAI", styles["BrandTitle"]))
    story.append(Paragraph("AI Powered Skin Analysis Report", styles["SubTitle"]))
    story.append(HRFlowable(width="100%", thickness=2, color=BRAND_COLOR, spaceAfter=12))

    # --- User & Date Info ---
    first_name = user.get("first_name", "")
    last_name = user.get("last_name", "")
    full_name = f"{first_name} {last_name}".strip() or "User"
    analysis_date = analysis.get("created_at")
    if isinstance(analysis_date, datetime):
        date_str = analysis_date.strftime("%B %d, %Y")
    else:
        date_str = str(analysis_date)[:10] if analysis_date else "N/A"

    info_data = [
        ["Name:", full_name],
        ["Analysis Date:", date_str],
        ["Report Generated:", datetime.utcnow().strftime("%B %d, %Y")],
    ]
    info_table = Table(info_data, colWidths=[4 * cm, 12 * cm])
    info_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("TEXTCOLOR", (0, 0), (-1, -1), DARK_GRAY),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 0.5 * cm))

    # --- Skin Type Section ---
    story.append(Paragraph("Skin Type Analysis", styles["SectionHeader"]))
    skin_type = analysis.get("skin_type", "N/A").capitalize()
    confidence = analysis.get("skin_type_confidence", 0)
    low_flag = analysis.get("low_confidence_flag", False)
    confidence_pct = f"{confidence * 100:.1f}%"
    flag_note = " ⚠ Low confidence result" if low_flag else ""

    skin_data = [
        ["Detected Skin Type:", f"{skin_type}"],
        ["Confidence Score:", f"{confidence_pct}{flag_note}"],
    ]
    skin_table = Table(skin_data, colWidths=[5 * cm, 11 * cm])
    skin_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), LIGHT_GRAY),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("TEXTCOLOR", (0, 0), (-1, -1), DARK_GRAY),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.lightgrey),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(skin_table)
    story.append(Spacer(1, 0.3 * cm))

    # --- Conditions Section ---
    story.append(Paragraph("Detected Skin Conditions", styles["SectionHeader"]))
    conditions = analysis.get("conditions", [])
    if conditions:
        cond_data = [["Condition", "Confidence", "Region"]]
        for cond in conditions:
            name = cond.get("name", "").replace("_", " ").title()
            conf = f"{cond.get('confidence', 0) * 100:.1f}%"
            region = cond.get("bbox", {}).get("region", "N/A").replace("_", " ").title()
            cond_data.append([name, conf, region])
        cond_table = Table(cond_data, colWidths=[6 * cm, 4 * cm, 6 * cm])
        cond_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), BRAND_COLOR),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 10),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT_GRAY]),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.lightgrey),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
        ]))
        story.append(cond_table)
    else:
        story.append(Paragraph("✅ No significant skin conditions detected.", styles["BodyText2"]))
    story.append(Spacer(1, 0.3 * cm))

    # --- Recommendations Section ---
    story.append(Paragraph("Product Recommendations", styles["SectionHeader"]))
    recommendations = analysis.get("recommendations", [])
    if recommendations:
        rec_data = [["Rank", "Product ID", "Compatibility Score"]]
        for rec in recommendations[:10]:
            rank = rec.get("rank", "—")
            product_id = str(rec.get("product_id", "N/A"))[:24]
            score = f"{rec.get('compatibility_score', 0) * 100:.1f}%"
            rec_data.append([str(rank), product_id, score])
        rec_table = Table(rec_data, colWidths=[2 * cm, 10 * cm, 4 * cm])
        rec_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), BRAND_COLOR),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT_GRAY]),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.lightgrey),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
        ]))
        story.append(rec_table)
    else:
        story.append(Paragraph("No product recommendations available for this analysis.", styles["BodyText2"]))

    # --- Footer ---
    story.append(Spacer(1, 1 * cm))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.lightgrey))
    story.append(Paragraph(
        "This report is generated by GlowAI for informational purposes only. "
        "It is not a substitute for professional dermatological advice.",
        ParagraphStyle("Footer", fontSize=8, textColor=colors.grey, alignment=TA_CENTER)
    ))

    doc.build(story)
    return buffer.getvalue()
