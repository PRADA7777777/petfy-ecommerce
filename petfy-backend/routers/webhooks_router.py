# backend/routers/webhooks_router.py
import os
import hashlib
import hmac
import json
import logging
import time
import httpx

from datetime import datetime, timedelta
from fastapi import APIRouter, Request, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session
from services.factura_pdf import generar_pdf_factura
from email_service import enviar_factura_email
from services.codigos_paseo import asignar_codigos_paseo, enviar_codigos_al_cliente
from database import SessionLocal
from models import (
    Pago, Cita, Factura, FacturaDetalle,
    Usuario, DocIdentidad, Plan, Suscripcion, WebhookEvento,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])

ESTADO_CITA_CONFIRMADA      = 2
ESTADO_PAGO_APROBADO        = 2
ESTADO_PAGO_RECHAZADO       = 3
ESTADO_PAGO_REEMBOLSADO     = 4
ESTADO_FACTURA_EMITIDA      = 1
ESTADO_FACTURA_PAGADA       = 2

IVA_PORCENTAJE = float(os.getenv("IVA_PORCENTAJE", "0"))

WOMPI_EVENTS_SECRET = os.getenv("WOMPI_EVENTS_SECRET", "").strip('"').strip()
WOMPI_PRIVATE_KEY = os.getenv("WOMPI_PRIVATE_KEY", "").strip('"').strip()
WOMPI_API_BASE = os.getenv("WOMPI_API_BASE", "https://sandbox.wompi.co").strip()


def _get_by_path(obj, path):
    for k in path.split("."):
        if not isinstance(obj, dict):
            return None
        obj = obj.get(k)
    return obj


def _firma_valida(body: dict) -> bool:
    """
    Valida la firma del webhook según Wompi.
    Fórmula: SHA256( valores_propiedades + timestamp + events_secret )
    """
    signature = body.get("signature")
    if not signature:
        logger.warning("Webhook sin 'signature'")
        return False

    if "properties" not in signature or "checksum" not in signature:
        logger.warning("Webhook con signature incompleta")
        return False

    properties = signature.get("properties", [])
    checksum_recibido = signature.get("checksum", "")

    if not isinstance(properties, list) or not isinstance(checksum_recibido, str):
        return False

    if not WOMPI_EVENTS_SECRET:
        logger.error("WOMPI_EVENTS_SECRET no configurado")
        return False

    valores = []
    for prop in properties:
        val = _get_by_path(body.get("data", {}), prop)
        valores.append(str(val))

    timestamp = str(body.get("timestamp", ""))

    # Validar timestamp (evita replay attacks)
    try:
        ts_int = int(timestamp)
        if abs(time.time() - ts_int) > 300:
            logger.warning(f"Webhook expirado: ts={ts_int}")
            return False
    except (ValueError, TypeError):
        logger.warning("Timestamp inválido en webhook")
        return False

    cadena = "".join(valores) + timestamp + WOMPI_EVENTS_SECRET
    hash_esperado = hashlib.sha256(cadena.encode("utf-8")).hexdigest()

    if not hmac.compare_digest(hash_esperado, checksum_recibido):
        logger.warning("Checksum no coincide en webhook")
        return False

    return True
    
    

def _generar_num_factura(db: Session) -> str:
    """Formato: PETFY-YYYY-000001"""
    year = datetime.now().year
    db.execute(text("SELECT nextval('public.factura_consecutivo_seq')"))
    consecutivo = db.execute(
        text("SELECT currval('public.factura_consecutivo_seq')")
    ).scalar()
    return f"PETFY-{year}-{consecutivo:06d}"


def _generar_cufe(num_factura: str, total: float, fecha: datetime) -> str:
    """CUFE simulado: SHA256(num + total + fecha + NIT). En producción usar DIAN."""
    nit = os.getenv("EMPRESA_NIT", "000000000")
    cadena = f"{num_factura}{total}{fecha.isoformat()}{nit}"
    return hashlib.sha256(cadena.encode()).hexdigest()


