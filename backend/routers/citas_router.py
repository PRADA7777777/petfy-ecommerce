# backend/routers/citas_router.py
import os
import hashlib
from datetime import datetime, date as _date, time as _time, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from models import (
    Plan, Cita, Pago, Usuario, Mascota,
    DisponibilidadServicio, ExcepcionDisponibilidad,
    EstadoCita, Suscripcion,
)
from schemas import (
    CitaRequest, CitaResponse, ReprogramarRequest,
    DisponibilidadDiaOut, SlotHora, CambiarRutinaRequest,
    CambiarDiaRequest
)
from routers.mascotas_router import usuario_actual

router = APIRouter(prefix="/citas", tags=["Citas"])

DIAS_LABEL = {
    0: "Domingo", 1: "Lunes", 2: "Martes", 3: "Miércoles",
    4: "Jueves", 5: "Viernes", 6: "Sábado",
}

MAPA_DIAS_ABREV_A_IDX = {
    "Lun": 0, "Mar": 1, "Mié": 2, "Mie": 2,
    "Jue": 3, "Vie": 4, "Sáb": 5, "Sab": 5, "Dom": 6,
}

ESTADO_CITA_PENDIENTE   = 1
ESTADO_CITA_CONFIRMADA  = 2
ESTADO_CITA_EN_CURSO    = 3
ESTADO_CITA_COMPLETADA  = 4
ESTADO_CITA_CANCELADA   = 5

ESTADO_PAGO_PENDIENTE   = 1
ESTADO_PAGO_APROBADO    = 2
ESTADO_PAGO_RECHAZADO   = 3

DIAS_SUSCRIPCION = 30
CAPACIDAD_POR_HORA = int(os.getenv("CAPACIDAD_POR_HORA", "3"))


# ═════════════════════════════════════════════════════════════
# HELPERS (sin decorador — NO son endpoints)
# ═════════════════════════════════════════════════════════════

def firma_integridad_wompi(referencia: str, monto_centavos: int) -> str:
    secret = os.getenv("WOMPI_INTEGRITY_SECRET", "")
    cadena = f"{referencia}{monto_centavos}COP{secret}"
    return hashlib.sha256(cadena.encode()).hexdigest()


def _mascota_tiene_paseo_prueba_usado(db: Session, id_mascota: int) -> bool:
    return (
        db.query(Cita)
        .filter(
            Cita.id_mascota == id_mascota,
            Cita.es_paseo_prueba == True,
            Cita.id_estado != ESTADO_CITA_CANCELADA,
        )
        .first()
        is not None
    )


def _validar_disponibilidad(
    db: Session, id_servicio: int, fecha: _date, hora: _time,
) -> None:
    exc = (
        db.query(ExcepcionDisponibilidad)
        .filter(
            ExcepcionDisponibilidad.id_servicio == id_servicio,
            ExcepcionDisponibilidad.fecha == fecha,
        )
        .first()
    )
    if exc and not exc.es_laborable:
        motivo = f" ({exc.motivo})" if exc.motivo else ""
        raise HTTPException(
            400,
            f"No hay servicio el {fecha.isoformat()}{motivo}: día no laborable.",
        )

    iso_dia = (fecha.weekday() + 1) % 7
    disp = (
        db.query(DisponibilidadServicio)
        .filter(
            DisponibilidadServicio.id_servicio == id_servicio,
            DisponibilidadServicio.dia_semana == iso_dia,
            DisponibilidadServicio.activo == True,
        )
        .first()
    )
    if not disp:
        raise HTTPException(400, f"El servicio no opera los {DIAS_LABEL[iso_dia]}.")

    hora_inicio = exc.hora_inicio if (exc and exc.es_laborable and exc.hora_inicio) else disp.hora_inicio
    hora_fin    = exc.hora_fin    if (exc and exc.es_laborable and exc.hora_fin)    else disp.hora_fin

    if hora < hora_inicio or hora >= hora_fin:
        raise HTTPException(
            400,
            f"La hora debe estar entre {hora_inicio.strftime('%H:%M')} "
            f"y {hora_fin.strftime('%H:%M')}.",
        )


def _plan_ids_del_servicio(db: Session, id_servicio: int) -> list[int]:
    return [p.id_plan for p in db.query(Plan.id_plan).filter(Plan.id_servicio == id_servicio).all()]


