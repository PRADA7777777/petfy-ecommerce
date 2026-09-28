# backend/routers/webhooks_router.py
import os
import hashlib
from datetime import datetime, timedelta
from fastapi import APIRouter, Request, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session
from database import SessionLocal
from models import (
    Pago, Cita, Factura, FacturaDetalle,
    Usuario, DocIdentidad, Plan, Suscripcion,
)

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])

ESTADO_CITA_CONFIRMADA      = 2
ESTADO_PAGO_APROBADO        = 2
ESTADO_PAGO_RECHAZADO       = 3
ESTADO_PAGO_REEMBOLSADO     = 4
ESTADO_FACTURA_EMITIDA      = 1
ESTADO_FACTURA_PAGADA       = 2

IVA_PORCENTAJE = float(os.getenv("IVA_PORCENTAJE", "0"))  # 0 por defecto


def _get_by_path(obj, path):
    for k in path.split("."):
        if not isinstance(obj, dict):
            return None
        obj = obj.get(k)
    return obj


def _firma_valida(body: dict) -> bool:
    sig = body.get("signature") or {}
    props = sig.get("properties")
    if not props:
        return False
    valores = [_get_by_path(body.get("data", {}), p) for p in props]
    cadena = (
        "".join(str(v) for v in valores)
        + str(body.get("timestamp"))
        + os.getenv("WOMPI_EVENTS_SECRET", "")
    )
    esperado = hashlib.sha256(cadena.encode()).hexdigest()
    return esperado == sig.get("checksum")


def _generar_num_factura(db: Session) -> str:
    """Formato: PETFY-YYYY-000001"""
    year = datetime.now().year
    db.execute(text("SELECT nextval('petfy_db.factura_consecutivo_seq')"))
    consecutivo = db.execute(
        text("SELECT currval('petfy_db.factura_consecutivo_seq')")
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

    # Observaciones: si la cita pertenece a una suscripción, mostramos vigencia
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
            f"Vigencia {susc.fecha_inicio.strftime('%d/%m/%Y')} – "
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

    if not _firma_valida(body):
        raise HTTPException(status_code=400, detail="Firma inválida")

    tx = body["data"]["transaction"]
    referencia = tx["reference"]
    status = tx["status"]

    mapa = {
        "APPROVED": ESTADO_PAGO_APROBADO,
        "DECLINED": ESTADO_PAGO_RECHAZADO,
        "VOIDED": ESTADO_PAGO_REEMBOLSADO,
        "ERROR": ESTADO_PAGO_RECHAZADO,
    }
    nuevo_estado = mapa.get(status, ESTADO_PAGO_RECHAZADO)

    db = SessionLocal()
    try:
        pago = db.query(Pago).filter(Pago.ref_wompi == referencia).first()
        if not pago:
            return {"ok": True}

        # ── Guardar TODOS los datos de Wompi ──
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

        # ── Si aprobado: confirmar cita + crear factura ──
        if status == "APPROVED" and pago.id_cita:
            cita = db.query(Cita).filter(Cita.id_cita == pago.id_cita).first()
            if cita:
                cita.id_estado = ESTADO_CITA_CONFIRMADA
                pago.fecha_pago = datetime.now()

                # Crear factura solo si no existe
                factura_existente = (
                    db.query(Factura)
                    .filter(Factura.id_pago == pago.id_pago)
                    .first()
                )
                if not factura_existente:
                    _crear_factura(db, pago, cita)

                # Si la cita pertenece a una suscripción, confirmar TODAS
                # las citas de esa suscripción que estén pendientes
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

        db.commit()
    finally:
        db.close()

    return {"ok": True}