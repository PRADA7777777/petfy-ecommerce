# backend/routers/paseos_router.py
import hmac
import math
from datetime import datetime, date, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session
from database import get_db
from models import Usuario, Cita, Mascota, Plan, CodigoPaseo, IntentoCodigo, EventoPaseo, UbicacionPaseo, NovedadPaseo
from schemas import IniciarPaseoRequest, PuntoGPSRequest, NovedadRequest, FinalizarPaseoRequest
from routers.auth_router import usuario_autenticado
from routers.citas_router import ESTADO_CITA_CONFIRMADA, ESTADO_CITA_EN_CURSO, ESTADO_CITA_COMPLETADA
from services.paginacion import paginar
from services.paseadores import es_paseador

router = APIRouter(prefix="/paseos", tags=["Paseos"])

ROL_ADMIN = 1
ROL_CLIENTE = 2

MAX_INTENTOS_CODIGO = 5
MINUTOS_BLOQUEO_CODIGO = 15

RADIO_TIERRA_KM = 6371

# La foto de la entrega se comparte por WhatsApp desde el celular del paseador
GUARDAR_FOTO_ENTREGA = False

EVENTO_LLEGADA = "LLEGADA"
EVENTO_INICIO  = "INICIO"
EVENTO_FIN     = "FIN"


# ═════════════════════════════════════════════════════════════
# HELPERS (sin decorador — NO son endpoints)
# ═════════════════════════════════════════════════════════════

def _cita_del_paseador(db: Session, id_cita: int, paseador: Usuario) -> Cita:
    # 1. Solo staff activo con el servicio de paseos
    if not es_paseador(paseador) or not paseador.activo:
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


def _validar_cita_en_curso(cita: Cita):
    if cita.id_estado != ESTADO_CITA_EN_CURSO:
        raise HTTPException(status_code=409, detail="El paseo no está en curso")


def _cita_visible(db: Session, id_cita: int, usuario: Usuario) -> Cita:
    # Pueden verla el paseador asignado, el dueño de la mascota y el administrador
    cita = db.query(Cita).filter(Cita.id_cita == id_cita).first()
    if not cita:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    if usuario.id_rol != ROL_ADMIN and usuario.id_usuario not in (
        cita.id_usuario_paseador, cita.id_usuario_cliente
    ):
        raise HTTPException(status_code=403, detail="No tienes acceso a esta cita")
    return cita