def _crear_factura(db: Session, pago: Pago, cita: Cita) -> Factura:
    usuario = (
        db.query(Usuario)
        .filter(Usuario.id_usuario == cita.id_usuario_cliente)
        .first()
    )
    doc = (
        db.query(DocIdentidad)
        .filter(DocIdentidad.id_usuario == usuario.id_usuario)
        .first()
        if usuario
        else None
    )
    plan = (
        db.query(Plan).filter(Plan.id_plan == cita.id_plan).first()
        if cita.id_plan
        else None
    )

    total = float(pago.monto or 0)
    iva = (
        round(total * (IVA_PORCENTAJE / (100 + IVA_PORCENTAJE)), 2)
        if IVA_PORCENTAJE > 0
        else 0
    )
    sub_total = round(total - iva, 2)

    num_factura = _generar_num_factura(db)
    fecha_emision = datetime.now()
    cufe = _generar_cufe(num_factura, total, fecha_emision)

    susc = None
    if cita.id_suscripcion:
        susc = (
            db.query(Suscripcion)
            .filter(Suscripcion.id_suscripcion == cita.id_suscripcion)
            .first()
        )

    if susc:
        observaciones = (
            f"{plan.nom_plan if plan else 'Plan Petfy'} · "
            f"Vigencia {susc.fecha_inicio.strftime('%d/%m/%Y')} â€“ "
            f"{susc.fecha_fin.strftime('%d/%m/%Y')} · "
            f"Sesión del {cita.fecha.strftime('%d/%m/%Y')} a las "
            f"{cita.hora.strftime('%H:%M')}"
        )
    else:
        observaciones = (
            f"Paseo de mascota programado para "
            f"{cita.fecha.strftime('%d/%m/%Y')} a las {cita.hora.strftime('%H:%M')}"
        )

    factura = Factura(
        num_factura=num_factura,
        fecha_emision=fecha_emision,
        fecha_vencimiento=fecha_emision + timedelta(days=30),
        total=total,
        sub_total=sub_total,
        iva=iva,
        moneda="COP",
        plan_pago="Pago electrónico Wompi",
        nombre_cliente=f"{usuario.nombre} {usuario.apellido}" if usuario else "Cliente Petfy",
        documento_cliente=doc.num_doc if doc else None,
        correo_cliente=usuario.correo if usuario else None,
        direccion_cliente=usuario.direccion if usuario else None,
        telefono_cliente=usuario.telefono if usuario else None,
        observaciones=observaciones,
        cufe=cufe,
        id_est_fact=ESTADO_FACTURA_PAGADA,
        id_cita=cita.id_cita,
        id_pago=pago.id_pago,
    )
    db.add(factura)
    db.flush()

    detalle = FacturaDetalle(
        concepto=f"Servicio de paseo - {plan.nom_plan if plan else 'Plan Petfy'}",
        cantidad=1,
        precio_uni=sub_total,
        iva=iva,
        total_linea=total,
        id_factura=factura.id_factura,
    )
    db.add(detalle)
    db.flush()
    return factura

