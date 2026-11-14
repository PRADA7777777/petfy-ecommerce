# backend/services/paseadores.py
from sqlalchemy import and_
from sqlalchemy.orm import Session, Query
from models import Usuario, Servicio, Cita, Plan

ROL_STAFF = 3
SERVICIO_PASEOS = "paseos"


def es_paseador(usuario: Usuario) -> bool:
    """Un paseador es un empleado (staff) con el servicio de paseos asignado."""
    return usuario.id_rol == ROL_STAFF and any(
        servicio.nombre == SERVICIO_PASEOS for servicio in usuario.servicios
    )


def filtro_paseadores():
    """La misma regla de es_paseador, para usarla dentro de una consulta."""
    return and_(
        Usuario.id_rol == ROL_STAFF,
        Usuario.servicios.any(Servicio.nombre == SERVICIO_PASEOS),
    )


def consulta_citas_de_paseo(db: Session) -> Query:
    """Citas cuyo plan pertenece al servicio de paseos."""
    return db.query(Cita).join(Plan, Plan.id_plan == Cita.id_plan).join(
        Servicio, Servicio.id_servicio == Plan.id_servicio
    ).filter(Servicio.nombre == SERVICIO_PASEOS)