def _distancia_km(puntos: list) -> float:
    # Suma de la distancia entre puntos GPS consecutivos (fórmula de haversine)
    total = 0.0
    for a, b in zip(puntos, puntos[1:]):
        lat1, lng1, lat2, lng2 = map(math.radians, (float(a.latitud), float(a.longitud), float(b.latitud), float(b.longitud)))
        h = math.sin((lat2 - lat1) / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin((lng2 - lng1) / 2) ** 2
        total += 2 * RADIO_TIERRA_KM * math.asin(math.sqrt(h))
    return round(total, 2)


def _minutos(inicio: Optional[datetime], fin: Optional[datetime]) -> Optional[int]:
    if not inicio or not fin:
        return None
    return round((fin - inicio).total_seconds() / 60)


def _datos_punto(punto: UbicacionPaseo) -> dict:
    return {"lat": float(punto.latitud), "lng": float(punto.longitud), "fecha_hora": punto.fecha_hora}


def _puntos_de_cita(db: Session, id_cita: int) -> list:
    return db.query(UbicacionPaseo).filter(
        UbicacionPaseo.id_cita == id_cita
    ).order_by(UbicacionPaseo.fecha_hora.asc()).all()


def _novedades_de_cita(db: Session, id_cita: int) -> list:
    novedades = db.query(NovedadPaseo).filter(
        NovedadPaseo.id_cita == id_cita
    ).order_by(NovedadPaseo.fecha_hora.asc()).all()
    return [
        {"id_novedad": n.id_novedad, "texto": n.texto, "fecha_hora": n.fecha_hora}
        for n in novedades
    ]


def _fila_historial(cita: Cita, mascota: Mascota, paseador: Usuario, plan: Plan, puntos: list, total_novedades: int) -> dict:
    return {
        "id_cita": cita.id_cita,
        "fecha": cita.fecha,
        "hora": cita.hora.strftime("%H:%M") if cita.hora else None,
        "mascota": {"id_mascota": mascota.id_mascota, "nom_mascota": mascota.nom_mascota} if mascota else None,
        "paseador": {"id_usuario": paseador.id_usuario, "nombre": f"{paseador.nombre} {paseador.apellido}"} if paseador else None,
        "hora_inicio_real": cita.fecha_hora_real,
        "hora_fin_real": cita.fecha_fin_real,
        "duracion_real_min": _minutos(cita.fecha_hora_real, cita.fecha_fin_real),
        "duracion_plan_min": plan.duracion_minutos if plan else None,
        "distancia_km": _distancia_km(puntos),
        "novedades": total_novedades,
    }


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


@router.post("/{id_cita}/gps")
def enviar_punto_gps(
    id_cita: int,
    payload: PuntoGPSRequest,
    db: Session = Depends(get_db),
    paseador: Usuario = Depends(usuario_autenticado),
):
    # 1. Validar permisos y que el paseo esté en curso
    cita = _cita_del_paseador(db, id_cita, paseador)
    _validar_cita_en_curso(cita)

    # 2. Las mascotas que lleva al mismo tiempo están donde él está:
    #    el punto se guarda en todas sus citas en curso
    citas_en_curso = db.query(Cita).filter(
        Cita.id_usuario_paseador == paseador.id_usuario,
        Cita.id_estado == ESTADO_CITA_EN_CURSO,
    ).all()

    ahora = datetime.now()
    db.add_all([
        UbicacionPaseo(
            id_cita=c.id_cita,
            id_usuario=paseador.id_usuario,
            latitud=payload.lat,
            longitud=payload.lng,
            fecha_hora=ahora,
        )
        for c in citas_en_curso
    ])
    db.commit()

    return {"mensaje": "Punto registrado", "fecha_hora": ahora, "citas_actualizadas": len(citas_en_curso)}


@router.post("/{id_cita}/novedades")
def registrar_novedad(
    id_cita: int,
    payload: NovedadRequest,
    db: Session = Depends(get_db),
    paseador: Usuario = Depends(usuario_autenticado),
):
    # 1. Validar permisos y que el paseo esté en curso
    cita = _cita_del_paseador(db, id_cita, paseador)
    _validar_cita_en_curso(cita)

    # 2. No se aceptan novedades vacías
    texto = payload.texto.strip()
    if not texto:
        raise HTTPException(status_code=422, detail="La novedad no puede estar vacía")

    # 3. Guardar la novedad
    novedad = NovedadPaseo(
        id_cita=cita.id_cita,
        id_usuario=paseador.id_usuario,
        texto=texto,
        fecha_hora=datetime.now(),
    )
    db.add(novedad)
    db.commit()
    db.refresh(novedad)

    return {"id_novedad": novedad.id_novedad, "texto": novedad.texto, "fecha_hora": novedad.fecha_hora}


@router.get("/{id_cita}/novedades")
def listar_novedades(
    id_cita: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(usuario_autenticado),
):
    cita = _cita_visible(db, id_cita, usuario)
    return _novedades_de_cita(db, cita.id_cita)


@router.get("/{id_cita}/ruta")
def obtener_ruta(
    id_cita: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(usuario_autenticado),
):
    cita = _cita_visible(db, id_cita, usuario)
    paseador = db.query(Usuario).filter(Usuario.id_usuario == cita.id_usuario_paseador).first()
    mascota = db.query(Mascota).filter(Mascota.id_mascota == cita.id_mascota).first()
    puntos = _puntos_de_cita(db, cita.id_cita)

    return {
        "id_cita": cita.id_cita,
        "id_estado": cita.id_estado,
        "nombre_paseador": paseador.nombre if paseador else None,
        "nom_mascota": mascota.nom_mascota if mascota else None,
        "inicio": cita.fecha_hora_real,
        "fin": cita.fecha_fin_real,
        "puntos": [_datos_punto(p) for p in puntos],
    }


@router.post("/{id_cita}/finalizar")
def finalizar_paseo(
    id_cita: int,
    payload: FinalizarPaseoRequest,
    db: Session = Depends(get_db),
    paseador: Usuario = Depends(usuario_autenticado),
):
    # 1. Validar permisos y que el paseo esté en curso
    cita = _cita_del_paseador(db, id_cita, paseador)
    _validar_cita_en_curso(cita)

    # 2. Registrar la entrega
    ahora = datetime.now()
    db.add(EventoPaseo(
        id_cita=cita.id_cita,
        id_usuario=paseador.id_usuario,
        tipo_evento=EVENTO_FIN,
        fecha_hora=ahora,
        foto=payload.foto if GUARDAR_FOTO_ENTREGA else None,
    ))

    # 3. La novedad es opcional
    novedad = (payload.novedad or "").strip()
    if novedad:
        db.add(NovedadPaseo(
            id_cita=cita.id_cita,
            id_usuario=paseador.id_usuario,
            texto=novedad,
            fecha_hora=ahora,
        ))

    # 4. Terminar el paseo
    cita.id_estado = ESTADO_CITA_COMPLETADA
    cita.fecha_fin_real = ahora
    db.commit()

    return {"mensaje": "Paseo finalizado", "id_cita": cita.id_cita, "fecha_fin_real": ahora}


# ═════════════════════════════════════════════════════════════
# ENDPOINTS DEL DUEÑO
# ═════════════════════════════════════════════════════════════

@router.get("/{id_cita}/codigo")
def ver_codigo(
    id_cita: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(usuario_autenticado),
):
    # 1. Solo el dueño de la mascota (o el administrador); el paseador nunca lo ve
    cita = db.query(Cita).filter(Cita.id_cita == id_cita).first()
    if not cita:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    if usuario.id_rol != ROL_ADMIN and usuario.id_usuario != cita.id_usuario_cliente:
        raise HTTPException(status_code=403, detail="Solo el dueño de la mascota puede ver el código")

    # 2. El código existe desde que la cita se confirma
    codigo = db.query(CodigoPaseo).filter(CodigoPaseo.id_cita == cita.id_cita).first()
    if not codigo:
        raise HTTPException(status_code=404, detail="Esta cita todavía no tiene código")

    return {
        "id_cita": cita.id_cita,
        "fecha": cita.fecha,
        "codigo": codigo.codigo,
        "usado": codigo.fecha_uso is not None,
        "fecha_uso": codigo.fecha_uso,
    }


# ═════════════════════════════════════════════════════════════
# HISTORIAL DE PASEOS
# ═════════════════════════════════════════════════════════════

@router.get("/historial")
def historial_paseos(
    desde: Optional[date] = None,
    hasta: Optional[date] = None,
    id_paseador: Optional[int] = None,
    id_mascota: Optional[int] = None,
    page: int = 1,
    pageSize: int = 10,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(usuario_autenticado),
):
    # 1. Cada rol ve solo lo suyo; el administrador ve todo
    consulta = db.query(Cita).filter(Cita.id_estado == ESTADO_CITA_COMPLETADA)
    if usuario.id_rol == ROL_ADMIN:
        if id_paseador:
            consulta = consulta.filter(Cita.id_usuario_paseador == id_paseador)
    elif es_paseador(usuario):
        consulta = consulta.filter(Cita.id_usuario_paseador == usuario.id_usuario)
    elif usuario.id_rol == ROL_CLIENTE:
        consulta = consulta.filter(Cita.id_usuario_cliente == usuario.id_usuario)
    else:
        raise HTTPException(status_code=403, detail="No tienes acceso al historial de paseos")

    # 2. Filtros opcionales
    if desde and hasta and hasta < desde:
        raise HTTPException(status_code=400, detail="La fecha final no puede ser anterior a la inicial")
    if desde:
        consulta = consulta.filter(Cita.fecha >= desde)
    if hasta:
        consulta = consulta.filter(Cita.fecha <= hasta)
    if id_mascota:
        consulta = consulta.filter(Cita.id_mascota == id_mascota)

    # 3. Paginación, del más reciente al más antiguo
    pagina = paginar(consulta.order_by(Cita.fecha.desc(), Cita.hora.desc()), page, pageSize)
    citas = pagina["data"]

    # 4. Datos relacionados de la página en una sola consulta por tabla
    ids_citas = [c.id_cita for c in citas]
    mascotas = {m.id_mascota: m for m in db.query(Mascota).filter(Mascota.id_mascota.in_({c.id_mascota for c in citas})).all()}
    paseadores = {u.id_usuario: u for u in db.query(Usuario).filter(Usuario.id_usuario.in_({c.id_usuario_paseador for c in citas})).all()}
    planes = {p.id_plan: p for p in db.query(Plan).filter(Plan.id_plan.in_({c.id_plan for c in citas})).all()}
    novedades = dict(db.query(NovedadPaseo.id_cita, func.count()).filter(
        NovedadPaseo.id_cita.in_(ids_citas)
    ).group_by(NovedadPaseo.id_cita).all())
    puntos = {}
    for p in db.query(UbicacionPaseo).filter(UbicacionPaseo.id_cita.in_(ids_citas)).order_by(UbicacionPaseo.fecha_hora.asc()).all():
        puntos.setdefault(p.id_cita, []).append(p)

    pagina["data"] = [
        _fila_historial(
            c,
            mascotas.get(c.id_mascota),
            paseadores.get(c.id_usuario_paseador),
            planes.get(c.id_plan),
            puntos.get(c.id_cita, []),
            novedades.get(c.id_cita, 0),
        )
        for c in citas
    ]
    return pagina


@router.get("/{id_cita}/detalle")
def detalle_paseo(
    id_cita: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(usuario_autenticado),
):
    # 1. Pueden verlo el administrador, el paseador asignado y el dueño de la mascota
    cita = _cita_visible(db, id_cita, usuario)

    # 2. Datos del paseo, recorrido y novedades
    mascota = db.query(Mascota).filter(Mascota.id_mascota == cita.id_mascota).first()
    paseador = db.query(Usuario).filter(Usuario.id_usuario == cita.id_usuario_paseador).first()
    plan = db.query(Plan).filter(Plan.id_plan == cita.id_plan).first()
    puntos = _puntos_de_cita(db, cita.id_cita)
    novedades = _novedades_de_cita(db, cita.id_cita)

    return {
        "paseo": _fila_historial(cita, mascota, paseador, plan, puntos, len(novedades)),
        "puntos": [_datos_punto(p) for p in puntos],
        "novedades": novedades,
    }
