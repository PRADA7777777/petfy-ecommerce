# backend/models_georref.py
# Modelos del módulo de georreferenciación (separados de models.py)
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from database import Base


class IdentificadorMascota(Base):
    __tablename__ = "identificadores_mascota"
    __table_args__ = {"schema": "petfy_db"}

    id_identificador = Column(Integer, primary_key=True)
    id_mascota = Column(Integer, ForeignKey("petfy_db.mascotas.id_mascota"), nullable=False)
    codigo = Column(String(64), nullable=False, unique=True)
    fecha_creacion = Column(DateTime, nullable=False, server_default=func.now())
    fecha_anulacion = Column(DateTime)  # NULL = código activo
