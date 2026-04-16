#!/usr/bin/env python3
"""Generate the Citizen AI Engineer CIO Plan as a one-page PDF."""

from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

output_path = "/Users/evanpaliotta/Desktop/iAltA Test/citizen ai engineer/CIO Plan - Citizen AI Engineer Program.pdf"

doc = SimpleDocTemplate(
    output_path,
    pagesize=letter,
    topMargin=0.5 * inch,
    bottomMargin=0.4 * inch,
    leftMargin=0.6 * inch,
    rightMargin=0.6 * inch,
)

styles = getSampleStyleSheet()

# Custom styles
title_style = ParagraphStyle(
    "Title2", parent=styles["Title"], fontSize=14, spaceAfter=2, spaceBefore=0
)
h2 = ParagraphStyle(
    "H2", parent=styles["Heading2"], fontSize=10, spaceAfter=2, spaceBefore=6,
    textColor=colors.HexColor("#1a1a2e")
)
body = ParagraphStyle(
    "Body2", parent=styles["Normal"], fontSize=8, leading=10, spaceAfter=3
)
small = ParagraphStyle(
    "Small", parent=styles["Normal"], fontSize=8, leading=10, spaceAfter=2
)
bold_body = ParagraphStyle(
    "BoldBody", parent=body, fontName="Helvetica-Bold"
)

elements = []

# Title
elements.append(Paragraph("Citizen AI Engineer Program: Executive Plan", title_style))
elements.append(Spacer(1, 2))

# What We're Doing
elements.append(Paragraph("What We're Doing", h2))
elements.append(Paragraph(
    "Rolling out Claude AI licenses to employees using a <b>driver's license model</b>: everyone who receives a license "
    "completes a certification course, signs an acceptable use agreement, and follows tiered processes based on the "
    "sensitivity of their work. This enables productivity gains from AI while maintaining <b>SOC2 Type II</b> and "
    "<b>ISO 27001</b> compliance.",
    body
))

# Why Enterprise Plan is Required
elements.append(Paragraph("Why Enterprise Plan is Required", h2))
elements.append(Paragraph(
    "Our current Team plan provides technical guardrails (sandbox, managed settings, MCP server lockdown) but lacks "
    "the audit and monitoring capabilities our compliance certifications require. Enterprise adds:",
    body
))

enterprise_data = [
    ["Capability", "Compliance Requirement"],
    ["Audit Logs", "SOC2 CC7.2 — Must prove who did what and when"],
    ["Compliance API (SIEM)", "SOC2 CC7.1 — Continuous monitoring required"],
    ["SCIM Provisioning", "SOC2 CC6.1/6.2 — Automated de-provisioning on offboard"],
    ["Custom Data Retention", "ISO 27001 A.8.10 — Provable data lifecycle management"],
]
t = Table(enterprise_data, colWidths=[1.8 * inch, 4.8 * inch])
t.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1a1a2e")),
    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
    ("FONTSIZE", (0, 0), (-1, -1), 8),
    ("LEADING", (0, 0), (-1, -1), 10),
    ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("TOPPADDING", (0, 0), (-1, -1), 3),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ("LEFTPADDING", (0, 0), (-1, -1), 5),
    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#f5f5f5"), colors.white]),
]))
elements.append(t)
elements.append(Spacer(1, 2))
elements.append(Paragraph(
    "<b>Without these detective controls, we can set rules but cannot prove they're being followed.</b>",
    small
))

# Driving Zones Model
elements.append(Paragraph("The Driving Zones Model", h2))
elements.append(Paragraph(
    "Usage is tiered by <b>data sensitivity</b> with no gray areas. The data determines the zone.",
    body
))

