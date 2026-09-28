# backend/services/factura_pdf.py
import os
from io import BytesIO
from datetime import datetime
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)


def _fmt_cop(v) -> str:
    try:
        return "$" + f"{float(v):,.0f}".replace(",", ".")
    except Exception:
        return "$0"


def generar_pdf_factura(factura, detalles) -> bytes:
    """
    Recibe un objeto Factura y su lista de FacturaDetalle.
    Devuelve los bytes del PDF.
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=LETTER,
        topMargin=1.5 * cm,
        bottomMargin=1.5 * cm,
        leftMargin=1.8 * cm,
        rightMargin=1.8 * cm,
        title=f"Factura {factura.num_factura}",
        author=os.getenv("EMPRESA_NOMBRE", "Petfy"),
    )

    styles = getSampleStyleSheet()
    h1 = ParagraphStyle("h1", parent=styles["Heading1"], fontSize=18,
                        textColor=colors.HexColor("#E0633F"), spaceAfter=4)
    h2 = ParagraphStyle("h2", parent=styles["Heading2"], fontSize=12,
                        textColor=colors.HexColor("#064F56"), spaceAfter=6)
    normal = ParagraphStyle("normal", parent=styles["Normal"], fontSize=9, leading=12)
    small = ParagraphStyle("small", parent=styles["Normal"], fontSize=8,
                           textColor=colors.grey)

    empresa_nombre = os.getenv("EMPRESA_NOMBRE", "Petfy S.A.S.")
    empresa_nit = os.getenv("EMPRESA_NIT", "900.000.000-0")
    empresa_dir = os.getenv("EMPRESA_DIRECCION", "Bogotá, Colombia")
    empresa_tel = os.getenv("EMPRESA_TELEFONO", "+57 300 000 0000")
    empresa_mail = os.getenv("EMPRESA_EMAIL", "facturacion@petfy.com.co")

    story = []

    # Header
    story.append(Paragraph(f"🐾 {empresa_nombre}", h1))
    story.append(Paragraph(
        f"NIT: {empresa_nit} &nbsp;|&nbsp; {empresa_dir}<br/>"
        f"Tel: {empresa_tel} &nbsp;|&nbsp; {empresa_mail}", small))
    story.append(Spacer(1, 0.4 * cm))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#E0633F")))
    story.append(Spacer(1, 0.4 * cm))

    story.append(Paragraph(f"Factura de Venta N° {factura.num_factura}", h2))

    # Datos emisión y cliente
    fecha_em = factura.fecha_emision.strftime("%d/%m/%Y %H:%M") if factura.fecha_emision else "-"
    fecha_ven = factura.fecha_vencimiento.strftime("%d/%m/%Y") if factura.fecha_vencimiento else "-"

    info_izq = [
        ["<b>Fecha de emisión:</b>", fecha_em],
        ["<b>Fecha de vencimiento:</b>", fecha_ven],
        ["<b>Moneda:</b>", factura.moneda or "COP"],
        ["<b>Forma de pago:</b>", factura.plan_pago or "-"],
    ]
    info_der = [
        ["<b>Cliente:</b>", factura.nombre_cliente or "-"],
        ["<b>Documento:</b>", factura.documento_cliente or "-"],
        ["<b>Correo:</b>", factura.correo_cliente or "-"],
        ["<b>Dirección:</b>", factura.direccion_cliente or "-"],
    ]

    tabla_info = Table(
        [[Table([[Paragraph(a, normal), Paragraph(b, normal)] for a, b in info_izq],
                colWidths=[4.0 * cm, 4.5 * cm], style=[("VALIGN", (0, 0), (-1, -1), "TOP")]),
          Table([[Paragraph(a, normal), Paragraph(b, normal)] for a, b in info_der],
                colWidths=[2.8 * cm, 5.2 * cm], style=[("VALIGN", (0, 0), (-1, -1), "TOP")])]],
        colWidths=[8.6 * cm, 8.6 * cm],
        style=[("VALIGN", (0, 0), (-1, -1), "TOP")],
    )
    story.append(tabla_info)
    story.append(Spacer(1, 0.6 * cm))

    # Tabla de detalles
    data = [["Concepto", "Cant.", "Vr. Unitario", "IVA", "Total"]]
    for d in detalles:
        data.append([
            Paragraph(d.concepto, normal),
            str(d.cantidad),
            _fmt_cop(d.precio_uni),
            _fmt_cop(d.iva),
            _fmt_cop(d.total_linea),
        ])

    tabla = Table(data, colWidths=[8.5 * cm, 1.3 * cm, 2.6 * cm, 2.2 * cm, 2.6 * cm])
    tabla.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#064F56")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("ALIGN", (1, 1), (-1, -1), "RIGHT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#CCCCCC")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#FFF8F5")]),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(tabla)

    # Totales
    story.append(Spacer(1, 0.4 * cm))
    totales = Table(
        [
            ["Subtotal", _fmt_cop(factura.sub_total)],
            ["IVA", _fmt_cop(factura.iva)],
            ["TOTAL", _fmt_cop(factura.total)],
        ],
        colWidths=[3.5 * cm, 3.5 * cm],
        style=[
            ("ALIGN", (0, 0), (-1, -1), "RIGHT"),
            ("FONTSIZE", (0, 0), (-1, -1), 10),
            ("FONTNAME", (0, 2), (-1, 2), "Helvetica-Bold"),
            ("TEXTCOLOR", (0, 2), (-1, 2), colors.HexColor("#E0633F")),
            ("LINEABOVE", (0, 2), (-1, 2), 1, colors.HexColor("#E0633F")),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ],
    )
    wrapper = Table([[ "", totales ]], colWidths=[12.0 * cm, 7.0 * cm])
    story.append(wrapper)

    # Observaciones y CUFE
    story.append(Spacer(1, 0.6 * cm))
    if factura.observaciones:
        story.append(Paragraph(f"<b>Observaciones:</b> {factura.observaciones}", small))
    if factura.cufe:
        story.append(Spacer(1, 0.2 * cm))
        story.append(Paragraph(f"<b>CUFE:</b> {factura.cufe}", small))

    story.append(Spacer(1, 0.8 * cm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.grey))
    story.append(Spacer(1, 0.2 * cm))
    story.append(Paragraph(
        "Documento generado electrónicamente por Petfy. "
        "Esta factura es un documento equivalente para efectos internos.",
        small))

    doc.build(story)
    return buffer.getvalue()