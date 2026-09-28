# backend/routers/suscripciones_router.py
from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Suscripcion, Mascota, Plan, Cita, EstadoCita, Usuario
from routers.mascotas_router import usuario_actual

router = APIRouter(prefix="/suscripciones", tags=["Suscripciones"])

MAPA_DIAS_ABREV_A_IDX = {
    "Lun": 0, "Mar": 1, "Mié": 2, "Mie": 2,
    "Jue": 3, "Vie": 4, "Sáb": 5, "Sab": 5, "Dom": 6,
}


def _generar_fechas_rutina(
    inicio: date, fin: date, dias_semana_str: str | None
) -> list[str]:
    """Devuelve todas las fechas ISO entre inicio y fin que caen en los días de la rutina."""
    if not dias_semana_str:
        return []
    dias_idx = {
        MAPA_DIAS_ABREV_A_IDX[d.strip()]
        for d in dias_semana_str.split(",")
        if d.strip() in MAPA_DIAS_ABREV_A_IDX
    }
    if not dias_idx:
        return []
    out: list[str] = []
    cur = inicio
    while cur <= fin:
        if cur.weekday() in dias_idx:
            out.append(cur.isoformat())
        cur += timedelta(days=1)
    return out


def _serializar(s: Suscripcion, db: Session) -> dict:
    mascota = db.query(Mascota).filter(Mascota.id_mascota == s.id_mascota).first()
    plan = db.query(Plan).filter(Plan.id_plan == s.id_plan).first()
    hoy = date.today()

    if s.fecha_inicio > hoy:
        dias_restantes = (s.fecha_fin - s.fecha_inicio).days
        ya_iniciada = False
    else:
        dias_restantes = max((s.fecha_fin - hoy).days, 0)
        ya_iniciada = True

    # 🔑 Fechas reales desde las citas (refleja cambios manuales)
    rows = (
        db.query(Cita.fecha)
        .filter(
            Cita.id_suscripcion == s.id_suscripcion,
            Cita.id_estado != 5,  # no canceladas
        )
        .order_by(Cita.fecha.asc())
        .all()
    )
    fechas_rutina = sorted({str(r[0]) for r in rows})

    proximas = [f for f in fechas_rutina if f >= hoy.isoformat()]
    proximo_paseo = proximas[0] if proximas else None

    primera = fechas_rutina[0] if fechas_rutina else None
    puede_cambiar_rutina = False
    if primera:
        primera_dt = date.fromisoformat(primera)
        horas_hasta_primera = (primera_dt - hoy).days * 24
        puede_cambiar_rutina = horas_hasta_primera >= 48

    return {
        "id_suscripcion": s.id_suscripcion,
        "id_mascota": s.id_mascota,
        "nom_mascota": mascota.nom_mascota if mascota else "—",
        "id_plan": s.id_plan,
        "nom_plan": plan.nom_plan if plan else "—",
        "dias_permitidos": plan.dias_permitidos if plan else 1,
        "precio_actual": float(plan.precio_actual) if plan else 0.0,
        "fecha_inicio": s.fecha_inicio.isoformat() if s.fecha_inicio else None,
        "fecha_fin": s.fecha_fin.isoformat() if s.fecha_fin else None,
        "dias_restantes": dias_restantes,
        "ya_iniciada": ya_iniciada,
        "activa": bool(s.activa and s.fecha_fin >= hoy),
        "dias_semana": s.dias_semana,
        "hora_preferida": (
            s.hora_preferida.strftime("%H:%M") if s.hora_preferida else None
        ),
        "fechas_rutina": fechas_rutina,
        "proximo_paseo": proximo_paseo,
        "puede_cambiar_rutina": puede_cambiar_rutina,
    }

@router.get("/mia")
def mi_suscripcion_activa(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(usuario_actual),
):
    hoy = date.today()
    susc = (
        db.query(Suscripcion)
        .filter(
            Suscripcion.id_usuario == usuario.id_usuario,
            Suscripcion.activa == True,
            Suscripcion.fecha_fin >= hoy,
        )
        .order_by(Suscripcion.fecha_fin.desc())
        .first()
    )
    if not susc:
        return None
    return _serializar(susc, db)


@router.get("/{id_suscripcion}")
def detalle_suscripcion(
    id_suscripcion: int,
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

    data = _serializar(susc, db)

    rows = (
        db.query(Cita, EstadoCita)
        .outerjoin(EstadoCita, EstadoCita.id_estado == Cita.id_estado)
        .filter(Cita.id_suscripcion == susc.id_suscripcion)
        .order_by(Cita.fecha.asc(), Cita.hora.asc())
        .all()
    )
    data["citas"] = [
        {
            "id_cita": c.id_cita,
            "fecha": str(c.fecha),
            "hora": c.hora.strftime("%H:%M") if c.hora else None,
            "id_estado": c.id_estado,
            "nom_estado": e.nom_estado if e else "—",
        }
        for c, e in rows
    ]
    return data

@router.get("/mias")
def mis_suscripciones_activas(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(usuario_actual),
):
    """Todas las suscripciones activas del usuario (una por mascota)."""
    hoy = date.today()
    suscs = (
        db.query(Suscripcion)
        .filter(
            Suscripcion.id_usuario == usuario.id_usuario,
            Suscripcion.activa == True,
            Suscripcion.fecha_fin >= hoy,
        )
        .order_by(Suscripcion.fecha_inicio.asc())
        .all()
    )
    return [_serializar(s, db) for s in suscs]