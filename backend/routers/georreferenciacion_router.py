# backend/routers/georreferenciacion_router.py
import secrets
from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from database import get_db
from models import Cita, Mascota, Usuario
from models_georref import IdentificadorMascota
from routers.mascotas_router import usuario_actual

router = APIRouter(prefix="/georreferenciacion", tags=["Georreferenciación"])

ID_ROL_ADMINISTRADOR = 1
ID_ROL_PASEADOR = 3

# Estados de cita (catálogo petfy_db.estados_citas)
ID_ESTADO_CONFIRMADA = 2
ID_ESTADO_EN_CURSO = 3


def _mascota_autorizada(id_mascota: int, usuario: Usuario, db: Session) -> Mascota:
    """Devuelve la mascota si el usuario es su dueño o es administrador.
    Responde 404 en cualquier otro caso (no revela si la mascota existe)."""
    consulta = db.query(Mascota).filter(Mascota.id_mascota == id_mascota)
    if usuario.id_rol != ID_ROL_ADMINISTRADOR:
        consulta = consulta.filter(Mascota.id_usuario == usuario.id_usuario)
    mascota = consulta.first()
    if not mascota:
        raise HTTPException(status_code=404, detail="Mascota no encontrada")
    return mascota


@router.post("/mascotas/{id_mascota}/codigo")
def generar_codigo(
    id_mascota: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(usuario_actual),
):
    # 0. Validar dueño o administrador
    mascota = _mascota_autorizada(id_mascota, usuario, db)

    try:
        # 1. Anular el código activo, si existe
        db.query(IdentificadorMascota).filter(
            IdentificadorMascota.id_mascota == mascota.id_mascota,
            IdentificadorMascota.fecha_anulacion.is_(None),
        ).update(
            {IdentificadorMascota.fecha_anulacion: func.now()},
            synchronize_session=False,
        )

        # 2 y 3. Generar el código nuevo e insertarlo
        nuevo = IdentificadorMascota(
            id_mascota=mascota.id_mascota,
            codigo=secrets.token_urlsafe(16),
        )
        db.add(nuevo)

        # Todo se confirma junto (transacción)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="No se pudo generar el código, intenta de nuevo")

    db.refresh(nuevo)
    return {
        "id_mascota": mascota.id_mascota,
        "codigo": nuevo.codigo,
        "fecha_creacion": nuevo.fecha_creacion,
    }


def puede_escanear(usuario: Usuario, cita: Cita) -> bool:
    # PUNTO DE INTEGRACIÓN — asignación de paseador
    # Supuesto actual: la cita ya trae id_usuario_paseador asignado.
    # Este módulo NO asigna paseadores; solo lee el campo.
    # Cuando exista el flujo de asignación, solo se ajusta esta función.
    return cita.id_usuario_paseador == usuario.id_usuario


@router.get("/escaneo/{codigo}")
def resolver_escaneo(
    codigo: str,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(usuario_actual),
):
    """Consulta qué acción corresponde al escanear un código.
    Solo lectura: no registra nada (eso lo hace la confirmación)."""
    # 1. Solo paseadores o administradores
    if usuario.id_rol not in (ID_ROL_PASEADOR, ID_ROL_ADMINISTRADOR):
        raise HTTPException(status_code=403, detail="No tienes permiso para registrar paseos")

    # 2. El código debe existir y estar activo
    identificador = db.query(IdentificadorMascota).filter(
        IdentificadorMascota.codigo == codigo,
        IdentificadorMascota.fecha_anulacion.is_(None),
    ).first()
    if not identificador:
        raise HTTPException(status_code=404, detail="Código no válido")

    # 3. Citas de hoy de esa mascota, confirmadas o en curso
    #    (primero las "En Curso": si hay un paseo abierto, toca entregarlo)
    citas_hoy = db.query(Cita).filter(
        Cita.id_mascota == identificador.id_mascota,
        Cita.fecha == date.today(),
        Cita.id_estado.in_([ID_ESTADO_CONFIRMADA, ID_ESTADO_EN_CURSO]),
    ).order_by(Cita.id_estado.desc(), Cita.hora.asc()).all()

    cita = next((c for c in citas_hoy if puede_escanear(usuario, c)), None)
    if not cita:
        raise HTTPException(status_code=404, detail="No tienes un paseo asignado hoy para esta mascota")

    # 4. Recogida o entrega según el estado
    mascota = db.query(Mascota).filter(Mascota.id_mascota == cita.id_mascota).first()
    accion = "entrega" if cita.id_estado == ID_ESTADO_EN_CURSO else "recogida"

    return {
        "accion": accion,
        "id_cita": cita.id_cita,
        "id_mascota": cita.id_mascota,
        "nom_mascota": mascota.nom_mascota if mascota else None,
        "hora": cita.hora.strftime("%H:%M") if cita.hora else None,
        "direccion": cita.direccion,
    }
