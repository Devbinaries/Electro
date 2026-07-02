import csv
import io
from django.utils import timezone

from django.http import HttpResponse
from openpyxl import Workbook
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from elections.analytics import _election_turnout
from elections.models import Election, ElectionAuditLog
from voters.models import ElectionVoter


def _gather_report_data(election):
    voters = ElectionVoter.objects.filter(election=election)
    total_voters = voters.count()
    verified_voters = voters.filter(is_verified=True).count()
    voted_voters = voters.filter(has_voted=True).count()
    fraud_attempts = ElectionAuditLog.objects.filter(
        election=election, action="FRAUD_ATTEMPT"
    ).count()
    audit_logs = list(
        ElectionAuditLog.objects.filter(election=election)
        .select_related("voter")
        .order_by("-timestamp")[:500]
    )

    return {
        "election": {
            "title": election.title,
            "status": election.status,
            "start_date": election.start_date.isoformat() if election.start_date else "",
            "end_date": election.end_date.isoformat() if election.end_date else "",
        },
        "vote_statistics": {
            "total_voters": total_voters,
            "verified_voters": verified_voters,
            "voted_voters": voted_voters,
            "unverified_voters": total_voters - verified_voters,
            "turnout_percentage": _election_turnout(election),
        },
        "verification_statistics": {
            "verification_events": ElectionAuditLog.objects.filter(
                election=election, action="SESSION_CREATED"
            ).count(),
            "failed_verifications": fraud_attempts,
            "otp_requests": ElectionAuditLog.objects.filter(
                election=election, action="SESSION_CREATED"
            ).count(),
        },
        "integrity_summary": {
            "fraud_attempts": fraud_attempts,
            "suspicious_events": fraud_attempts,
            "total_audit_events": ElectionAuditLog.objects.filter(election=election).count(),
        },
        "audit_timeline": [
            {
                "action": log.action,
                "voter": log.voter.student_id if log.voter else "",
                "timestamp": log.timestamp.isoformat(),
                "metadata": log.metadata or {},
            }
            for log in audit_logs
        ],
        "system_events": [
            log for log in audit_logs
            if log.action in {
                "ELECTION_LOCKED",
                "ELECTION_ACTIVATED",
                "ELECTION_CLOSED",
                "FRAUD_ATTEMPT",
            }
        ],
    }


def export_audit_report_csv(election):
    data = _gather_report_data(election)
    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow(["Audit Report"])
    writer.writerow(["Election", data["election"]["title"]])
    writer.writerow(["Status", data["election"]["status"]])
    writer.writerow([])

    writer.writerow(["Vote Statistics"])
    for key, value in data["vote_statistics"].items():
        writer.writerow([key.replace("_", " ").title(), value])
    writer.writerow([])

    writer.writerow(["Verification Statistics"])
    for key, value in data["verification_statistics"].items():
        writer.writerow([key.replace("_", " ").title(), value])
    writer.writerow([])

    writer.writerow(["Integrity Summary"])
    for key, value in data["integrity_summary"].items():
        writer.writerow([key.replace("_", " ").title(), value])
    writer.writerow([])

    writer.writerow(["Audit Timeline"])
    writer.writerow(["Action", "Voter", "Timestamp"])
    for entry in data["audit_timeline"]:
        writer.writerow([entry["action"], entry["voter"], entry["timestamp"]])

    response = HttpResponse(output.getvalue(), content_type="text/csv")
    filename = f"audit_report_{election.election_id}_{timezone.now().strftime('%Y%m%d')}.csv"
    response["Content-Disposition"] = f'attachment; filename="{filename}"'
    return response


