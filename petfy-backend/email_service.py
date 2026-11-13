import os
import random
import resend
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

resend.api_key = os.getenv("RESEND_API_KEY", "")
RESEND_FROM = os.getenv("RESEND_FROM_EMAIL", "onboarding@resend.dev")
CODIGO_EXPIRA_MINUTOS = int(os.getenv("CODIGO_EXPIRACION_MINUTOS", 5))

ASSETS_URL = os.getenv("FRONTEND_URL", "https://petfy.com.co")

# ─── Assets de marca (colores originales, sin filtros CSS) ───
LOGO_ICONO      = f"{ASSETS_URL}/assets/img/Logo-Petfy-renovado.png"     # ícono teal (fondo claro)
NOMBRE_BEIGE    = f"{ASSETS_URL}/assets/img/Nombre-Petfy-Beige.png"      # wordmark beige (fondo oscuro)
NOMBRE_NARANJA  = f"{ASSETS_URL}/assets/img/Nombre-Petfy-Naranja.png"    # wordmark naranja (fondo claro)
NOMBRE_VERDE    = f"{ASSETS_URL}/assets/img/Nombre-Petfy-Verde.png"      # wordmark teal (fondo claro)

# Paleta
C_TEAL      = "#064F56"
C_TEAL_2    = "#0B7A84"
C_ORANGE    = "#E0633F"
C_ORANGE_LT = "#FFB9C4"
C_YELLOW    = "#EA9200"
C_BEIGE     = "#f4ebe2"
C_BEIGE_2   = "#fff8f5"
C_TEXT      = "#1f1b24"
C_TEXT_MID  = "#4b5563"
C_TEXT_LT   = "#9ca3af"

EMPRESA_NOMBRE = os.getenv("EMPRESA_NOMBRE", "Petfy")
EMPRESA_EMAIL  = os.getenv("EMPRESA_EMAIL", "facturacion@petfy.com.co")


def generar_codigo() -> str:
    return str(random.randint(100000, 999999))


def _fmt_cop(valor) -> str:
    try:
        return "$" + f"{float(valor):,.0f}".replace(",", ".")
    except Exception:
        return "$0"


# ═══════════════════════════════════════════════════════════════
# WRAPPER RESPONSIVE
# ═══════════════════════════════════════════════════════════════