def _contar_ocupados(db: Session, id_servicio: int, fecha: _date, hora: _time) -> int:
    plan_ids = _plan_ids_del_servicio(db, id_servicio)
    if not plan_ids:
        return 0
    return (
        db.query(Cita)
        .filter(
            Cita.fecha == fecha,
            Cita.hora == hora,
            Cita.id_estado != ESTADO_CITA_CANCELADA,
            Cita.id_plan.in_(plan_ids),
        )
        .count()
    )

def _generar_fechas_rutina(
    desde: _date, hasta: _date, dias_idx: set[int]
) -> list[_date]:
    """Lista de fechas entre desde y hasta (inclusive) que caen en los días dados."""
    out: list[_date] = []
    cur = desde
    while cur <= hasta:
        if cur.weekday() in dias_idx:
            out.append(cur)
        cur += timedelta(days=1)
    return out

def _disponibilidad_dia_helper(
    db: Session, plan: Plan, fecha_dt: _date
) -> DisponibilidadDiaOut:
    """Lógica compartida entre /disponibilidad y /disponibilidad-rango."""
    exc = (
        db.query(ExcepcionDisponibilidad)
        .filter(
            ExcepcionDisponibilidad.id_servicio == plan.id_servicio,
            ExcepcionDisponibilidad.fecha == fecha_dt,
        )
        .first()
    )
    if exc and not exc.es_laborable:
        return DisponibilidadDiaOut(
            fecha=fecha_dt.isoformat(),
            laborable=False,
            motivo=exc.motivo or "Día no laborable",
            slots=[],
        )

    iso_dia = (fecha_dt.weekday() + 1) % 7
    disp = (
        db.query(DisponibilidadServicio)
        .filter(
            DisponibilidadServicio.id_servicio == plan.id_servicio,
            DisponibilidadServicio.dia_semana == iso_dia,
            DisponibilidadServicio.activo == True,
        )
        .first()
    )
    if not disp:
        return DisponibilidadDiaOut(
            fecha=fecha_dt.isoformat(),
            laborable=False,
            motivo=f"No opera los {DIAS_LABEL[iso_dia]}",
            slots=[],
        )

    hora_ini = exc.hora_inicio if (exc and exc.es_laborable and exc.hora_inicio) else disp.hora_inicio
    hora_fin = exc.hora_fin if (exc and exc.es_laborable and exc.hora_fin) else disp.hora_fin

    slots: list[SlotHora] = []
    h = hora_ini.hour
    while h < hora_fin.hour:
        hora_slot = _time(h, 0)
        ocupados = _contar_ocupados(db, plan.id_servicio, fecha_dt, hora_slot)
        slots.append(
            SlotHora(
                hora=f"{h:02d}:00",
                ocupados=ocupados,
                capacidad=CAPACIDAD_POR_HORA,
                disponible=ocupados < CAPACIDAD_POR_HORA,
            )
        )
        h += 1

    return DisponibilidadDiaOut(fecha=fecha_dt.isoformat(), laborable=True, slots=slots)

def _dias_rutina_idx(dias_semana: str | None) -> set[int]:
    if not dias_semana:
        return set()
    return {
        MAPA_DIAS_ABREV_A_IDX[d.strip()]
        for d in dias_semana.split(",")
        if d.strip() in MAPA_DIAS_ABREV_A_IDX
    }


# ═════════════════════════════════════════════════════════════
# ENDPOINTS
# ═════════════════════════════════════════════════════════════

# ── Paseo de prueba ─────────────────────────────────────────
@router.get("/mascotas/{id_mascota}/paseo-prueba-disponible")
def paseo_prueba_disponible(
    id_mascota: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(usuario_actual),
):
    mascota = (
        db.query(Mascota)
        .filter(
            Mascota.id_mascota == id_mascota,
            Mascota.id_usuario == usuario.id_usuario,
        )
        .first()
    )
    if not mascota:
        raise HTTPException(404, "Mascota no encontrada")

    cita_prueba = (
        db.query(Cita)
        .filter(
            Cita.id_mascota == id_mascota,
            Cita.es_paseo_prueba == True,
            Cita.id_estado != ESTADO_CITA_CANCELADA,
        )
        .order_by(Cita.id_cita.desc())
        .first()
    )

    return {
        "disponible": cita_prueba is None,
        "id_cita_prueba": cita_prueba.id_cita if cita_prueba else None,
        "id_estado_prueba": cita_prueba.id_estado if cita_prueba else None,
    }


