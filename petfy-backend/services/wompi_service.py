# backend/services/wompi_service.py
import os
import hashlib
import requests
from typing import Optional

WOMPI_PUBLIC_KEY = os.getenv("WOMPI_PUBLIC_KEY", "").strip('"').strip()
WOMPI_PRIVATE_KEY = os.getenv("WOMPI_PRIVATE_KEY", "").strip('"').strip()
WOMPI_EVENTS_SECRET = os.getenv("WOMPI_EVENTS_SECRET", "").strip('"').strip()
WOMPI_INTEGRITY_SECRET = os.getenv("WOMPI_INTEGRITY_SECRET", "").strip('"').strip()
WOMPI_REDIRECT_URL = os.getenv("WOMPI_REDIRECT_URL", "https://petfy.com.co/perfil?pago=exitoso")

if WOMPI_PUBLIC_KEY.startswith("pub_prod_"):
    WOMPI_API_URL = "https://production.wompi.co/v1"
    WOMPI_CHECKOUT_URL = "https://checkout.wompi.co/p/"
else:
    WOMPI_API_URL = "https://sandbox.wompi.co/v1"
    WOMPI_CHECKOUT_URL = "https://checkout.wompi.co/p/"


# 1. TOKEN DE ACEPTACION

def obtener_tokens_aceptacion() -> dict:
    """
    Llama GET /merchants/info con la llave pública en el header.
    Devuelve los tokens de aceptación de términos y tratamiento de datos.
    """
    url = f"{WOMPI_API_URL}/merchants/info"
    headers = {"x-merchant-public-key": WOMPI_PUBLIC_KEY}

    resp = requests.get(url, headers=headers, timeout=10)
    resp.raise_for_status()
    data = resp.json().get("data", {})

    return {
        "acceptance_token": data["presigned_acceptance"]["acceptance_token"],
        "accept_personal_auth": data["presigned_personal_data_auth"]["acceptance_token"],
    }


# 2. FIRMA DE INTEGRIDAD

def generar_firma_integridad(referencia: str, monto_centavos: int, moneda: str = "COP") -> str:
    cadena = f"{referencia}{monto_centavos}{moneda}{WOMPI_INTEGRITY_SECRET}"
    return hashlib.sha256(cadena.encode("utf-8")).hexdigest()


# 3. CONSTRUIR LINK DE PAGO

def crear_link_pago(
    referencia: str,
    monto: int,
    descripcion: str,
    email_cliente: str,
    nombre_cliente: str = "",
    telefono_cliente: str = "",
    id_cita: Optional[int] = None,
) -> dict:
    # Monto en centavos (acepta int o str con decimales)
    monto_centavos = int(round(float(monto) * 100))

    # 1. Obtener tokens de aceptación
    try:
        tokens = obtener_tokens_aceptacion()
    except Exception as e:
        print(f"❌ Error obteniendo tokens de aceptación: {e}")
        raise

    # 2. Firma de integridad
    firma = generar_firma_integridad(referencia, monto_centavos, "COP")

    # 3. Parámetros de la URL
    params = {
        "public-key": WOMPI_PUBLIC_KEY,
        "currency": "COP",
        "amount-in-cents": monto_centavos,
        "reference": referencia,
        "signature:integrity": firma,
        "redirect-url": WOMPI_REDIRECT_URL,
        "customer-data:email": email_cliente,
        "acceptance-token": tokens["acceptance_token"],
        "accept-personal-auth": tokens["accept_personal_auth"],
    }
    if nombre_cliente:
        params["customer-data:full-name"] = nombre_cliente
    if telefono_cliente:
        params["customer-data:phone-number"] = telefono_cliente
        params["customer-data:phone-number-prefix"] = "+57"

    # 4. URL-encode correcto usando requests
    url = f"{WOMPI_CHECKOUT_URL}?{requests.utils.urlencode(params)}"

    print(f"🔗 URL de checkout generada: {url}")

    return {
        "url": url,
        "firma": firma,
        "referencia": referencia,
        "monto_centavos": monto_centavos,
    }


# 4. CONSULTAR TRANSACCION

def consultar_transaccion(id_transaccion: str) -> dict:
    url = f"{WOMPI_API_URL}/transactions/{id_transaccion}"
    headers = {"Authorization": f"Bearer {WOMPI_PRIVATE_KEY}"}
    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        print(f"Error consultando Wompi: {e}")
        return {"error": str(e)}