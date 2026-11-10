# backend/services/factura_pdf.py
import os
import reportlab
from io import BytesIO
from functools import lru_cache
from datetime import datetime

from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, Image
)

# ═════════════════════════════════════════════════════════════
# FUENTES UNICODE — usa las fuentes Vera que ya trae ReportLab
# (soportan ó, á, é, í, ú, ñ, ü → arregla el mojibake)
# ═════════════════════════════════════════════════════════════
_FONT_REG, _FONT_BOLD, _FONT_MONO = "Helvetica", "Helvetica-Bold", "Courier"

def _registrar_fuentes():
    global _FONT_REG, _FONT_BOLD, _FONT_MONO
    rl_fonts = os.path.join(os.path.dirname(reportlab.__file__), "fonts")
    mapa = [
        ("PetfySans",      "Vera.ttf",   "_FONT_REG"),
        ("PetfySans-Bold", "VeraBd.ttf", "_FONT_BOLD"),
        ("PetfySans-It",   "VeraIt.ttf", None),
    ]
    for name, fname, target in mapa:
        path = os.path.join(rl_fonts, fname)
        if not os.path.exists(path):
            print(f"[PDF][WARN] No existe {path}")
            continue
        try:
            pdfmetrics.registerFont(TTFont(name, path))
            if target == "_FONT_REG":  _FONT_REG  = name
            if target == "_FONT_BOLD": _FONT_BOLD = name
            print(f"[PDF] Fuente OK: {name} <- {fname}")
        except Exception as e:
            print(f"[PDF][WARN] {name}: {e}")

    # Registrar familia (para <b> dentro de Paragraph)
    try:
        pdfmetrics.registerFontFamily(
            "PetfySans",
            normal=_FONT_REG,
            bold=_FONT_BOLD,
            italic=_FONT_REG,
            boldItalic=_FONT_BOLD,
        )
    except Exception:
        pass

_registrar_fuentes()

FONT_REG, FONT_BOLD, FONT_MONO = _FONT_REG, _FONT_BOLD, _FONT_MONO


# ═════════════════════════════════════════════════════════════
# LOGO — lee local del backend, fallback a URL remota
# ═════════════════════════════════════════════════════════════
ASSETS_URL = os.getenv("FRONTEND_URL", "https://petfy.com.co")
LOGO_URL = f"{ASSETS_URL}/assets/img/Logo-Petfy-renovado.png"

_LOCAL_LOGO_PATHS = [
    os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                 "assets", "img", "Logo-Petfy-renovado.png"),
    "/home/petfycom/backend/assets/img/Logo-Petfy-renovado.png",
]


@lru_cache(maxsize=1)
def _obtener_logo_bytes():
    # 1. Intenta local
    for p in _LOCAL_LOGO_PATHS:
        if os.path.exists(p):
            print(f"[PDF] Logo local: {p}")
            with open(p, "rb") as f:
                return f.read()
    # 2. Fallback remoto
    try:
        import requests
        r = requests.get(LOGO_URL, timeout=8)
        r.raise_for_status()
        print(f"[PDF] Logo remoto: {LOGO_URL}")
        return r.content
    except Exception as e:
        print(f"[PDF][WARN] No se pudo obtener logo: {e}")
        return None


@lru_cache(maxsize=1)
def _logo_ratio():
    """Relación ancho/alto real del logo. Default 1.0 si falla."""
    b = _obtener_logo_bytes()
    if not b:
        return 1.0
    try:
        from PIL import Image as PILImage
        w, h = PILImage.open(BytesIO(b)).size
        return w / float(h or 1)
    except Exception:
        # Sin PIL: intentamos leer header PNG manualmente
        try:
            import struct
            if b[:8] == b"\x89PNG\r\n\x1a\n":
                w, h = struct.unpack(">II", b[16:24])
                return w / float(h or 1)
        except Exception:
            pass
        return 1.0


# ═════════════════════════════════════════════════════════════
# PALETA
# ═════════════════════════════════════════════════════════════
PETFY_TEAL       = colors.HexColor("#064F56")
PETFY_ORANGE     = colors.HexColor("#E0633F")
PETFY_BEIGE      = colors.HexColor("#f4ebe2")
PETFY_BEIGE_SOFT = colors.HexColor("#fff8f5")
PETFY_GRAY_DARK  = colors.HexColor("#1f1b24")
PETFY_GRAY_MID   = colors.HexColor("#4b5563")
PETFY_GRAY_LIGHT = colors.HexColor("#9ca3af")


def _fmt_cop(v):
    try:
        return "$" + f"{float(v):,.0f}".replace(",", ".")
    except Exception:
        return "$0"


def _crear_logo(alto_cm=1.8, max_ancho_cm=5.0):
    b = _obtener_logo_bytes()
    if not b:
        return Paragraph(
            f'<font color="#064F56" size="22"><b>Petfy</b></font>',
            getSampleStyleSheet()["Normal"],
        )
    ratio = _logo_ratio()
    ancho = alto_cm * ratio
    alto = alto_cm
    if ancho > max_ancho_cm:
        ancho = max_ancho_cm
        alto = ancho / ratio
    return Image(BytesIO(b), width=ancho * cm, height=alto * cm)