# ── Disponibilidad de un día ────────────────────────────────
@router.get("/disponibilidad", response_model=DisponibilidadDiaOut)
def disponibilidad_dia(
    fecha: str = Query(...),
    id_plan: int = Query(...),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(usuario_actual),
):
    plan = db.query(Plan).filter(Plan.id_plan == id_plan, Plan.activo == True).first()
    if not plan:
        raise HTTPException(404, "Plan no encontrado")
    try:
        fecha_dt = _date.fromisoformat(fecha)
    except ValueError:
        raise HTTPException(400, "Formato de fecha inválido")
    return _disponibilidad_dia_helper(db, plan, fecha_dt)


# ── Disponibilidad de un rango ──────────────────────────────
@router.get("/disponibilidad-rango")
def disponibilidad_rango(
    desde: str = Query(...),
    hasta: str = Query(...),
    id_plan: int = Query(...),
    dias: str = Query("", description="CSV: Lun,Mar,Mié,..."),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(usuario_actual),
):
    plan = db.query(Plan).filter(Plan.id_plan == id_plan, Plan.activo == True).first()
    if not plan:
        raise HTTPException(404, "Plan no encontrado")

    try:
        desde_dt = _date.fromisoformat(desde)
        hasta_dt = _date.fromisoformat(hasta)
    except ValueError:
        raise HTTPException(400, "Fechas inválidas")

    dias_req = None
    if dias:
        dias_req = {
            MAPA_DIAS_ABREV_A_IDX[d.strip()]
            for d in dias.split(",")
            if d.strip() in MAPA_DIAS_ABREV_A_IDX
        }

    result: dict[str, dict] = {}
    cur = desde_dt
    while cur <= hasta_dt:
        if dias_req is not None and cur.weekday() not in dias_req:
            cur += timedelta(days=1)
            continue

        data = _disponibilidad_dia_helper(db, plan, cur)
        result[cur.isoformat()] = data.model_dump() if hasattr(data, "model_dump") else data
        cur += timedelta(days=1)

    return result


