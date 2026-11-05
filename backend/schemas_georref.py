# backend/schemas_georref.py
# Esquemas de entrada del módulo de georreferenciación (separados de schemas.py)
from typing import Literal, Optional
from pydantic import BaseModel, Field


class ConfirmarEscaneoRequest(BaseModel):
    metodo_lectura: Literal["QR", "NFC", "MANUAL"] = "QR"
    latitud: Optional[float] = Field(None, ge=-90, le=90)
    longitud: Optional[float] = Field(None, ge=-180, le=180)


class UbicacionRequest(BaseModel):
    latitud: float = Field(ge=-90, le=90)
    longitud: float = Field(ge=-180, le=180)
    precision_m: Optional[float] = Field(default=None, ge=0, le=100000)
