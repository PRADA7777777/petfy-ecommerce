# backend/services/recorrido.py
import math
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from models import UbicacionPaseo

RADIO_TIERRA_KM = 6371


def puntos_de_cita(db: Session, id_cita: int) -> list:
    """Puntos GPS de un paseo, del primero al último."""
    return db.query(UbicacionPaseo).filter(
        UbicacionPaseo.id_cita == id_cita
    ).order_by(UbicacionPaseo.fecha_hora.asc()).all()


def distancia_km(puntos: list) -> float:
    """Suma de la distancia entre puntos GPS consecutivos (fórmula de haversine)."""
    total = 0.0
    for a, b in zip(puntos, puntos[1:]):
        lat1, lng1, lat2, lng2 = map(math.radians, (float(a.latitud), float(a.longitud), float(b.latitud), float(b.longitud)))
        h = math.sin((lat2 - lat1) / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin((lng2 - lng1) / 2) ** 2
        total += 2 * RADIO_TIERRA_KM * math.asin(math.sqrt(h))
    return round(total, 2)


def minutos_entre(inicio: Optional[datetime], fin: Optional[datetime]) -> Optional[int]:
    """Minutos completos entre dos momentos; None si falta alguno."""
    if not inicio or not fin:
        return None
    return round((fin - inicio).total_seconds() / 60)
