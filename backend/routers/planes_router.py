from datetime import date, timedelta
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
from models import Plan, Servicio, DisponibilidadServicio, ExcepcionDisponibilidad
from schemas import PlanOut, DisponibilidadOut, DiaDisponible, ExcepcionOut

router = APIRouter(prefix="/planes", tags=["Planes"])

DIAS_LABEL = {0: "Dom", 1: "Lun", 2: "Mar", 3: "Mié", 4: "Jue", 5: "Vie", 6: "Sáb"}


@router.get("", response_model=list[PlanOut])
def listar_planes(
    servicio: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(Plan).filter(Plan.activo == True)
    if servicio:
        q = q.join(Servicio, Servicio.id_servicio == Plan.id_servicio).filter(
            Servicio.nombre == servicio
        )
    return q.order_by(Plan.orden, Plan.id_plan).all()


@router.get("/{id_plan}/disponibilidad", response_model=DisponibilidadOut)
def disponibilidad_plan(id_plan: int, db: Session = Depends(get_db)):
    """Devuelve la rejilla semanal y las excepciones vigentes (hoy + 6 meses)."""
    plan = db.query(Plan).filter(Plan.id_plan == id_plan, Plan.activo == True).first()
    if not plan:
        raise HTTPException(404, "Plan no encontrado")

    dias = (
        db.query(DisponibilidadServicio)
        .filter(
            DisponibilidadServicio.id_servicio == plan.id_servicio,
            DisponibilidadServicio.activo == True,
        )
        .order_by(DisponibilidadServicio.dia_semana)
        .all()
    )

    hoy = date.today()
    fin = hoy + timedelta(days=180)
    excepciones = (
        db.query(ExcepcionDisponibilidad)
        .filter(
            ExcepcionDisponibilidad.id_servicio == plan.id_servicio,
            ExcepcionDisponibilidad.fecha >= hoy,
            ExcepcionDisponibilidad.fecha <= fin,
        )
        .order_by(ExcepcionDisponibilidad.fecha)
        .all()
    )

    return DisponibilidadOut(
        id_plan=plan.id_plan,
        id_servicio=plan.id_servicio,
        dias_permitidos=plan.dias_permitidos,
        dias_disponibles=[
            DiaDisponible(
                dia_semana=d.dia_semana,
                label=DIAS_LABEL[d.dia_semana],
                hora_inicio=d.hora_inicio.strftime("%H:%M"),
                hora_fin=d.hora_fin.strftime("%H:%M"),
            )
            for d in dias
        ],
        excepciones=[
            ExcepcionOut(
                fecha=e.fecha.isoformat(),
                motivo=e.motivo,
                es_laborable=e.es_laborable,
            )
            for e in excepciones
        ],
    )