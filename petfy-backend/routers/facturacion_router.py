
# backend/routers/facturacion_router.py
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models import Factura, FacturaDetalle, Pago, Cita, Usuario
from routers.mascotas_router import usuario_actual
from services.factura_pdf import generar_pdf_factura
from services.wompi_service import crear_link_pago

router = APIRouter(prefix="/facturacion", tags=["Facturación"])


# ══════════════════════════════════════════════════════════
# FACTURAS (listar / detalle / PDF)
# ══════════════════════════════════════════════════════════

@router.get("")
def listar_mis_facturas(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(usuario_actual),
):
    """Lista las facturas del usuario autenticado."""
    facturas = (
        db.query(Factura)
        .join(Cita, Cita.id_cita == Factura.id_cita)
        .filter(Cita.id_usuario_cliente == usuario.id_usuario)
        .order_by(Factura.fecha_emision.desc())
        .all()
    )
    return [
        {
            "id_factura": f.id_factura,
            "num_factura": f.num_factura,
            "fecha_emision": f.fecha_emision.isoformat() if f.fecha_emision else None,
            "total": float(f.total),
            "moneda": f.moneda or "COP",
            "id_est_fact": f.id_est_fact,
            "id_cita": f.id_cita,
            "id_pago": f.id_pago,
        }
        for f in facturas
    ]


@router.get("/{id_factura}")
def detalle_factura(
    id_factura: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(usuario_actual),
):
    factura = (
        db.query(Factura)
        .join(Cita, Cita.id_cita == Factura.id_cita)
        .filter(Factura.id_factura == id_factura, Cita.id_usuario_cliente == usuario.id_usuario)
        .first()
    )
    if not factura:
        raise HTTPException(404, "Factura no encontrada")

    detalles = db.query(FacturaDetalle).filter(FacturaDetalle.id_factura == factura.id_factura).all()
    pago = db.query(Pago).filter(Pago.id_pago == factura.id_pago).first() if factura.id_pago else None

    return {
        "id_factura": factura.id_factura,
        "num_factura": factura.num_factura,
        "fecha_emision": factura.fecha_emision.isoformat() if factura.fecha_emision else None,
        "fecha_vencimiento": factura.fecha_vencimiento.isoformat() if factura.fecha_vencimiento else None,
        "moneda": factura.moneda,
        "plan_pago": factura.plan_pago,
        "nombre_cliente": factura.nombre_cliente,
        "documento_cliente": factura.documento_cliente,
        "correo_cliente": factura.correo_cliente,
        "direccion_cliente": factura.direccion_cliente,
        "telefono_cliente": factura.telefono_cliente,
        "sub_total": float(factura.sub_total),
        "iva": float(factura.iva),
        "total": float(factura.total),
        "observaciones": factura.observaciones,
        "cufe": factura.cufe,
        "id_est_fact": factura.id_est_fact,
        "detalles": [
            {
                "id": d.id_fact_detalle,
                "concepto": d.concepto,
                "cantidad": d.cantidad,
                "precio_uni": float(d.precio_uni),
                "iva": float(d.iva),
                "total_linea": float(d.total_linea),
            }
            for d in detalles
        ],
        "pago": {
            "id_pago": pago.id_pago,
            "id_trans_wompi": pago.id_trans_wompi,
            "ref_wompi": pago.ref_wompi,
            "payment_method_type": pago.payment_method_type,
            "card_last_four": pago.card_last_four,
            "bank_name": pago.bank_name,
            "wompi_status": pago.wompi_status,
            "wompi_finalized_at": pago.wompi_finalized_at.isoformat() if pago.wompi_finalized_at else None,
        } if pago else None,
    }


@router.get("/{id_factura}/pdf")
def descargar_pdf(
    id_factura: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(usuario_actual),
):
    factura = (
        db.query(Factura)
        .join(Cita, Cita.id_cita == Factura.id_cita)
        .filter(Factura.id_factura == id_factura, Cita.id_usuario_cliente == usuario.id_usuario)
        .first()
    )
    if not factura:
        raise HTTPException(404, "Factura no encontrada")

    detalles = db.query(FacturaDetalle).filter(FacturaDetalle.id_factura == factura.id_factura).all()
    pdf_bytes = generar_pdf_factura(factura, detalles)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{factura.num_factura}.pdf"'
        },
    )


# ══════════════════════════════════════════════════════════
# CREAR LINK DE PAGO WOMPI
# ══════════════════════════════════════════════════════════

class CrearPagoRequest(BaseModel):
    id_cita: int
    monto: int
    descripcion: str = "Pago de servicio Petfy"


def _generar_referencia_unica(db: Session, id_cita: int) -> str:
    """
    Genera una referencia ÚNICA e IRREPETIBLE para Wompi.
    Usa uuid4 (10^19 combinaciones) + verifica que no exista en BD.
    """
    for _ in range(10):  # hasta 10 intentos
        ref = f"PETFY-{id_cita}-{uuid.uuid4().hex[:16]}"
        existe = db.query(Pago).filter(Pago.ref_wompi == ref).first()
        if not existe:
            return ref
    # Fallback extremo (no debería pasar nunca)
    return f"PETFY-{id_cita}-{uuid.uuid4().hex}"


@router.post("/pagos/crear")
def crear_pago(
    data: CrearPagoRequest,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(usuario_actual),
):
    """Crea un registro de Pago pendiente y devuelve la URL de Wompi."""
    cita = (
        db.query(Cita)
        .filter(Cita.id_cita == data.id_cita, Cita.id_usuario_cliente == usuario.id_usuario)
        .first()
    )
    if not cita:
        raise HTTPException(404, "Cita no encontrada")

    pago_existente = (
        db.query(Pago)
        .filter(Pago.id_cita == cita.id_cita)
        .order_by(Pago.id_pago.desc())
        .first()
    )
    if pago_existente and pago_existente.id_estado_pago == 2:
        raise HTTPException(400, "Esta cita ya está pagada")

    # ✅ Referencia ÚNICA garantizada (uuid4 + verificación en BD)
    referencia = _generar_referencia_unica(db, cita.id_cita)
    print(f"[WOMPI] Nueva referencia generada: {referencia}")

    pago = Pago(
        monto=data.monto,
        ref_wompi=referencia,
        id_estado_pago=1,
        id_cita=cita.id_cita,
        customer_email=usuario.correo,
    )
    db.add(pago)
    db.commit()
    db.refresh(pago)

    resultado = crear_link_pago(
        referencia=referencia,
        monto=data.monto,
        descripcion=data.descripcion,
        email_cliente=usuario.correo,
        nombre_cliente=f"{usuario.nombre} {usuario.apellido}",
        telefono_cliente=usuario.telefono or "",
        id_cita=cita.id_cita,
    )

    return {
        "url_pago": resultado["url"],
        "referencia": referencia,
        "id_pago": pago.id_pago,
        "monto": data.monto,
    }