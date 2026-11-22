# petfy-backend/routers/public_router.py
# Endpoints públicos (sin autenticación) — para el chip NFC de mascotas.
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Mascota, Comportamiento, CondicionMedica

router = APIRouter(prefix="/public", tags=["Público"])


@router.get("/mascotas/{id_mascota}")
def mascota_publica(id_mascota: int, db: Session = Depends(get_db)):
    """Datos públicos de una mascota (para su chip NFC)."""
    mascota = db.query(Mascota).filter(Mascota.id_mascota == id_mascota).first()
    if not mascota:
        raise HTTPException(404, "Mascota no encontrada")

    dueno = mascota.usuario
    primer_nombre = (dueno.nombre or "").split(" ")[0] if dueno else None

    condicion = None
    if mascota.id_condicion_medica:
        cm = db.query(CondicionMedica).filter(
            CondicionMedica.id_condicion == mascota.id_condicion_medica
        ).first()
        if cm:
            condicion = cm.nom_condicion

    comport = None
    if mascota.id_comportamiento:
        c = db.query(Comportamiento).filter(
            Comportamiento.id_comport == mascota.id_comportamiento
        ).first()
        if c:
            comport = c.nom_comportamiento

    return {
        "id_mascota": mascota.id_mascota,
        "nom_mascota": mascota.nom_mascota,
        "raza": mascota.raza,
        "edad": mascota.edad,
        "peso": float(mascota.peso) if mascota.peso else None,
        "img_masc": mascota.img_masc,
        "comportamiento": comport,
        "otras_indicaciones": mascota.otras_indicaciones,
        "nombre_dueno": primer_nombre,
        "telefono_dueno": dueno.telefono if dueno else None,
        "condicion_medica": condicion,
        "modo_perdido": bool(mascota.modo_perdido),
        "fecha_perdida": mascota.fecha_perdida.isoformat() if mascota.fecha_perdida else None,
        "ultima_ubicacion": mascota.ultima_ubicacion,
        "recompensa": mascota.recompensa,
        "mensaje_perdido": mascota.mensaje_perdido,
    }