def _html_wrapper(titulo: str, preheader: str, contenido: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="es" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light only">
  <title>{titulo}</title>
  <style>
    body {{ margin:0; padding:0; background:{C_BEIGE}; font-family: Arial, Helvetica, sans-serif; -webkit-font-smoothing:antialiased; }}
    table {{ border-collapse:collapse; }}
    img {{ border:0; outline:none; text-decoration:none; display:block; }}
    a {{ text-decoration:none; }}
    .wrapper {{ width:100%; max-width:600px; margin:0 auto; }}
    @media only screen and (max-width:600px) {{
      .wrapper {{ width:100% !important; }}
      .px {{ padding-left:20px !important; padding-right:20px !important; }}
      .hero-pad {{ padding:28px 20px !important; }}
      .total-num {{ font-size:20px !important; }}
      .code-big {{ font-size:34px !important; letter-spacing:8px !important; text-indent:8px !important; }}
      .logo-hero {{ width:160px !important; }}
      .logo-foot {{ width:150px !important; }}
    }}
  </style>
</head>
<body style="margin:0;padding:0;background:{C_BEIGE};">

  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:{C_BEIGE};">
    {preheader}
  </div>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:{C_BEIGE};">
    <tr>
      <td align="center" style="padding:32px 12px;">
        <table role="presentation" class="wrapper" cellspacing="0" cellpadding="0" border="0" width="600" style="width:600px;max-width:600px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(6,79,86,0.08);">

          {contenido}

        </table>

        <p style="margin:20px 0 6px 0;color:{C_TEXT_LT};font-size:11px;text-align:center;line-height:1.5;font-family:Arial,Helvetica,sans-serif;">
          &copy; {EMPRESA_NOMBRE} - Todos los derechos reservados
        </p>
        <p style="margin:0;color:#b8b8b8;font-size:10px;text-align:center;line-height:1.5;font-family:Arial,Helvetica,sans-serif;">
          Este es un mensaje automático, por favor no respondas a este correo.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>"""


# ═══════════════════════════════════════════════════════════════
# BLOQUES REUTILIZABLES
# ═══════════════════════════════════════════════════════════════

def _header_petfy() -> str:
    """
    Header teal con el wordmark BEIGE (que ya está diseñado para fondo oscuro).
    Sin filtros CSS, sin trucos raros.
    """
    return f"""
          <tr>
            <td class="hero-pad" align="center" style="background:{C_TEAL};padding:36px 40px 30px 40px;">

              <!-- Wordmark Petfy BEIGE (original, sin filtro) -->
              <img src="{NOMBRE_BEIGE}" alt="Petfy" class="logo-hero"
                   width="180"
                   style="display:block;margin:0 auto;width:180px;height:auto;max-width:70%;">

              <p style="margin:16px 0 0 0;color:rgba(255,255,255,0.78);font-size:13px;letter-spacing:0.3px;font-family:Arial,Helvetica,sans-serif;">
                Paseos y cuidado para tus mejores amigos
              </p>

              <!-- Línea de marca tricolor -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="140" align="center" style="margin:20px auto 0;">
                <tr>
                  <td height="4" width="46" style="background:{C_ORANGE};border-radius:2px 0 0 2px;"></td>
                  <td height="4" width="46" style="background:{C_YELLOW};"></td>
                  <td height="4" width="48" style="background:{C_ORANGE_LT};border-radius:0 2px 2px 0;"></td>
                </tr>
              </table>

            </td>
          </tr>"""


def _footer_petfy() -> str:
    """
    Footer con logo ORIGINAL teal (para fondo claro).
    Sin filtros, colores reales de marca.
    """
    return f"""
          <tr>
            <td align="center" class="px" style="background:{C_BEIGE_2};padding:32px 40px;">

              <!-- Ícono teal + Wordmark teal (colores originales) -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:0 auto;">
                <tr>
                  <td style="vertical-align:middle;padding-right:10px;">
                    <img src="{LOGO_ICONO}" alt="" width="56"
                         style="display:block;width:56px;height:auto;">
                  </td>
                  <td style="vertical-align:middle;">
                    <img src="{NOMBRE_VERDE}" alt="Petfy" width="130"
                         style="display:block;width:130px;height:auto;">
                  </td>
                </tr>
              </table>

              <p style="margin:16px 0 18px 0;color:{C_TEXT_MID};font-size:12px;line-height:1.5;font-family:Arial,Helvetica,sans-serif;">
                Paseos y Servicios para Mascotas
              </p>

              <p style="margin:0;">
                <a href="{ASSETS_URL}"
                   style="display:inline-block;background:{C_ORANGE};color:#ffffff;font-size:13px;font-weight:700;padding:10px 22px;border-radius:100px;text-decoration:none;font-family:Arial,Helvetica,sans-serif;">
                  Visita petfy.com.co
                </a>
              </p>
            </td>
          </tr>"""


def _puntitos_marca() -> str:
    return f"""
          <tr>
            <td align="center" style="padding:22px 40px 0 40px;">
              <span style="display:inline-block;width:7px;height:7px;background:{C_ORANGE};border-radius:50%;margin:0 4px;"></span>
              <span style="display:inline-block;width:7px;height:7px;background:{C_YELLOW};border-radius:50%;margin:0 4px;"></span>
              <span style="display:inline-block;width:7px;height:7px;background:{C_ORANGE_LT};border-radius:50%;margin:0 4px;"></span>
              <span style="display:inline-block;width:7px;height:7px;background:{C_TEAL};border-radius:50%;margin:0 4px;"></span>
            </td>
          </tr>"""


# ═══════════════════════════════════════════════════════════════
# TEMPLATE: CÓDIGO DE VERIFICACIÓN
# ═══════════════════════════════════════════════════════════════

def _template_codigo(nombre: str, codigo: str) -> str:
    contenido = f"""
          {_header_petfy()}

          <tr>
            <td align="center" class="px" style="padding:38px 40px 0 40px;">
              <span style="display:inline-block;background:#fff0e8;color:{C_ORANGE};font-size:11px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase;padding:8px 18px;border-radius:100px;font-family:Arial,Helvetica,sans-serif;">
                Verifica tu correo
              </span>
            </td>
          </tr>

          <tr>
            <td align="center" class="px" style="padding:22px 40px 8px 40px;">
              <h1 style="margin:0;color:{C_TEXT};font-size:26px;font-weight:800;line-height:1.3;font-family:Arial,Helvetica,sans-serif;">
                Hola, {nombre}
              </h1>
              <p style="margin:14px 0 0 0;color:{C_TEXT_MID};font-size:15px;line-height:1.6;font-family:Arial,Helvetica,sans-serif;">
                Gracias por unirte a <strong style="color:{C_ORANGE};">Petfy</strong>. Estamos felices de ayudarte a cuidar a tu mejor amigo.
              </p>
            </td>
          </tr>

          <tr>
            <td class="px" style="padding:28px 40px 0 40px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:{C_BEIGE_2};border:2px dashed {C_ORANGE};border-radius:18px;">
                <tr>
                  <td align="center" style="padding:30px 20px;">
                    <div class="code-big" style="font-family:'Courier New',Courier,monospace;font-size:42px;font-weight:900;letter-spacing:12px;color:{C_ORANGE};line-height:1;text-indent:12px;">
                      {codigo}
                    </div>
                    <div style="margin-top:14px;color:{C_TEXT_LT};font-size:11px;letter-spacing:0.6px;text-transform:uppercase;font-weight:700;font-family:Arial,Helvetica,sans-serif;">
                      Código de verificación
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" class="px" style="padding:20px 40px 0 40px;">
              <span style="display:inline-block;background:#fef3c7;border-radius:100px;padding:9px 20px;font-size:13px;color:#92400e;font-weight:700;font-family:Arial,Helvetica,sans-serif;">
                Expira en {CODIGO_EXPIRA_MINUTOS} minutos
              </span>
            </td>
          </tr>

          <tr>
            <td class="px" style="padding:26px 40px 8px 40px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#F0FDFA;border-left:4px solid {C_TEAL_2};border-radius:10px;">
                <tr>
                  <td style="padding:15px 18px;color:#0a5c63;font-size:12.5px;line-height:1.55;font-family:Arial,Helvetica,sans-serif;">
                    <strong>¿No solicitaste este registro?</strong> Puedes ignorar este mensaje tranquilamente. Tu correo seguirá seguro.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          {_puntitos_marca()}

          {_footer_petfy()}
"""

    return _html_wrapper(
        titulo="Verifica tu cuenta - Petfy",
        preheader=f"Tu código de verificación es {codigo}. Expira en {CODIGO_EXPIRA_MINUTOS} minutos.",
        contenido=contenido,
    )


def _template_texto_plano(nombre: str, codigo: str) -> str:
    return f"""
Hola, {nombre}!

Gracias por unirte a Petfy! Estamos felices de ayudarte a cuidar a tu mejor amigo.

Tu codigo de verificacion es: {codigo}

Este codigo expira en {CODIGO_EXPIRA_MINUTOS} minutos.
Si no solicitaste este registro, puedes ignorar este mensaje.

---
Petfy - Paseos y Servicios para Mascotas
https://petfy.com.co
Instagram: https://www.instagram.com/petfyservice___/
WhatsApp: https://wa.me/573204829244
"""


def enviar_codigo_email(correo: str, codigo: str, nombre: str) -> bool:
    if not resend.api_key:
        print("\n" + "=" * 60)
        print(f"[DEV] Codigo para {nombre} ({correo}):")
        print(f"   CODIGO: {codigo}")
        print(f"   EXPIRA EN: {CODIGO_EXPIRA_MINUTOS} minutos")
        print("=" * 60 + "\n")
        return True

    try:
        response = resend.Emails.send({
            "from": f"Petfy <{RESEND_FROM}>",
            "to": [correo],
            "subject": f"Tu codigo de verificacion Petfy: {codigo}",
            "html": _template_codigo(nombre, codigo),
            "text": _template_texto_plano(nombre, codigo),
        })
        print(f"[OK] Correo enviado a {correo} - ID: {response.get('id', 'N/A')}")
        return True
    except Exception as e:
        print(f"[ERROR] Al enviar correo a {correo}: {type(e).__name__}: {e}")
        print(f"[DEV] CODIGO DE RESPALDO: {codigo}")
        return False


# ═══════════════════════════════════════════════════════════════
# TEMPLATE: CÓDIGOS DE INICIO DEL PASEO
# ═══════════════════════════════════════════════════════════════

DIAS_CORTOS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]


def _fecha_paseo(fila: dict) -> str:
    fecha = fila["fecha"]
    return f"{DIAS_CORTOS[fecha.weekday()]} {fecha.strftime('%d/%m/%Y')} · {fila['hora'].strftime('%H:%M')}"


def _template_codigos_paseo(nombre: str, filas: list) -> str:
    filas_html = "".join(f"""
                <tr>
                  <td style="padding:12px 14px;border-bottom:1px solid #f0e6dc;color:{C_TEXT};font-size:14px;font-family:Arial,Helvetica,sans-serif;">{_fecha_paseo(fila)}</td>
                  <td style="padding:12px 14px;border-bottom:1px solid #f0e6dc;color:{C_TEXT_MID};font-size:14px;font-family:Arial,Helvetica,sans-serif;">{fila["mascota"]}</td>
                  <td align="center" style="padding:12px 14px;border-bottom:1px solid #f0e6dc;color:{C_ORANGE};font-size:20px;font-weight:900;letter-spacing:4px;font-family:'Courier New',Courier,monospace;">{fila["codigo"]}</td>
                </tr>""" for fila in filas)

    contenido = f"""
          {_header_petfy()}

          <tr>
            <td align="center" class="px" style="padding:38px 40px 0 40px;">
              <span style="display:inline-block;background:#fff0e8;color:{C_ORANGE};font-size:11px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase;padding:8px 18px;border-radius:100px;font-family:Arial,Helvetica,sans-serif;">
                Códigos de inicio del paseo
              </span>
            </td>
          </tr>

          <tr>
            <td align="center" class="px" style="padding:22px 40px 8px 40px;">
              <h1 style="margin:0;color:{C_TEXT};font-size:26px;font-weight:800;line-height:1.3;font-family:Arial,Helvetica,sans-serif;">
                Hola, {nombre}
              </h1>
              <p style="margin:14px 0 0 0;color:{C_TEXT_MID};font-size:15px;line-height:1.6;font-family:Arial,Helvetica,sans-serif;">
                Tu agendamiento quedó confirmado. Cuando el paseador llegue por tu mascota, dale el código de ese día para iniciar el paseo.
              </p>
            </td>
          </tr>

          <tr>
            <td class="px" style="padding:24px 40px 0 40px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:{C_BEIGE_2};border:2px dashed {C_ORANGE};border-radius:18px;">
                <tr>
                  <td style="padding:12px 14px;color:{C_TEXT_LT};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;font-family:Arial,Helvetica,sans-serif;">Paseo</td>
                  <td style="padding:12px 14px;color:{C_TEXT_LT};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;font-family:Arial,Helvetica,sans-serif;">Mascota</td>
                  <td align="center" style="padding:12px 14px;color:{C_TEXT_LT};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;font-family:Arial,Helvetica,sans-serif;">Código</td>
                </tr>{filas_html}
              </table>
            </td>
          </tr>

          <tr>
            <td class="px" style="padding:26px 40px 8px 40px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#F0FDFA;border-left:4px solid {C_TEAL_2};border-radius:10px;">
                <tr>
                  <td style="padding:15px 18px;color:#0a5c63;font-size:12.5px;line-height:1.55;font-family:Arial,Helvetica,sans-serif;">
                    <strong>Cada código sirve solo el día de su paseo.</strong> Si otra persona entrega a tu mascota, compártele el código de ese día. También lo encuentras en tu perfil de Petfy.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          {_puntitos_marca()}

          {_footer_petfy()}
"""

    return _html_wrapper(
        titulo="Códigos de tus paseos - Petfy",
        preheader="Tu agendamiento quedó confirmado. Aquí están los códigos para iniciar cada paseo.",
        contenido=contenido,
    )


def _template_codigos_paseo_texto(nombre: str, filas: list) -> str:
    lineas = "\n".join(f"- {_fecha_paseo(fila)} | {fila['mascota']} | Codigo: {fila['codigo']}" for fila in filas)
    return f"""
Hola, {nombre}!

Tu agendamiento quedo confirmado. Cuando el paseador llegue por tu mascota, dale el codigo de ese dia para iniciar el paseo.

{lineas}

Cada codigo sirve solo el dia de su paseo. Tambien lo encuentras en tu perfil de Petfy.

---
Petfy - Paseos y Servicios para Mascotas
https://petfy.com.co
WhatsApp: https://wa.me/573204829244
"""


def enviar_codigos_paseo_email(correo: str, nombre: str, filas: list) -> bool:
    if not resend.api_key:
        print("\n" + "=" * 60)
        print(f"[DEV] Codigos de paseo para {nombre} ({correo}):")
        for fila in filas:
            print(f"   {_fecha_paseo(fila)} | {fila['mascota']} | CODIGO: {fila['codigo']}")
        print("=" * 60 + "\n")
        return True

    try:
        response = resend.Emails.send({
            "from": f"{EMPRESA_NOMBRE} <{RESEND_FROM}>",
            "to": [correo],
            "subject": f"Códigos de inicio de tus paseos - {EMPRESA_NOMBRE}",
            "html": _template_codigos_paseo(nombre, filas),
            "text": _template_codigos_paseo_texto(nombre, filas),
        })
        print(f"[OK] Codigos de paseo enviados a {correo} - ID: {response.get('id', 'N/A')}")
        return True
    except Exception as e:
        print(f"[ERROR] Enviando codigos de paseo a {correo}: {type(e).__name__}: {e}")
        return False


# ═══════════════════════════════════════════════════════════════
# TEMPLATE: FACTURA
# ═══════════════════════════════════════════════════════════════

def _template_factura(
    nombre_cliente: str,
    num_factura: str,
    total: float,
    fecha_emision: datetime,
    concepto: str = "Servicio de paseo",
) -> str:
    fecha_str = fecha_emision.strftime("%d/%m/%Y") if fecha_emision else "-"
    total_fmt = _fmt_cop(total)

    contenido = f"""
          {_header_petfy()}

          <tr>
            <td align="center" class="px" style="padding:38px 40px 0 40px;">
              <span style="display:inline-block;background:#dcfce7;color:#15803d;font-size:11px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase;padding:8px 18px;border-radius:100px;font-family:Arial,Helvetica,sans-serif;">
                ✓ Pago confirmado
              </span>
            </td>
          </tr>

          <tr>
            <td align="center" class="px" style="padding:22px 40px 8px 40px;">
              <h1 style="margin:0;color:{C_TEXT};font-size:26px;font-weight:800;line-height:1.3;font-family:Arial,Helvetica,sans-serif;">
                Gracias, {nombre_cliente}
              </h1>
              <p style="margin:14px 0 0 0;color:{C_TEXT_MID};font-size:15px;line-height:1.6;font-family:Arial,Helvetica,sans-serif;">
                Hemos recibido tu pago correctamente. Adjuntamos tu factura en formato PDF.
              </p>
            </td>
          </tr>

          <tr>
            <td class="px" style="padding:26px 40px 8px 40px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:{C_BEIGE_2};border:1px solid {C_BEIGE};border-radius:18px;">
                <tr>
                  <td style="padding:24px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="padding:7px 0;color:{C_TEXT};font-size:14px;font-weight:700;font-family:Arial,Helvetica,sans-serif;">N. Factura:</td>
                        <td style="padding:7px 0;color:{C_TEXT};font-size:14px;text-align:right;font-weight:700;font-family:Arial,Helvetica,sans-serif;">{num_factura}</td>
                      </tr>
                      <tr>
                        <td style="padding:7px 0;color:{C_TEXT_MID};font-size:14px;font-family:Arial,Helvetica,sans-serif;">Fecha:</td>
                        <td style="padding:7px 0;color:{C_TEXT};font-size:14px;text-align:right;font-family:Arial,Helvetica,sans-serif;">{fecha_str}</td>
                      </tr>
                      <tr>
                        <td style="padding:7px 0;color:{C_TEXT_MID};font-size:14px;font-family:Arial,Helvetica,sans-serif;">Concepto:</td>
                        <td style="padding:7px 0;color:{C_TEXT};font-size:14px;text-align:right;font-family:Arial,Helvetica,sans-serif;">{concepto}</td>
                      </tr>
                      <tr><td colspan="2" style="padding:12px 0 0 0;"><div style="border-top:2px dashed {C_ORANGE};"></div></td></tr>
                      <tr>
                        <td style="padding:12px 0 0 0;color:{C_TEXT};font-size:14px;font-weight:800;font-family:Arial,Helvetica,sans-serif;">TOTAL PAGADO</td>
                        <td class="total-num" style="padding:12px 0 0 0;color:{C_ORANGE};font-size:22px;text-align:right;font-weight:900;font-family:Arial,Helvetica,sans-serif;">{total_fmt}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td class="px" style="padding:22px 40px 8px 40px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#F0FDFA;border-left:4px solid {C_TEAL_2};border-radius:10px;">
                <tr>
                  <td style="padding:15px 18px;color:#0a5c63;font-size:12.5px;line-height:1.55;font-family:Arial,Helvetica,sans-serif;">
                    <strong>Tu factura está adjunta</strong> a este correo como archivo PDF. Guárdala para tus registros.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" class="px" style="padding:22px 40px 8px 40px;">
              <p style="margin:0;color:{C_TEXT_MID};font-size:13px;line-height:1.6;font-family:Arial,Helvetica,sans-serif;">
                ¿Tienes dudas? Escríbenos a
                <a href="mailto:{EMPRESA_EMAIL}" style="color:{C_ORANGE};font-weight:700;text-decoration:none;">{EMPRESA_EMAIL}</a>
              </p>
            </td>
          </tr>

          {_puntitos_marca()}

          {_footer_petfy()}
"""

    return _html_wrapper(
        titulo=f"Tu factura {num_factura} - Petfy",
        preheader=f"Gracias por tu pago. Tu factura {num_factura} está adjunta.",
        contenido=contenido,
    )


def _template_factura_texto(
    nombre_cliente: str, num_factura: str, total: float, fecha_emision: datetime
) -> str:
    fecha_str = fecha_emision.strftime("%d/%m/%Y") if fecha_emision else "-"
    total_fmt = _fmt_cop(total)
    return f"""
Hola, {nombre_cliente}!

Gracias por tu pago. Adjuntamos la factura en PDF.

N. Factura: {num_factura}
Fecha: {fecha_str}
Total pagado: {total_fmt}

Si tienes dudas escribenos a {EMPRESA_EMAIL}.

---
Petfy - Paseos y Servicios para Mascotas
https://petfy.com.co
"""


def enviar_factura_email(
    destinatario: str,
    nombre_cliente: str,
    num_factura: str,
    total: float,
    pdf_bytes: bytes,
    fecha_emision: datetime = None,
    concepto: str = "Servicio de paseo",
) -> bool:
    if not destinatario:
        print("[WARN] No se envio factura: falta el correo del destinatario")
        return False

    if not pdf_bytes:
        print("[WARN] No se envio factura: el PDF esta vacio")
        return False

    if not resend.api_key:
        print(f"[MAIL] MODO DESARROLLO - Factura {num_factura} para {destinatario} (no enviada)")
        return True

    fecha_emision = fecha_emision or datetime.now()

    try:
        params = {
            "from": f"{EMPRESA_NOMBRE} <{RESEND_FROM}>",
            "to": [destinatario],
            "subject": f"Tu factura {num_factura} - {EMPRESA_NOMBRE}",
            "html": _template_factura(
                nombre_cliente=nombre_cliente,
                num_factura=num_factura,
                total=total,
                fecha_emision=fecha_emision,
                concepto=concepto,
            ),
            "text": _template_factura_texto(
                nombre_cliente=nombre_cliente,
                num_factura=num_factura,
                total=total,
                fecha_emision=fecha_emision,
            ),
            "attachments": [
                {
                    "filename": f"{num_factura}.pdf",
                    "content": list(pdf_bytes),
                }
            ],
        }
        response = resend.Emails.send(params)
        print(f"[OK] Factura {num_factura} enviada a {destinatario} - ID: {response.get('id', 'N/A')}")
        return True
    except Exception as e:
        print(f"[ERROR] Enviando factura {num_factura} a {destinatario}: {type(e).__name__}: {e}")
        return False