zones_data = [
    ["Zone", "Data Involved", "Process Required"],
    ["Zone 1: Private Property\n(Your driveway)",
     "Public data only.\nNo company info.",
     "None — just use Claude."],
    ["Zone 2: Residential\n(Neighborhood streets)",
     "Internal, non-confidential.\nNo PII or client data.",
     "GitHub repo + branch protection\n+ code review."],
    ["Zone 3: Highway\n(High speed, high stakes)",
     "Confidential / PII / client data,\nMCP servers, production systems.",
     "Zone 2 + Jira ticket + approved\nMCP servers + full audit logging\n+ manager review."],
    ["No-Drive Zone\n(Zero tolerance)",
     "Credentials, secrets, bypassing\nguardrails, unapproved tools.",
     "Prohibited always.\nViolation = license revocation."],
]
t2 = Table(zones_data, colWidths=[1.7 * inch, 2.4 * inch, 2.5 * inch])
t2.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1a1a2e")),
    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
    ("FONTSIZE", (0, 0), (-1, -1), 7.5),
    ("LEADING", (0, 0), (-1, -1), 9.5),
    ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("TOPPADDING", (0, 0), (-1, -1), 3),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ("LEFTPADDING", (0, 0), (-1, -1), 5),
    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#f5f5f5"), colors.white]),
    ("BACKGROUND", (0, 4), (-1, 4), colors.HexColor("#fff0f0")),
]))
elements.append(t2)
elements.append(Spacer(1, 2))
elements.append(Paragraph(
    "<b>Override rule:</b> Any MCP server connecting to a live system automatically triggers Zone 3.",
    small
))

# Technical Guardrail Stack
elements.append(Paragraph("Technical Guardrail Stack", h2))
elements.append(Paragraph(
    "All enforced centrally via IT-deployed configuration files that users cannot override: "
    "<b>managed-settings.json</b> (org-wide permission rules, sandbox enforcement) · "
    "<b>managed-mcp.json</b> (deny-by-default MCP server allowlist) · "
    "<b>Global CLAUDE.md</b> (governance rules in every session) · "
    "<b>Hooks</b> (audit logging, dangerous command blocking) · "
    "<b>GitHub-first workflow</b> (all work in version control with branch protection) · "
    "<b>Sandbox</b> (OS-level filesystem/network isolation — the true enforcement layer).",
    body
))

# Order of Operations
elements.append(Paragraph("Order of Operations", h2))
ops_data = [
    [Paragraph("<b>Phase</b>", small), Paragraph("<b>Action</b>", small)],
    [Paragraph("<b>1. Agree on the Plan</b>", small), Paragraph("CIO reviews against existing SOC2/ISO policies. Approve Driving Zones model, Enterprise upgrade, and overall approach.", small)],
    [Paragraph("<b>2. Amend the Policies</b>", small), Paragraph("Update AUP to reflect Driving Zones, data classification rules, No-Drive violations, and enforcement procedures.", small)],
    [Paragraph("<b>3. Build Technical Guardrails</b>", small), Paragraph("Deploy managed configs, upgrade to Enterprise, set up SIEM integration via Compliance API.", small)],
    [Paragraph("<b>4. Design the Course</b>", small), Paragraph("Build certification: AI basics, Driving Zones, hands-on sandbox practice per zone, and assessment.", small)],
    [Paragraph("<b>5. Pilot &amp; Rollout</b>", small), Paragraph("5-10 person pilot across roles. Iterate. Then department-by-department rollout.", small)],
]
t3 = Table(ops_data, colWidths=[1.6 * inch, 5.0 * inch])
t3.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1a1a2e")),
    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
    ("FONTNAME", (0, 1), (0, -1), "Helvetica-Bold"),
    ("FONTSIZE", (0, 0), (-1, -1), 8),
    ("LEADING", (0, 0), (-1, -1), 10),
    ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("TOPPADDING", (0, 0), (-1, -1), 2.5),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 2.5),
    ("LEFTPADDING", (0, 0), (-1, -1), 5),
    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#f5f5f5"), colors.white]),
]))
elements.append(t3)

# Ask
elements.append(Spacer(1, 3))
elements.append(Paragraph("The Ask", h2))
elements.append(Paragraph(
    "1. Approve the Driving Zones tiering model as our governance framework<br/>"
    "2. Approve upgrade from Claude Team to Claude Enterprise plan<br/>"
    "3. Review the Acceptable Use Policy draft against this framework<br/>"
    "4. Designate compliance/legal reviewers to align with SOC2/ISO control matrices",
    body
))

doc.build(elements)
print(f"PDF generated: {output_path}")