# ── Crear cita (simple o recurrente) ────────────────────────
@router.post("", response_model=CitaResponse)
def crear_cita(
    payload: CitaRequest,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(usuario_actual),
):
    # 1. Plan
    plan = (
        db.query(Plan)
        .filter(Plan.id_plan == payload.id_plan, Plan.activo == True)
        .first()
    )
    if not plan:
        raise HTTPException(404, "El plan no existe o está inactivo")

    # 2. Mascota
    mascota = (
        db.query(Mascota)
        .filter(
            Mascota.id_mascota == payload.id_mascota,
            Mascota.id_usuario == usuario.id_usuario,
        )
        .first()
    )
    if not mascota:
        raise HTTPException(404, "Mascota no encontrada")

    # 3. Paseo de prueba único por mascota
    if payload.es_paseo_prueba and _mascota_tiene_paseo_prueba_usado(db, payload.id_mascota):
        raise HTTPException(400, "Esta mascota ya usó su paseo de bienvenida gratuito.")

    # 4. Fecha/hora
    try:
        fecha_dt = _date.fromisoformat(payload.fecha)
        hora_dt  = _time.fromisoformat(payload.hora)
    except ValueError:
        raise HTTPException(400, "Formato de fecha u hora inválido")

    # 5. Disponibilidad de la primera fecha
    _validar_disponibilidad(db, plan.id_servicio, fecha_dt, hora_dt)

    # 6. Precio / estados
    precio_final = 0.0 if payload.es_paseo_prueba else float(plan.precio_actual)
    estado_cita_id = ESTADO_CITA_CONFIRMADA if payload.es_paseo_prueba else ESTADO_CITA_PENDIENTE
    estado_pago_id = ESTADO_PAGO_APROBADO   if payload.es_paseo_prueba else ESTADO_PAGO_PENDIENTE

    # ─── 7. Modo recurrente ───────────────────────────────────
    if payload.recurrente and not payload.es_paseo_prueba and plan.dias_permitidos > 1:
        if not payload.dias_semana:
            raise HTTPException(400, "Debes indicar los días de la semana del plan")

        dias_idx = sorted({MAPA_DIAS_ABREV_A_IDX[d] for d in payload.dias_semana if d in MAPA_DIAS_ABREV_A_IDX})
        if len(dias_idx) != plan.dias_permitidos:
            raise HTTPException(
                400,
                f"El plan requiere exactamente {plan.dias_permitidos} días. "
                f"Recibí: {payload.dias_semana}",
            )

        fecha_fin = fecha_dt + timedelta(days=DIAS_SUSCRIPCION)
        nueva_susc = Suscripcion(
            id_usuario=usuario.id_usuario,
            id_mascota=payload.id_mascota,
            id_plan=plan.id_plan,
            fecha_inicio=fecha_dt,
            fecha_fin=fecha_fin,
            activa=True,
            hora_preferida=hora_dt,
            dias_semana=",".join(payload.dias_semana),
        )
        db.add(nueva_susc)
        db.flush()

        fechas: list[_date] = []
        cursor = fecha_dt
        while cursor <= fecha_fin:
            if cursor.weekday() in dias_idx:
                fechas.append(cursor)
            cursor += timedelta(days=1)

        if not fechas:
            raise HTTPException(400, "No hay ocurrencias válidas en el rango")

        for f in fechas:
            _validar_disponibilidad(db, plan.id_servicio, f, hora_dt)

        citas_creadas: list[Cita] = []
        for i, f in enumerate(fechas):
            cita = Cita(
                fecha=f,
                hora=hora_dt,
                zona=payload.zona,
                direccion=payload.direccion,
                complemento_direccion=payload.complemento_direccion,
                es_conjunto=payload.es_conjunto,
                torre=payload.torre,
                apto=payload.apto,
                es_paseo_prueba=False,
                precio_final=(precio_final if i == 0 else 0.0),
                id_estado=estado_cita_id,
                id_mascota=payload.id_mascota,
                id_usuario_cliente=usuario.id_usuario,
                id_plan=plan.id_plan,
                dias_semana=",".join(payload.dias_semana),
                persona_entrega=payload.persona_entrega,
                persona_recibe=payload.persona_recibe,
                fecha_creacion=datetime.now(),
                id_suscripcion=nueva_susc.id_suscripcion,
            )
            db.add(cita)
            citas_creadas.append(cita)

        db.flush()
        primera = citas_creadas[0]

        referencia = str(primera.id_cita)
        pago = Pago(
            monto=precio_final,
            ref_wompi=referencia,
            id_estado_pago=estado_pago_id,
            id_cita=primera.id_cita,
            fecha_pago=None,
        )
        db.add(pago)
        db.commit()
        db.refresh(primera)

        monto_cent = int(round(precio_final * 100))
        return CitaResponse(
            id_cita=primera.id_cita,
            monto=precio_final,
            referencia=referencia,
            estado="PENDIENTE",
            firma_integridad=firma_integridad_wompi(referencia, monto_cent),
            id_suscripcion=nueva_susc.id_suscripcion,
            citas_generadas=[
                {"id_cita": c.id_cita, "fecha": str(c.fecha), "hora": c.hora.strftime("%H:%M")}
                for c in citas_creadas
            ],
        )

        choque = (
            db.query(Suscripcion)
            .filter(
                Suscripcion.id_mascota == payload.id_mascota,
                Suscripcion.activa == True,
                Suscripcion.fecha_inicio <= fecha_fin,
                Suscripcion.fecha_fin >= fecha_dt,
            )
            .first()
        )
        if choque:
            raise HTTPException(
                400,
                f"Esta mascota ya tiene una suscripción activa desde "
                f"{choque.fecha_inicio.isoformat()} hasta {choque.fecha_fin.isoformat()}.",
            )

    # ─── 8. Modo simple ───────────────────────────────────────
    suscripcion_id = None
    if not payload.es_paseo_prueba and plan.dias_permitidos > 1:
        susc_activa = (
            db.query(Suscripcion)
            .filter(
                Suscripcion.id_usuario == usuario.id_usuario,
                Suscripcion.id_mascota == payload.id_mascota,
                Suscripcion.id_plan == plan.id_plan,
                Suscripcion.activa == True,
                Suscripcion.fecha_fin >= fecha_dt,
            )
            .order_by(Suscripcion.fecha_fin.desc())
            .first()
        )
        if susc_activa:
            suscripcion_id = susc_activa.id_suscripcion

    cita = Cita(
        fecha=fecha_dt,
        hora=hora_dt,
        zona=payload.zona,
        direccion=payload.direccion,
        complemento_direccion=payload.complemento_direccion,
        es_conjunto=payload.es_conjunto,
        torre=payload.torre,
        apto=payload.apto,
        es_paseo_prueba=payload.es_paseo_prueba,
        precio_final=precio_final,
        id_estado=estado_cita_id,
        id_mascota=payload.id_mascota,
        id_usuario_cliente=usuario.id_usuario,
        id_plan=plan.id_plan,
        dias_semana=",".join(payload.dias_semana) if payload.dias_semana else None,
        persona_entrega=payload.persona_entrega,
        persona_recibe=payload.persona_recibe,
        fecha_creacion=datetime.now(),
        id_suscripcion=suscripcion_id,
    )
    db.add(cita)
    db.flush()

    referencia = str(cita.id_cita)
    pago = Pago(
        monto=precio_final,
        ref_wompi=referencia,
        id_estado_pago=estado_pago_id,
        id_cita=cita.id_cita,
        fecha_pago=datetime.now() if payload.es_paseo_prueba else None,
    )
    db.add(pago)
    db.commit()
    db.refresh(cita)

    monto_cent = int(round(precio_final * 100))
    return CitaResponse(
        id_cita=cita.id_cita,
        monto=precio_final,
        referencia=referencia,
        estado="CONFIRMADO" if payload.es_paseo_prueba else "PENDIENTE",
        firma_integridad=firma_integridad_wompi(referencia, monto_cent),
        id_suscripcion=suscripcion_id,
    )


