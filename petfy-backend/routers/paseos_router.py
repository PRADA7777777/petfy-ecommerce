# backend/routers/paseos_router.py
import hmac
from datetime import datetime, date, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Usuario, Cita, CodigoPaseo, IntentoCodigo, EventoPaseo
from schemas import IniciarPaseoRequest
from routers.auth_router import usuario_autenticado
from routers.citas_router import ESTADO_CITA_CONFIRMADA, ESTADO_CITA_EN_CURSO

router = APIRouter(prefix="/paseos", tags=["Paseos"])

ROL_STAFF = 3
SERVICIO_PASEOS = "paseos"

MAX_INTENTOS_CODIGO = 5
MINUTOS_BLOQUEO_CODIGO = 15

EVENTO_LLEGADA = "LLEGADA"
EVENTO_INICIO  = "INICIO"


# ═════════════════════════════════════════════════════════════
# HELPERS (sin decorador — NO son endpoints)
# ═════════════════════════════════════════════════════════════

def _es_paseador(usuario: Usuario) -> bool:
    return usuario.id_rol == ROL_STAFF and any(
        servicio.nombre == SERVICIO_PASEOS for servicio in usuario.servicios
    )


def _cita_del_paseador(db: Session, id_cita: int, paseador: Usuario) -> Cita:
    # 1. Solo staff activo con el servicio de paseos
    if not _es_paseador(paseador) or not paseador.activo:
        raise HTTPException(status_code=403, detail="Solo paseadores activos")

    # 2. La cita debe existir y estar asignada a este paseador
    cita = db.query(Cita).filter(Cita.id_cita == id_cita).first()
    if not cita:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    if cita.id_usuario_paseador != paseador.id_usuario:
        raise HTTPException(status_code=403, detail="Esta cita no está asignada a ti")
    return cita


def _validar_cita_de_hoy_confirmada(cita: Cita):
    if cita.id_estado != ESTADO_CITA_CONFIRMADA:
        raise HTTPException(status_code=409, detail="La cita no está confirmada")
    if cita.fecha != date.today():
        raise HTTPException(status_code=409, detail="La cita no es para hoy")


def _evento_registrado(db: Session, id_cita: int, tipo_evento: str) -> bool:
    return db.query(EventoPaseo).filter(
        EventoPaseo.id_cita == id_cita,
        EventoPaseo.tipo_evento == tipo_evento,
    ).first() is not None


# ═════════════════════════════════════════════════════════════
# ENDPOINTS DEL PASEADOR
# ═════════════════════════════════════════════════════════════

@router.post("/{id_cita}/llegada")
def marcar_llegada(
    id_cita: int,
    db: Session = Depends(get_db),
    paseador: Usuario = Depends(usuario_autenticado),
):
    # 1. Validar permisos y estado de la cita
    cita = _cita_del_paseador(db, id_cita, paseador)
    _validar_cita_de_hoy_confirmada(cita)

    # 2. Una sola llegada por cita
    if _evento_registrado(db, cita.id_cita, EVENTO_LLEGADA):
        raise HTTPException(status_code=409, detail="La llegada ya fue registrada")

    # 3. Registrar la llegada
    ahora = datetime.now()
    db.add(EventoPaseo(
        id_cita=cita.id_cita,
        id_usuario=paseador.id_usuario,
        tipo_evento=EVENTO_LLEGADA,
        fecha_hora=ahora,
    ))
    db.commit()

    return {"mensaje": "Llegada registrada", "id_cita": cita.id_cita, "fecha_hora": ahora}


@router.post("/{id_cita}/iniciar")
def iniciar_paseo(
    id_cita: int,
    payload: IniciarPaseoRequest,
    db: Session = Depends(get_db),
    paseador: Usuario = Depends(usuario_autenticado),
):
    # 1. Validar permisos, estado de la cita y que ya llegó
    cita = _cita_del_paseador(db, id_cita, paseador)
    _validar_cita_de_hoy_confirmada(cita)
    if not _evento_registrado(db, cita.id_cita, EVENTO_LLEGADA):
        raise HTTPException(status_code=409, detail="Primero marca la llegada")

    # 2. Bloqueo por intentos fallidos (se revisa antes de mirar el código)
    ahora = datetime.now()
    fallidos = db.query(IntentoCodigo).filter(
        IntentoCodigo.id_cita == cita.id_cita,
        IntentoCodigo.id_usuario == paseador.id_usuario,
        IntentoCodigo.exitoso == False,
        IntentoCodigo.fecha_hora >= ahora - timedelta(minutes=MINUTOS_BLOQUEO_CODIGO),
    ).order_by(IntentoCodigo.fecha_hora.desc()).all()

    if len(fallidos) >= MAX_INTENTOS_CODIGO:
        desbloqueo = fallidos[MAX_INTENTOS_CODIGO - 1].fecha_hora + timedelta(minutes=MINUTOS_BLOQUEO_CODIGO)
        segundos = max(1, int((desbloqueo - ahora).total_seconds()))
        raise HTTPException(
            status_code=429,
            detail="Demasiados intentos fallidos. Intenta de nuevo más tarde",
            headers={"Retry-After": str(segundos)},
        )

    # 3. Validar el código
    codigo = db.query(CodigoPaseo).filter(CodigoPaseo.id_cita == cita.id_cita).first()
    if not codigo:
        raise HTTPException(status_code=409, detail="La cita no tiene código asignado")

    correcto = hmac.compare_digest(codigo.codigo, payload.codigo)
    db.add(IntentoCodigo(
        id_cita=cita.id_cita,
        id_usuario=paseador.id_usuario,
        exitoso=correcto,
        fecha_hora=ahora,
    ))

    if not correcto:
        db.commit()
        restantes = MAX_INTENTOS_CODIGO - (len(fallidos) + 1)
        if restantes == 0:
            raise HTTPException(
                status_code=429,
                detail=f"Código incorrecto. Bloqueado por {MINUTOS_BLOQUEO_CODIGO} minutos",
                headers={"Retry-After": str(MINUTOS_BLOQUEO_CODIGO * 60)},
            )
        aviso = "Te queda 1 intento" if restantes == 1 else f"Te quedan {restantes} intentos"
        raise HTTPException(status_code=400, detail=f"Código incorrecto. {aviso}")

    # 4. Arrancar el paseo
    codigo.fecha_uso = ahora
    codigo.id_usuario_valida = paseador.id_usuario
    cita.id_estado = ESTADO_CITA_EN_CURSO
    cita.fecha_hora_real = ahora
    db.add(EventoPaseo(
        id_cita=cita.id_cita,
        id_usuario=paseador.id_usuario,
        tipo_evento=EVENTO_INICIO,
        fecha_hora=ahora,
    ))
    db.commit()

    return {"mensaje": "Paseo iniciado", "id_cita": cita.id_cita, "fecha_hora_real": ahora}
