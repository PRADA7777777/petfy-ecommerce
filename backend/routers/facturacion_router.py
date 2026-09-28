# backend/routers/facturacion_router.py
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session
from database import get_db
from models import Factura, FacturaDetalle, Pago, Cita
from routers.mascotas_router import usuario_actual
from models import Usuario
from services.factura_pdf import generar_pdf_factura

router = APIRouter(prefix="/facturacion", tags=["Facturación"])


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