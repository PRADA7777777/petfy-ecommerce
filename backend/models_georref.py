# backend/models_georref.py
# Modelos del módulo de georreferenciación (separados de models.py)
from sqlalchemy import Column, Integer, String, Text, Numeric, DateTime, ForeignKey, func
from database import Base


class IdentificadorMascota(Base):
    __tablename__ = "identificadores_mascota"
    __table_args__ = {"schema": "petfy_db"}

    id_identificador = Column(Integer, primary_key=True)
    id_mascota = Column(Integer, ForeignKey("petfy_db.mascotas.id_mascota"), nullable=False)
    codigo = Column(String(64), nullable=False, unique=True)
    fecha_creacion = Column(DateTime, nullable=False, server_default=func.now())
    fecha_anulacion = Column(DateTime)  # NULL = código activo


class EventoPaseo(Base):
    __tablename__ = "eventos_paseo"
    __table_args__ = {"schema": "petfy_db"}

    id_evento = Column(Integer, primary_key=True)
    id_cita = Column(Integer, ForeignKey("petfy_db.citas.id_cita"), nullable=False)
    id_identificador = Column(
        Integer, ForeignKey("petfy_db.identificadores_mascota.id_identificador"), nullable=False
    )
    id_usuario = Column(Integer, ForeignKey("petfy_db.usuarios.id_usuario"), nullable=False)
    tipo_evento = Column(String(20), nullable=False)      # RECOGIDA | ENTREGA
    metodo_lectura = Column(String(20), nullable=False)   # QR | NFC | MANUAL
    fecha_hora = Column(DateTime, nullable=False, server_default=func.now())
    latitud = Column(Numeric(9, 6))
    longitud = Column(Numeric(9, 6))
    url_foto = Column(Text)
