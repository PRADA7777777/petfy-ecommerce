# backend/email_service.py
import os
import random
import resend
from dotenv import load_dotenv

load_dotenv()

resend.api_key = os.getenv("RESEND_API_KEY", "")
RESEND_FROM = os.getenv("RESEND_FROM_EMAIL", "onboarding@resend.dev")
CODIGO_EXPIRA_MINUTOS = int(os.getenv("CODIGO_EXPIRACION_MINUTOS", 5))


def generar_codigo() -> str:
    return str(random.randint(100000, 999999))


def enviar_codigo_email(correo: str, codigo: str, nombre: str) -> bool:
    """
    Envía el código de verificación por correo usando Resend.
    Si no hay API key configurada, lo imprime en consola (modo dev).
    """
    if not resend.api_key:
        print("\n" + "=" * 50)
        print(f"🔐 MODO DESARROLLO - Código para {nombre} ({correo}):")
        print(f"   CÓDIGO: {codigo}")
        print("=" * 50 + "\n")
        return True

    html = f"""
        <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
            <h2>🐾 Petfy</h2>
            <p>Hola {nombre}, tu código de verificación es:</p>
            <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px;">{codigo}</p>
            <p>Válido por {CODIGO_EXPIRA_MINUTOS} minutos.</p>
        </div>
    """

    try:
        resend.Emails.send({
            "from": RESEND_FROM,
            "to": [correo],
            "subject": "Tu código de verificación - Petfy",
            "html": html,
        })
        print(f"✅ Correo enviado a {correo}")
        return True
    except Exception as e:
        print(f"❌ Error al enviar correo: {e}")
        print(f"🔐 CÓDIGO DE RESPALDO: {codigo}")
        return False