# ── Listar citas ────────────────────────────────────────────
@router.get("")
def listar_mis_citas(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(usuario_actual),
):
    rows = (
        db.query(Cita, Plan, Mascota, EstadoCita)
        .outerjoin(Plan, Plan.id_plan == Cita.id_plan)
        .outerjoin(Mascota, Mascota.id_mascota == Cita.id_mascota)
        .outerjoin(EstadoCita, EstadoCita.id_estado == Cita.id_estado)
        .filter(Cita.id_usuario_cliente == usuario.id_usuario)
        .order_by(Cita.fecha.asc(), Cita.hora.asc())
        .all()
    )

    return [
        {
            "id_cita": c.id_cita,
            "fecha": str(c.fecha),
            "hora": c.hora.strftime("%H:%M") if c.hora else None,
            "zona": c.zona,
            "direccion": c.direccion,
            "precio_final": float(c.precio_final) if c.precio_final else 0,
            "id_estado": c.id_estado,
            "nom_estado": estado.nom_estado if estado else "Pendiente",
            "id_mascota": c.id_mascota,
            "nom_mascota": mascota.nom_mascota if mascota else "—",
            "id_plan": c.id_plan,
            "nom_plan": plan.nom_plan if plan else "—",
            "duracion_minutos": plan.duracion_minutos if plan else 55,
            "es_paseo_prueba": bool(c.es_paseo_prueba),
            "id_usuario_paseador": c.id_usuario_paseador,
            "id_suscripcion": c.id_suscripcion,
        }
        for c, plan, mascota, estado in rows
    ]


