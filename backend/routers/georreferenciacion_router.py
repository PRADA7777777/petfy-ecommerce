# backend/routers/georreferenciacion_router.py
import secrets
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from database import get_db
from models import Mascota, Usuario
from models_georref import IdentificadorMascota
from routers.mascotas_router import usuario_actual

router = APIRouter(prefix="/georreferenciacion", tags=["Georreferenciación"])

ID_ROL_ADMINISTRADOR = 1


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