def _tabla_logo_y_empresa(nombre, nit, direccion, telefono, email):
    logo = _crear_logo(alto_cm=1.8, max_ancho_cm=5.0)

    s_nombre = ParagraphStyle("nombre_marca", fontName=FONT_BOLD,
                              fontSize=22, textColor=PETFY_TEAL, leading=24)
    s_datos = ParagraphStyle("datos_empresa", fontName=FONT_REG,
                             fontSize=8, textColor=PETFY_GRAY_MID,
                             leading=11, alignment=2)

    izq = Table(
        [[logo, Paragraph(nombre, s_nombre)]],
        colWidths=[3.0 * cm, 5.0 * cm],
        style=[("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
               ("LEFTPADDING", (0, 0), (-1, -1), 0),
               ("RIGHTPADDING", (0, 0), (-1, -1), 6)],
    )
    der = Paragraph(
        f"<b>NIT:</b> {nit}<br/>{direccion}<br/>"
        f"Tel: {telefono}<br/>{email}",
        s_datos,
    )
    return Table(
        [[izq, der]],
        colWidths=[9.5 * cm, 7.7 * cm],
        style=[("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
               ("LEFTPADDING", (0, 0), (-1, -1), 0),
               ("RIGHTPADDING", (0, 0), (-1, -1), 0)],
    )


def generar_pdf_factura(factura, detalles):
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=LETTER,
        topMargin=1.3 * cm, bottomMargin=1.3 * cm,
        leftMargin=1.6 * cm, rightMargin=1.6 * cm,
        title=f"Factura {factura.num_factura}",
        author=os.getenv("EMPRESA_NOMBRE", "Petfy"),
    )

    s_titulo  = ParagraphStyle("titulo", fontName=FONT_BOLD, fontSize=16,
                               textColor=PETFY_TEAL, leading=20)
    s_numero  = ParagraphStyle("numero", fontName=FONT_BOLD, fontSize=13,
                               textColor=PETFY_ORANGE, leading=16)
    s_seccion = ParagraphStyle("seccion", fontName=FONT_BOLD, fontSize=9,
                               textColor=PETFY_TEAL, leading=12, spaceAfter=4)
    s_normal  = ParagraphStyle("normal", fontName=FONT_REG, fontSize=9,
                               leading=12, textColor=PETFY_GRAY_DARK)
    s_label   = ParagraphStyle("label", fontName=FONT_BOLD, fontSize=8,
                               leading=11, textColor=PETFY_GRAY_MID)
    s_valor   = ParagraphStyle("valor", fontName=FONT_REG, fontSize=9,
                               leading=11, textColor=PETFY_GRAY_DARK)
    s_small   = ParagraphStyle("small", fontName=FONT_REG, fontSize=7.5,
                               leading=10, textColor=PETFY_GRAY_LIGHT)

    emp_nombre = os.getenv("EMPRESA_NOMBRE", "Petfy")
    emp_nit    = os.getenv("EMPRESA_NIT", "900.123.456-7")
    emp_dir    = os.getenv("EMPRESA_DIRECCION", "Calle 63, Bogotá")
    emp_tel    = os.getenv("EMPRESA_TELEFONO", "+57 319 541 2160")
    emp_mail   = os.getenv("EMPRESA_EMAIL", "facturacion@petfy.com.co")

    story = []
    story.append(_tabla_logo_y_empresa(emp_nombre, emp_nit, emp_dir, emp_tel, emp_mail))
    story.append(Spacer(1, 0.25 * cm))
    story.append(HRFlowable(width="100%", thickness=2.5, color=PETFY_TEAL,
                            spaceBefore=2, spaceAfter=0))
    story.append(HRFlowable(width="100%", thickness=1, color=PETFY_ORANGE,
                            spaceBefore=0, spaceAfter=0))
    story.append(Spacer(1, 0.5 * cm))

    story.append(Table(
        [[Paragraph("FACTURA DE VENTA", s_titulo),
          Paragraph(f"N. {factura.num_factura}", s_numero)]],
        colWidths=[10 * cm, 7.2 * cm],
        style=[("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
               ("ALIGN", (1, 0), (1, 0), "RIGHT"),
               ("LEFTPADDING", (0, 0), (-1, -1), 0),
               ("RIGHTPADDING", (0, 0), (-1, -1), 0)],
    ))
    story.append(Spacer(1, 0.6 * cm))

    fecha_em  = factura.fecha_emision.strftime("%d/%m/%Y %H:%M") if factura.fecha_emision else "-"
    fecha_ven = factura.fecha_vencimiento.strftime("%d/%m/%Y") if factura.fecha_vencimiento else "-"

    def fila(l, v):
        return [Paragraph(l, s_label), Paragraph(str(v or "-"), s_valor)]

    izq = Table([
        fila("Fecha de emisión", fecha_em),
        fila("Fecha de vencimiento", fecha_ven),
        fila("Moneda", factura.moneda or "COP"),
        fila("Forma de pago", factura.plan_pago or "-"),
    ], colWidths=[4.0 * cm, 4.4 * cm])
    der = Table([
        fila("Cliente", factura.nombre_cliente or "-"),
        fila("Documento", factura.documento_cliente or "-"),
        fila("Correo", factura.correo_cliente or "-"),
        fila("Dirección", factura.direccion_cliente or "-"),
    ], colWidths=[3.2 * cm, 5.0 * cm])
    for t in (izq, der):
        t.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (-1, -1), 4),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ]))
    story.append(Table([[izq, der]], colWidths=[8.6 * cm, 8.6 * cm], style=[
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BACKGROUND", (0, 0), (-1, -1), PETFY_BEIGE_SOFT),
        ("BOX", (0, 0), (-1, -1), 0.5, PETFY_BEIGE),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
    ]))
    story.append(Spacer(1, 0.7 * cm))

    story.append(Paragraph("DETALLE DE SERVICIOS", s_seccion))
    story.append(Spacer(1, 0.15 * cm))

    filas = [["Concepto", "Cant.", "Vr. Unitario", "IVA", "Total"]]
    for d in detalles:
        filas.append([
            Paragraph(d.concepto or "-", s_normal),
            str(d.cantidad),
            _fmt_cop(d.precio_uni),
            _fmt_cop(d.iva),
            _fmt_cop(d.total_linea),
        ])
    tabla = Table(filas, colWidths=[8.0 * cm, 1.4 * cm, 2.7 * cm, 2.2 * cm, 2.9 * cm])
    tabla.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), PETFY_TEAL),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), FONT_BOLD),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("ALIGN", (1, 0), (-1, 0), "CENTER"),
        ("TOPPADDING", (0, 0), (-1, 0), 8),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
        ("FONTSIZE", (0, 1), (-1, -1), 9),
        ("ALIGN", (1, 1), (1, -1), "CENTER"),
        ("ALIGN", (2, 1), (-1, -1), "RIGHT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("GRID", (0, 0), (-1, -1), 0.4, PETFY_BEIGE),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, PETFY_BEIGE_SOFT]),
        ("TOPPADDING", (0, 1), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 8),
        ("LEFTPADDING", (0, 1), (0, -1), 8),
        ("RIGHTPADDING", (-1, 1), (-1, -1), 8),
    ]))
    story.append(tabla)
    story.append(Spacer(1, 0.5 * cm))

    totales = Table([
        ["Subtotal", _fmt_cop(factura.sub_total)],
        ["IVA", _fmt_cop(factura.iva)],
        ["TOTAL", _fmt_cop(factura.total)],
    ], colWidths=[3.5 * cm, 3.5 * cm], style=[
        ("ALIGN", (0, 0), (-1, -1), "RIGHT"),
        ("FONTSIZE", (0, 0), (-1, 1), 9),
        ("TEXTCOLOR", (0, 0), (-1, 1), PETFY_GRAY_MID),
        ("FONTNAME", (0, 2), (-1, 2), FONT_BOLD),
        ("FONTSIZE", (0, 2), (-1, 2), 12),
        ("TEXTCOLOR", (0, 2), (-1, 2), PETFY_ORANGE),
        ("LINEABOVE", (0, 2), (-1, 2), 1.2, PETFY_ORANGE),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
    ])
    story.append(Table([["", totales]], colWidths=[10.5 * cm, 6.7 * cm],
                       style=[("VALIGN", (0, 0), (-1, -1), "TOP")]))
    story.append(Spacer(1, 0.7 * cm))

    if factura.observaciones:
        story.append(Paragraph("OBSERVACIONES", s_seccion))
        story.append(Paragraph(factura.observaciones, s_normal))
        story.append(Spacer(1, 0.4 * cm))

    if factura.cufe:
        story.append(Paragraph(
            f'<b>Código de verificación:</b> '
            f'<font color="#E0633F" face="{FONT_MONO}">{factura.cufe[:20].upper()}</font>',
            s_small,
        ))
        story.append(Spacer(1, 0.3 * cm))

    story.append(Spacer(1, 0.4 * cm))
    story.append(HRFlowable(width="100%", thickness=0.6, color=PETFY_BEIGE,
                            spaceBefore=0, spaceAfter=6))
    story.append(Paragraph(
        f'<font color="#9ca3af" size="7">'
        f'Documento generado electrónicamente por <b>{emp_nombre}</b>. '
        f'Este comprobante es un documento equivalente para efectos internos.'
        f'</font>',
        s_small,
    ))
    story.append(Spacer(1, 0.3 * cm))
    story.append(HRFlowable(width="100%", thickness=2.5, color=PETFY_TEAL,
                            spaceBefore=0, spaceAfter=0))
    story.append(HRFlowable(width="100%", thickness=1, color=PETFY_ORANGE,
                            spaceBefore=0, spaceAfter=0))

    doc.build(story)
    return buffer.getvalue()