def export_audit_report_xlsx(election):
    data = _gather_report_data(election)
    wb = Workbook()
    ws = wb.active
    ws.title = "Audit Report"

    ws.append(["Election Information"])
    ws.append(["Title", data["election"]["title"]])
    ws.append(["Status", data["election"]["status"]])
    ws.append(["Start Date", data["election"]["start_date"]])
    ws.append(["End Date", data["election"]["end_date"]])
    ws.append([])

    ws.append(["Vote Statistics"])
    for key, value in data["vote_statistics"].items():
        ws.append([key.replace("_", " ").title(), value])
    ws.append([])

    ws.append(["Verification Statistics"])
    for key, value in data["verification_statistics"].items():
        ws.append([key.replace("_", " ").title(), value])
    ws.append([])

    ws.append(["Integrity Summary"])
    for key, value in data["integrity_summary"].items():
        ws.append([key.replace("_", " ").title(), value])
    ws.append([])

    ws.append(["Audit Timeline"])
    ws.append(["Action", "Voter", "Timestamp"])
    for entry in data["audit_timeline"]:
        ws.append([entry["action"], entry["voter"], entry["timestamp"]])

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)

    response = HttpResponse(
        output.getvalue(),
        content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )
    filename = f"audit_report_{election.election_id}_{timezone.now().strftime('%Y%m%d')}.xlsx"
    response["Content-Disposition"] = f'attachment; filename="{filename}"'
    return response


def export_audit_report_pdf(election):
    data = _gather_report_data(election)
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.75 * inch, bottomMargin=0.75 * inch)
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("Title", parent=styles["Heading1"], fontSize=16, spaceAfter=12)
    heading_style = ParagraphStyle("Heading", parent=styles["Heading2"], fontSize=12, spaceAfter=8)
    body_style = styles["Normal"]

    elements = [
        Paragraph("Election Audit Report", title_style),
        Paragraph(f"<b>Election:</b> {data['election']['title']}", body_style),
        Paragraph(f"<b>Status:</b> {data['election']['status']}", body_style),
        Spacer(1, 12),
        Paragraph("Vote Statistics", heading_style),
    ]

    vote_table_data = [["Metric", "Value"]]
    for key, value in data["vote_statistics"].items():
        vote_table_data.append([key.replace("_", " ").title(), str(value)])
    vote_table = Table(vote_table_data, colWidths=[3 * inch, 2 * inch])
    vote_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e40af")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f1f5f9")]),
        ])
    )
    elements.extend([vote_table, Spacer(1, 12), Paragraph("Verification Statistics", heading_style)])

    verif_table_data = [["Metric", "Value"]]
    for key, value in data["verification_statistics"].items():
        verif_table_data.append([key.replace("_", " ").title(), str(value)])
    verif_table = Table(verif_table_data, colWidths=[3 * inch, 2 * inch])
    verif_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e40af")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f1f5f9")]),
        ])
    )
    elements.extend([verif_table, Spacer(1, 12), Paragraph("Integrity Summary", heading_style)])

    integrity_table_data = [["Metric", "Value"]]
    for key, value in data["integrity_summary"].items():
        integrity_table_data.append([key.replace("_", " ").title(), str(value)])
    integrity_table = Table(integrity_table_data, colWidths=[3 * inch, 2 * inch])
    integrity_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e40af")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f1f5f9")]),
        ])
    )
    elements.extend([integrity_table, Spacer(1, 12), Paragraph("Audit Timeline (Recent)", heading_style)])

    timeline_data = [["Action", "Voter", "Timestamp"]]
    for entry in data["audit_timeline"][:50]:
        timeline_data.append([entry["action"], entry["voter"], entry["timestamp"][:19]])
    timeline_table = Table(timeline_data, colWidths=[2 * inch, 1.5 * inch, 2 * inch])
    timeline_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e40af")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f1f5f9")]),
        ])
    )
    elements.append(timeline_table)

    doc.build(elements)
    buffer.seek(0)

    response = HttpResponse(buffer.getvalue(), content_type="application/pdf")
    filename = f"audit_report_{election.election_id}_{timezone.now().strftime('%Y%m%d')}.pdf"
    response["Content-Disposition"] = f'attachment; filename="{filename}"'
    return response