# ── Reprogramar ─────────────────────────────────────────────
@router.put("/{id_cita}/reprogramar")
def reprogramar_cita(
    id_cita: int,
    payload: ReprogramarRequest,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(usuario_actual),
):
    cita = (
        db.query(Cita)
        .filter(
            Cita.id_cita == id_cita,
            Cita.id_usuario_cliente == usuario.id_usuario,
        )
        .first()
    )
    if not cita:
        raise HTTPException(404, "Cita no encontrada")

    if cita.id_estado in (ESTADO_CITA_CANCELADA, ESTADO_CITA_COMPLETADA):
        raise HTTPException(400, "No se puede reprogramar una cita cancelada o completada")

    try:
        fecha_dt = _date.fromisoformat(payload.fecha)
    except ValueError:
        raise HTTPException(400, "Formato de fecha inválido")

    # La hora se conserva en citas con suscripción
    if cita.id_suscripcion:
        hora_dt = cita.hora
    else:
        if not payload.hora:
            raise HTTPException(400, "Debes indicar la hora")
        try:
            hora_dt = _time.fromisoformat(payload.hora)
        except ValueError:
            raise HTTPException(400, "Formato de hora inválido")

    if cita.id_plan:
        plan = db.query(Plan).filter(Plan.id_plan == cita.id_plan).first()
        if plan:
            _validar_disponibilidad(db, plan.id_servicio, fecha_dt, hora_dt)

    if cita.id_suscripcion:
        susc = (
            db.query(Suscripcion)
            .filter(Suscripcion.id_suscripcion == cita.id_suscripcion)
            .first()
        )
        if not susc:
            raise HTTPException(400, "La suscripción asociada ya no existe")
        if not (susc.fecha_inicio <= fecha_dt <= susc.fecha_fin):
            raise HTTPException(
                400,
                f"Solo puedes reprogramar entre {susc.fecha_inicio.isoformat()} "
                f"y {susc.fecha_fin.isoformat()} (vigencia de tu suscripción).",
            )
    else:
        delta = (fecha_dt - cita.fecha).days
        if abs(delta) > 14:
            raise HTTPException(
                400,
                "Por ahora solo puedes reprogramar dentro de los próximos 14 días.",
            )

    cita.fecha = fecha_dt
    cita.hora = hora_dt
    cita.fecha_asignacion = None
    cita.fecha_hora_real = None
    cita.fecha_fin_real = None

    db.commit()
    db.refresh(cita)

    return {
        "mensaje": "Cita reprogramada correctamente",
        "id_cita": cita.id_cita,
        "fecha": str(cita.fecha),
        "hora": cita.hora.strftime("%H:%M"),
    }

# ── Cambiar la rutina de una suscripción (días de la semana) ──
@router.put("/suscripciones/{id_suscripcion}/rutina")
def cambiar_rutina(
    id_suscripcion: int,
    payload: CambiarRutinaRequest,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(usuario_actual),
):
    susc = (
        db.query(Suscripcion)
        .filter(
            Suscripcion.id_suscripcion == id_suscripcion,
            Suscripcion.id_usuario == usuario.id_usuario,
        )
        .first()
    )
    if not susc:
        raise HTTPException(404, "Suscripción no encontrada")

    if not susc.activa or susc.fecha_fin < _date.today():
        raise HTTPException(400, "La suscripción ya no está activa")

    plan = db.query(Plan).filter(Plan.id_plan == susc.id_plan).first()
    if not plan:
        raise HTTPException(404, "Plan no encontrado")

    dias_idx = sorted({
        MAPA_DIAS_ABREV_A_IDX[d]
        for d in payload.dias_semana
        if d in MAPA_DIAS_ABREV_A_IDX
    })
    if len(dias_idx) != plan.dias_permitidos:
        raise HTTPException(
            400,
            f"El plan requiere exactamente {plan.dias_permitidos} días. "
            f"Recibí: {payload.dias_semana}",
        )

    # Regla: SOLO se puede cambiar la rutina ANTES del primer paseo, con ≥48h
    primera_cita = (
        db.query(Cita)
        .filter(
            Cita.id_suscripcion == id_suscripcion,
            Cita.id_estado != ESTADO_CITA_CANCELADA,
        )
        .order_by(Cita.fecha.asc(), Cita.hora.asc())
        .first()
    )
    if not primera_cita:
        raise HTTPException(400, "La suscripción no tiene citas asociadas")

    hoy = _date.today()
    horas_hasta_primera = (primera_cita.fecha - hoy).days * 24
    if horas_hasta_primera < 48:
        raise HTTPException(
            400,
            "Solo puedes cambiar la rutina con al menos 48 horas de anticipación "
            "al primer paseo. Para cambios de días puntuales después de iniciar, "
            "usa 'Mover este día' en cada sesión.",
        )
    
    # Validar disponibilidad de las nuevas fechas antes de tocar nada
    hora = susc.hora_preferida or primera_cita.hora
    desde = max(hoy + timedelta(days=1), susc.fecha_inicio + timedelta(days=1))
    fechas_nuevas = _generar_fechas_rutina(desde, susc.fecha_fin, set(dias_idx))

    for f in fechas_nuevas:
        _validar_disponibilidad(db, plan.id_servicio, f, hora)

    # Borrar futuras citas del plan (excepto la primera, ya pagada)
    db.query(Cita).filter(
        Cita.id_suscripcion == id_suscripcion,
        Cita.id_cita != primera_cita.id_cita,
        Cita.fecha > hoy,
        Cita.id_estado != ESTADO_CITA_CANCELADA,
    ).delete(synchronize_session=False)

    # Recrear con la nueva rutina
    generadas = 0
    for f in fechas_nuevas:
        cita = Cita(
            fecha=f,
            hora=hora,
            zona=primera_cita.zona,
            direccion=primera_cita.direccion,
            complemento_direccion=primera_cita.complemento_direccion,
            es_conjunto=primera_cita.es_conjunto,
            torre=primera_cita.torre,
            apto=primera_cita.apto,
            es_paseo_prueba=False,
            precio_final=0.0,
            id_estado=ESTADO_CITA_PENDIENTE,
            id_mascota=susc.id_mascota,
            id_usuario_cliente=susc.id_usuario,
            id_plan=susc.id_plan,
            dias_semana=",".join(payload.dias_semana),
            persona_entrega=primera_cita.persona_entrega,
            persona_recibe=primera_cita.persona_recibe,
            fecha_creacion=datetime.now(),
            id_suscripcion=susc.id_suscripcion,
        )
        db.add(cita)
        generadas += 1

    susc.dias_semana = ",".join(payload.dias_semana)
    db.commit()

    return {
        "mensaje": "Rutina actualizada correctamente",
        "id_suscripcion": susc.id_suscripcion,
        "dias_semana": payload.dias_semana,
        "citas_generadas": generadas,
        "fecha_inicio": str(susc.fecha_inicio),
        "fecha_fin": str(susc.fecha_fin),
    }

