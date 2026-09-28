from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Servicio
from schemas import ServicioOut

router = APIRouter(prefix="/servicios", tags=["Servicios"])

@router.get("", response_model=list[ServicioOut])
def listar_servicios(db: Session = Depends(get_db)):
    return (
        db.query(Servicio)
        .filter(Servicio.activo == True)
        .order_by(Servicio.orden, Servicio.id_servicio)
        .all()
    )