@router.post("/wompi")
async def wompi_webhook(request: Request):
    body = await request.json()

    # Validar firma
    if not _firma_valida(body):
        raise HTTPException(status_code=400, detail="Firma inválida")

    # Validar estructura
    data = body.get("data", {})
    tx = data.get("transaction", {})

    if not tx:
        return {"ok": True, "mensaje": "Evento no es una transacción"}

    referencia = tx.get("reference")
    status = tx.get("status")
    tx_id = tx.get("id")

    if not referencia or not status or not tx_id:
        return {"ok": True, "mensaje": "Faltan datos en la transacción"}

    # ============ VERIFICACIÓN CONTRA API REAL DE WOMPI ============
    try:
        r = httpx.get(
            f"{WOMPI_API_BASE}/v1/transactions/{tx_id}",
            headers={"Authorization": f"Bearer {WOMPI_PRIVATE_KEY}"},
            timeout=10,
        )
        if r.status_code != 200:
            logger.warning(f"Wompi API rechazó tx {tx_id}: HTTP {r.status_code}")
            raise HTTPException(status_code=400, detail="Transacción no verificable con Wompi")

        real = r.json().get("data", {})

        if real.get("status") != status:
            logger.error(
                f"Webhook tx {tx_id}: status discrepancy "
                f"(webhook={status}, real={real.get('status')})"
            )
            raise HTTPException(status_code=400, detail="Estado de transacción inconsistente")

        if real.get("amount_in_cents") != tx.get("amount_in_cents"):
            logger.error(
                f"Webhook tx {tx_id}: amount discrepancy "
                f"(webhook={tx.get('amount_in_cents')}, real={real.get('amount_in_cents')})"
            )
            raise HTTPException(status_code=400, detail="Monto de transacción inconsistente")

        if real.get("reference") != referencia:
            logger.error(f"Webhook tx {tx_id}: reference discrepancy")
            raise HTTPException(status_code=400, detail="Referencia de transacción inconsistente")

        logger.info(f"Webhook tx {tx_id}: verificación OK contra Wompi")

    except httpx.RequestError as e:
        logger.error(f"Error contactando API Wompi para tx {tx_id}: {e}")
        raise HTTPException(status_code=500, detail="Error contactando Wompi")
    # ================================================================

    # Abrir sesión ANTES de procesar para registrar idempotencia
    mapa = {
        "APPROVED": ESTADO_PAGO_APROBADO,
        "DECLINED": ESTADO_PAGO_RECHAZADO,
        "VOIDED": ESTADO_PAGO_REEMBOLSADO,
        "ERROR": ESTADO_PAGO_RECHAZADO,
    }
    nuevo_estado = mapa.get(status, ESTADO_PAGO_RECHAZADO)

    db = SessionLocal()
    try:
        # 1. IDEMPOTENCIA: ¿ya procesamos este evento?
        evento_existente = (
            db.query(WebhookEvento)
            .filter(WebhookEvento.wompi_event_id == tx_id)
            .first()
        )
        if evento_existente:
            logger.info(f"Webhook {tx_id} ya procesado, ignorando")
            return {"ok": True, "mensaje": "Evento ya procesado"}

        # 2. Registrar el evento y COMMITEARLO INMEDIATAMENTE
        db.add(WebhookEvento(
            wompi_event_id=tx_id,
            evento=body.get("event"),
            referencia=referencia,
            payload=body,
        ))
        db.commit()

        # 3. Buscar el pago
        pago = db.query(Pago).filter(Pago.ref_wompi == referencia).first()
        if not pago:
            logger.warning(f"Webhook {tx_id}: pago con ref={referencia} no existe en BD")
            return {"ok": True, "mensaje": "Pago no encontrado en BD"}

        # 4. Guardar datos de Wompi
        pago.id_estado_pago = nuevo_estado
        pago.id_trans_wompi = tx.get("id")
        pago.wompi_payload = body
        pago.wompi_status = status
        pago.amount_in_cents = tx.get("amount_in_cents")
        pago.customer_email = tx.get("customer_email")
        pago.payment_method_type = (tx.get("payment_method_type") or "").upper() or None
        pago.fecha_actualizacion = datetime.now()

        pm = tx.get("payment_method") or {}
        if pago.payment_method_type == "CARD":
            extra = pm.get("extra") or {}
            pago.card_last_four = extra.get("last_four")
        elif pago.payment_method_type == "PSE":
            pago.bank_name = pm.get("extra", {}).get("bank_name") or pm.get("name")

        if tx.get("finalized_at"):
            try:
                pago.wompi_finalized_at = datetime.fromisoformat(
                    tx["finalized_at"].replace("Z", "+00:00")
                )
            except Exception:
                pass
        if body.get("sent_at"):
            try:
                pago.wompi_sent_at = datetime.fromisoformat(
                    body["sent_at"].replace("Z", "+00:00")
                )
            except Exception:
                pass

        # 5. Si aprobado: confirmar cita + crear factura
        codigos_nuevos = []
        if status == "APPROVED" and pago.id_cita:
            cita = db.query(Cita).filter(Cita.id_cita == pago.id_cita).first()
            if cita:
                cita.id_estado = ESTADO_CITA_CONFIRMADA
                pago.fecha_pago = datetime.now()

                factura_existente = (
                    db.query(Factura)
                    .filter(Factura.id_pago == pago.id_pago)
                    .first()
                )
                factura = factura_existente
                if not factura:
                    factura = _crear_factura(db, pago, cita)

                # Generar PDF y enviar por correo
                try:
                    if factura and factura.correo_cliente:
                        detalles = (
                            db.query(FacturaDetalle)
                            .filter(FacturaDetalle.id_factura == factura.id_factura)
                            .all()
                        )
                        pdf_bytes = generar_pdf_factura(factura, detalles)

                        concepto_principal = (
                            detalles[0].concepto if detalles else "Servicio de paseo"
                        )

                        enviar_factura_email(
                            destinatario=factura.correo_cliente,
                            nombre_cliente=factura.nombre_cliente or "Cliente",
                            num_factura=factura.num_factura,
                            total=float(factura.total),
                            pdf_bytes=pdf_bytes,
                            fecha_emision=factura.fecha_emision,
                            concepto=concepto_principal,
                        )
                except Exception as e:
                    logger.error(f"Error generando/enviando factura por correo: {e}")

                # Si la cita pertenece a una suscripción, confirmar TODAS las hermanas
                if cita.id_suscripcion:
                    citas_hermanas = (
                        db.query(Cita)
                        .filter(
                            Cita.id_suscripcion == cita.id_suscripcion,
                            Cita.id_estado == 1,  # pendientes
                        )
                        .all()
                    )
                    for ch in citas_hermanas:
                        ch.id_estado = ESTADO_CITA_CONFIRMADA

                # 6. Código de inicio para cada paseo confirmado
                confirmadas = [cita] + (citas_hermanas if cita.id_suscripcion else [])
                codigos_nuevos = asignar_codigos_paseo(db, confirmadas)

        db.commit()

        # 7. Enviar los códigos al cliente, ya guardados
        if codigos_nuevos:
            try:
                enviar_codigos_al_cliente(db, codigos_nuevos)
            except Exception as e:
                logger.error(f"Error enviando códigos de paseo por correo: {e}")

    except Exception as e:
        db.rollback()
        logger.error(f"Error procesando webhook: {e}")
        raise HTTPException(status_code=500, detail="Error interno")
    finally:
        db.close()

    return {"ok": True}