@router.get("/{id_cita}/dias-cambio-disponibles")
def dias_cambio_disponibles(
    id_cita: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(usuario_actual),
):
    """
    Devuelve el estado de cada día candidato para reemplazar una cita de rutina.
    - Excluye los días que ya son rutina (no se pueden repetir).
    - Marca disponible=True solo si el día tiene cupo a la hora de la cita.
    """
    cita = (
        db.query(Cita)
        .filter(
            Cita.id_cita == id_cita,
            Cita.id_usuario_cliente == usuario.id_usuario,
        )
        .first()
    )
    if not cita:
        raise HTTPException(404, "Cita no encontrada")
    if not cita.id_suscripcion:
        raise HTTPException(400, "Esta cita no pertenece a una suscripción")

    susc = (
        db.query(Suscripcion)
        .filter(Suscripcion.id_suscripcion == cita.id_suscripcion)
        .first()
    )
    if not susc:
        raise HTTPException(400, "La suscripción ya no existe")

    plan = db.query(Plan).filter(Plan.id_plan == susc.id_plan).first()
    if not plan:
        raise HTTPException(400, "El plan ya no existe")

    hoy = _date.today()
    buffer = hoy + timedelta(days=2)  # 48h mínimo

    # Si la cita está muy cerca, no se puede mover
    if cita.fecha < buffer:
        return {
            "id_cita": cita.id_cita,
            "fecha_original": str(cita.fecha),
            "hora": cita.hora.strftime("%H:%M"),
            "dias_rutina": list(_dias_rutina_idx(susc.dias_semana)),
            "candidatos": [],
            "bloqueada": True,
            "motivo": "Solo puedes cambiar días con al menos 48 horas de anticipación",
        }

    dias_rutina = _dias_rutina_idx(susc.dias_semana)

    # Fechas ya ocupadas por otra cita de esta misma suscripción
    ocupadas_por_susc = {
        str(r[0])
        for r in db.query(Cita.fecha)
        .filter(
            Cita.id_suscripcion == susc.id_suscripcion,
            Cita.id_cita != cita.id_cita,
            Cita.id_estado != ESTADO_CITA_CANCELADA,
        )
        .all()
    }

    candidatos: list[dict] = []
    cur = max(buffer, susc.fecha_inicio)
    while cur <= susc.fecha_fin:
        # Excluimos los días que ya son rutina (por patrón)
        if cur.weekday() in dias_rutina:
            cur += timedelta(days=1)
            continue

        iso = cur.isoformat()
        disponible = False
        motivo: str | None = None

        if iso in ocupadas_por_susc:
            motivo = "Ya tienes otro paseo ese día"
        else:
            try:
                _validar_disponibilidad(db, plan.id_servicio, cur, cita.hora)
                ocupados = _contar_ocupados(db, plan.id_servicio, cur, cita.hora)
                if ocupados >= CAPACIDAD_POR_HORA:
                    motivo = "Sin cupo a esta hora"
                else:
                    disponible = True
            except HTTPException as e:
                motivo = e.detail

        candidatos.append(
            {"fecha": iso, "disponible": disponible, "motivo": motivo}
        )
        cur += timedelta(days=1)

    return {
        "id_cita": cita.id_cita,
        "fecha_original": str(cita.fecha),
        "hora": cita.hora.strftime("%H:%M"),
        "dias_rutina": list(dias_rutina),
        "candidatos": candidatos,
        "bloqueada": False,
        "motivo": None,
    }


