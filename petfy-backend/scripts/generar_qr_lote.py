# petfy-backend/scripts/generar_qr_lote.py
"""Genera QR PNG + PDF A4 para imprenta a partir de un CSV."""
import argparse
import csv
import io
import sys
from pathlib import Path
from datetime import datetime

import qrcode
from qrcode.constants import ERROR_CORRECT_H
from PIL import Image, ImageDraw, ImageFont
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas as pdf_canvas
from reportlab.lib.utils import ImageReader

BASE_URL = "https://petfy.com.co/p/"
COLOR_PETFY_TEAL = (6, 79, 86)
COLOR_PETFY_BEIGE = (244, 235, 226)

PLACA_ANCHO_MM = 30
PLACA_ALTO_MM = 40
QR_TAMANO_MM = 20
QR_DPI = 600


def generar_qr_png(url, codigo, output_dir, con_logo=True):
    qr = qrcode.QRCode(error_correction=ERROR_CORRECT_H, box_size=20, border=2)
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color=COLOR_PETFY_TEAL, back_color="white").convert("RGB")
    if con_logo:
        img = _agregar_logo_centro(img)
    path = output_dir / f"{codigo}.png"
    img.save(path, "PNG", dpi=(QR_DPI, QR_DPI))
    return path


def _agregar_logo_centro(qr_img):
    qr_img = qr_img.copy()
    draw = ImageDraw.Draw(qr_img)
    w, h = qr_img.size
    tamano = int(w * 0.18)
    cx, cy = w // 2, h // 2
    x0, y0 = cx - tamano // 2, cy - tamano // 2
    x1, y1 = cx + tamano // 2, cy + tamano // 2
    draw.ellipse([x0, y0, x1, y1], fill="white")
    draw.ellipse([x0 + 4, y0 + 4, x1 - 4, y1 - 4], outline=COLOR_PETFY_TEAL, width=3)
    try:
        font = ImageFont.truetype("seguiemj.ttf", int(tamano * 0.6))
    except Exception:
        font = ImageFont.load_default()
    texto = "\U0001F43E"
    bbox = draw.textbbox((0, 0), texto, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    draw.text((cx - tw // 2, cy - th // 2 - 4), texto, font=font, fill=COLOR_PETFY_TEAL)
    return qr_img


def generar_pdf_imprenta(codigos, output_path, con_logo=True):
    w_a4, h_a4 = A4
    ancho_placa = PLACA_ANCHO_MM * mm
    alto_placa = PLACA_ALTO_MM * mm
    margen = 10 * mm
    gap = 4 * mm
    cols = max(1, int((w_a4 - 2 * margen + gap) // (ancho_placa + gap)))
    por_pagina = cols * max(1, int((h_a4 - 2 * margen + gap) // (alto_placa + gap)))

    c = pdf_canvas.Canvas(str(output_path), pagesize=A4)
    c.setTitle("Petfy - Placas")
    c.setAuthor("Petfy")

    qr_cache = {}
    for codigo in codigos:
        url = f"{BASE_URL}{codigo}"
        qr = qrcode.QRCode(error_correction=ERROR_CORRECT_H, box_size=10, border=1)
        qr.add_data(url)
        qr.make(fit=True)
        img = qr.make_image(fill_color=COLOR_PETFY_TEAL, back_color="white").convert("RGB")
        if con_logo:
            img = _agregar_logo_centro(img)
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        buf.seek(0)
        qr_cache[codigo] = buf

    for i, codigo in enumerate(codigos):
        if i > 0 and i % por_pagina == 0:
            c.showPage()
        pos = i % por_pagina
        col = pos % cols
        fila = pos // cols
        x = margen + col * (ancho_placa + gap)
        y = h_a4 - margen - (fila + 1) * alto_placa - fila * gap
        _dibujar_placa(c, x, y, codigo, qr_cache[codigo])
    c.save()


def _dibujar_placa(c, x, y, codigo, qr_buf):
    w = PLACA_ANCHO_MM * mm
    h = PLACA_ALTO_MM * mm
    c.setStrokeColorRGB(0.7, 0.7, 0.7)
    c.setLineWidth(0.2)
    c.setDash(1, 1)
    c.rect(x, y, w, h)
    c.setDash()
    c.setFillColorRGB(*[v / 255 for v in COLOR_PETFY_BEIGE])
    c.rect(x + 0.3 * mm, y + 0.3 * mm, w - 0.6 * mm, h - 0.6 * mm, fill=1, stroke=0)
    header_h = 5 * mm
    c.setFillColorRGB(*[v / 255 for v in COLOR_PETFY_TEAL])
    c.rect(x + 0.3 * mm, y + h - header_h - 0.3 * mm, w - 0.6 * mm, header_h, fill=1, stroke=0)
    c.setFillColorRGB(1, 1, 1)
    c.setFont("Helvetica-Bold", 6)
    c.drawCentredString(x + w / 2, y + h - header_h + 1.2 * mm, "PETFY")
    qr_size = QR_TAMANO_MM * mm
    c.drawImage(ImageReader(qr_buf), x + (w - qr_size) / 2, y + 10 * mm, width=qr_size, height=qr_size, preserveAspectRatio=True)
    c.setFillColorRGB(*[v / 255 for v in COLOR_PETFY_TEAL])
    c.setFont("Courier-Bold", 8)
    c.drawCentredString(x + w / 2, y + 6 * mm, codigo)
    c.setFillColorRGB(0.4, 0.4, 0.4)
    c.setFont("Helvetica", 3.5)
    c.drawCentredString(x + w / 2, y + 2.5 * mm, "Escanéame si me encuentras")


def generar_csv_verificacion(codigos, output_path):
    with open(output_path, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.writer(f)
        writer.writerow(["codigo", "url", "qr_png", "activo"])
        for codigo in codigos:
            writer.writerow([codigo, f"{BASE_URL}{codigo}", f"qr_individuales/{codigo}.png", "pendiente"])


def leer_codigos_desde_csv(csv_path):
    codigos = []
    with open(csv_path, "r", encoding="utf-8-sig") as f:
        for row in csv.DictReader(f):
            cod = row.get("codigo") or row.get("codigo_placa") or ""
            if cod.strip():
                codigos.append(cod.strip().upper())
    return codigos


def leer_codigos_desde_db(lote=None, estado="disponible"):
    sys.path.insert(0, str(Path(__file__).parent.parent))
    from database import SessionLocal
    from models import Placa
    db = SessionLocal()
    try:
        q = db.query(Placa).filter(Placa.estado == estado)
        if lote:
            q = q.filter(Placa.lote == lote)
        return [p.codigo for p in q.order_by(Placa.id_placa).all()]
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--csv", type=str)
    parser.add_argument("--db", action="store_true")
    parser.add_argument("--lote", type=str)
    parser.add_argument("--estado", type=str, default="disponible")
    parser.add_argument("--output", type=str)
    parser.add_argument("--sin-logo", action="store_true")
    args = parser.parse_args()

    if not args.csv and not args.db:
        print("ERROR: usa --csv <archivo.csv> o --db")
        sys.exit(1)

    if args.csv:
        csv_path = Path(args.csv)
        if not csv_path.exists():
            print(f"ERROR: no existe {csv_path.resolve()}")
            sys.exit(1)
        codigos = leer_codigos_desde_csv(csv_path)
        print(f"Leidos {len(codigos)} codigos desde {csv_path.name}")
    else:
        codigos = leer_codigos_desde_db(args.lote, args.estado)
        print(f"Leidos {len(codigos)} codigos desde BD")

    if not codigos:
        print("Sin codigos")
        sys.exit(0)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_base = Path(args.output or f"qr_output_{timestamp}")
    output_base.mkdir(parents=True, exist_ok=True)
    qr_dir = output_base / "qr_individuales"
    qr_dir.mkdir(exist_ok=True)

    print(f"Salida: {output_base.resolve()}")

    print(f"Generando {len(codigos)} QR PNG...")
    for i, codigo in enumerate(codigos, 1):
        generar_qr_png(f"{BASE_URL}{codigo}", codigo, qr_dir, con_logo=not args.sin_logo)
        if i % 50 == 0 or i == len(codigos):
            print(f"  {i}/{len(codigos)}")

    pdf_path = output_base / "placas_imprenta.pdf"
    print("Generando PDF A4...")
    generar_pdf_imprenta(codigos, pdf_path, con_logo=not args.sin_logo)

    generar_csv_verificacion(codigos, output_base / "verificacion.csv")

    print("")
    print("=" * 60)
    print("LISTO")
    print("=" * 60)
    print(f"  Carpeta:  {output_base.resolve()}")
    print(f"  PNGs:     {len(codigos)}")
    print(f"  PDF:      placas_imprenta.pdf")
    print(f"  CSV:      verificacion.csv")
    print("")


if __name__ == "__main__":
    main()