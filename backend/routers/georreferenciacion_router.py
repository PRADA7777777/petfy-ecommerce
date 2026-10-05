# backend/routers/georreferenciacion_router.py
import secrets
from datetime import date
from typing import Literal, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from database import get_db
from models import Cita, Mascota, Usuario
from models_georref import EventoPaseo, IdentificadorMascota
from routers.mascotas_router import usuario_actual

router = APIRouter(prefix="/georreferenciacion", tags=["Georreferenciación"])

ID_ROL_ADMINISTRADOR = 1
ID_ROL_PASEADOR = 3

# Estados de cita (catálogo petfy_db.estados_citas)
ID_ESTADO_CONFIRMADA = 2
ID_ESTADO_EN_CURSO = 3
ID_ESTADO_COMPLETADA = 4


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


@router.get("/mascotas/{id_mascota}/codigo")
def obtener_codigo(
    id_mascota: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(usuario_actual),
):
    """Devuelve el código activo de la mascota SIN cambiarlo (para mostrar
    o imprimir el QR). Si aún no tiene código, codigo = null."""
    mascota = _mascota_autorizada(id_mascota, usuario, db)
    activo = db.query(IdentificadorMascota).filter(
        IdentificadorMascota.id_mascota == mascota.id_mascota,
        IdentificadorMascota.fecha_anulacion.is_(None),
    ).first()
    return {
        "id_mascota": mascota.id_mascota,
        "nom_mascota": mascota.nom_mascota,
        "codigo": activo.codigo if activo else None,
        "fecha_creacion": activo.fecha_creacion if activo else None,
    }


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
        "nom_mascota": mascota.nom_mascota,
        "codigo": nuevo.codigo,
        "fecha_creacion": nuevo.fecha_creacion,
    }


# ─────────────────────────────────────────────────────────────
# PUNTOS DE INTEGRACIÓN (roles y asignación de paseadores)
# Por ahora, el rol de paseador y la asignación del paseador a cada
# cita se configuran a mano en la base de datos, hasta que se integren
# los roles y sus vistas (administrador y paseador). Este módulo no crea
# paseadores ni asigna citas: solo lee esos datos. Cuando esa
# integración exista, solo se ajustan estas dos funciones.
# ─────────────────────────────────────────────────────────────

def es_personal_de_paseo(usuario: Usuario) -> bool:
    """Quién puede registrar recogidas y entregas.
    Por ahora: rol Paseador (id_rol = 3) o Administrador.
    Se ajusta cuando se integren los roles y cargos en las vistas."""
    return usuario.id_rol in (ID_ROL_PASEADOR, ID_ROL_ADMINISTRADOR)


def puede_escanear(usuario: Usuario, cita: Cita) -> bool:
    """Si el usuario es el paseador de esta cita.
    Por ahora: compara con citas.id_usuario_paseador (asignado a mano).
    Se ajusta cuando se integre la asignación de paseadores en las vistas."""
    return cita.id_usuario_paseador == usuario.id_usuario


def _resolver_escaneo(codigo: str, usuario: Usuario, db: Session):
    """Validaciones compartidas por la consulta y la confirmación del escaneo.
    Devuelve (identificador, cita, mascota, accion)."""
    # 1. Solo paseadores o administradores
    if not es_personal_de_paseo(usuario):
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
    return identificador, cita, mascota, accion


@router.get("/escaneo/{codigo}")
def resolver_escaneo(
    codigo: str,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(usuario_actual),
):
    """Consulta qué acción corresponde al escanear un código.
    Solo lectura: no registra nada (eso lo hace la confirmación)."""
    _, cita, mascota, accion = _resolver_escaneo(codigo, usuario, db)
    # Datos del dueño para el aviso por WhatsApp (solo los recibe el paseador
    # ya validado como asignado a esta cita)
    dueno = db.query(Usuario).filter(Usuario.id_usuario == cita.id_usuario_cliente).first()
    return {
        "accion": accion,
        "id_cita": cita.id_cita,
        "id_mascota": cita.id_mascota,
        "nom_mascota": mascota.nom_mascota if mascota else None,
        "hora_agendada": cita.hora.strftime("%H:%M") if cita.hora else None,
        "hora_recogida": cita.fecha_hora_real.strftime("%H:%M") if cita.fecha_hora_real else None,
        "direccion": cita.direccion,
        "nombre_dueno": dueno.nombre if dueno else None,
        "telefono_dueno": dueno.telefono if dueno else None,
    }


class ConfirmarEscaneoRequest(BaseModel):
    metodo_lectura: Literal["QR", "NFC", "MANUAL"] = "QR"
    latitud: Optional[float] = Field(None, ge=-90, le=90)
    longitud: Optional[float] = Field(None, ge=-180, le=180)


@router.post("/escaneo/{codigo}/confirmar")
def confirmar_escaneo(
    codigo: str,
    payload: ConfirmarEscaneoRequest,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(usuario_actual),
):
    """Registra la recogida o la entrega y avanza el estado de la cita:
    Confirmada -> En Curso (recogida) -> Completada (entrega)."""
    identificador, cita, mascota, accion = _resolver_escaneo(codigo, usuario, db)

    try:
        evento = EventoPaseo(
            id_cita=cita.id_cita,
            id_identificador=identificador.id_identificador,
            id_usuario=usuario.id_usuario,
            tipo_evento=accion.upper(),
            metodo_lectura=payload.metodo_lectura,
            latitud=payload.latitud,
            longitud=payload.longitud,
        )
        db.add(evento)

        if accion == "recogida":
            cita.id_estado = ID_ESTADO_EN_CURSO
            cita.fecha_hora_real = func.now()
        else:
            cita.id_estado = ID_ESTADO_COMPLETADA
            cita.fecha_fin_real = func.now()

        db.commit()  # evento + cambio de estado en la misma transacción
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Este evento ya fue registrado")

    db.refresh(evento)
    return {
        "accion": accion,
        "id_evento": evento.id_evento,
        "id_cita": cita.id_cita,
        "nom_mascota": mascota.nom_mascota if mascota else None,
        "fecha_hora_evento": evento.fecha_hora,
    }