@router.put("/{id_cita}/cambiar-dia")
def cambiar_dia_cita(
    id_cita: int,
    payload: CambiarDiaRequest,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(usuario_actual),
):
    """Mueve una cita individual de la rutina a otro día (mantiene hora)."""
    cita = (
        db.query(Cita)
        .filter(
            Cita.id_cita == id_cita,
            Cita.id_usuario_cliente == usuario.id_usuario,
        )
        .first()
    )
    if not cita:
        raise HTTPException(404, "Cita no encontrada")
    if not cita.id_suscripcion:
        raise HTTPException(400, "Esta cita no pertenece a una suscripción")
    if cita.id_estado in (ESTADO_CITA_CANCELADA, ESTADO_CITA_COMPLETADA, ESTADO_CITA_EN_CURSO):
        raise HTTPException(400, "Esta cita ya no se puede mover")

    susc = (
        db.query(Suscripcion)
        .filter(Suscripcion.id_suscripcion == cita.id_suscripcion)
        .first()
    )
    if not susc:
        raise HTTPException(400, "La suscripción ya no existe")

    plan = db.query(Plan).filter(Plan.id_plan == susc.id_plan).first()
    if not plan:
        raise HTTPException(400, "El plan ya no existe")

    hoy = _date.today()
    buffer = hoy + timedelta(days=2)

    if cita.fecha < buffer:
        raise HTTPException(
            400,
            "Solo puedes cambiar días con al menos 48 horas de anticipación",
        )

    try:
        nueva_fecha = _date.fromisoformat(payload.fecha)
    except ValueError:
        raise HTTPException(400, "Formato de fecha inválido")

    if not (susc.fecha_inicio <= nueva_fecha <= susc.fecha_fin):
        raise HTTPException(
            400,
            f"La nueva fecha debe estar dentro de la vigencia "
            f"({susc.fecha_inicio.isoformat()} a {susc.fecha_fin.isoformat()})",
        )

    if nueva_fecha < buffer:
        raise HTTPException(
            400,
            "Solo puedes mover a fechas con al menos 48 horas de anticipación",
        )

    # No puede caer en un día que ya forma parte de la rutina
    dias_rutina = _dias_rutina_idx(susc.dias_semana)
    if nueva_fecha.weekday() in dias_rutina:
        raise HTTPException(
            400,
            "El nuevo día no puede coincidir con los días de tu rutina. "
            "Si quieres cambiar la rutina completa, usa 'Cambiar rutina'.",
        )

    # No puede chocar con otra cita de la misma suscripción
    choque = (
        db.query(Cita)
        .filter(
            Cita.id_suscripcion == susc.id_suscripcion,
            Cita.fecha == nueva_fecha,
            Cita.id_cita != cita.id_cita,
            Cita.id_estado != ESTADO_CITA_CANCELADA,
        )
        .first()
    )
    if choque:
        raise HTTPException(400, "Ya tienes otro paseo de este plan ese día")

    # Validar disponibilidad del servicio + cupo
    _validar_disponibilidad(db, plan.id_servicio, nueva_fecha, cita.hora)
    ocupados = _contar_ocupados(db, plan.id_servicio, nueva_fecha, cita.hora)
    if ocupados >= CAPACIDAD_POR_HORA:
        raise HTTPException(400, "No hay cupo a esa hora en el día seleccionado")

    fecha_vieja = cita.fecha
    cita.fecha = nueva_fecha
    db.commit()
    db.refresh(cita)

    return {
        "mensaje": "Día cambiado correctamente",
        "id_cita": cita.id_cita,
        "fecha_anterior": str(fecha_vieja),
        "fecha_nueva": str(cita.fecha),
        "hora": cita.hora.strftime("%H:%M"),
    }