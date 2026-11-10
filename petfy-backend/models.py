# backend/models.py
from sqlalchemy import Column, BigInteger, Integer, String, Boolean, DateTime, Text, ForeignKey, Numeric, Date, Time, SmallInteger, JSON, UniqueConstraint, Table
from datetime import datetime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class Rol(Base):
    __tablename__ = "roles"
    id_rol = Column(Integer, primary_key=True)
    nombre_rol = Column(String(50), unique=True, nullable=False)

# --- SE ELIMINÓ LA CLASE CARGO ---

class TipoDocumento(Base):
    __tablename__ = "tipos_documentos"
    id_tipo_doc = Column(Integer, primary_key=True)
    nom_tipo_doc = Column(String(50), unique=True, nullable=False)

class EstadoCita(Base):
    __tablename__ = "estados_citas"
    id_estado = Column(Integer, primary_key=True)
    nom_estado = Column(String(100), nullable=False)

class EstadoPago(Base):
    __tablename__ = "estados_pago"
    id_estado_pago = Column(Integer, primary_key=True)
    nom_estado_pago = Column(String(100), nullable=False)

class MetodoPago(Base):
    __tablename__ = "metodos_pago"
    id_metodo_pago = Column(Integer, primary_key=True)
    nom_metodo = Column(String(100), nullable=False)
    descripcion = Column(Text)
    activo = Column(Boolean, default=True)

class Factura(Base):
    __tablename__ = "facturas"
    id_factura = Column(Integer, primary_key=True)
    num_factura = Column(String(100), unique=True, nullable=False)
    fecha_emision = Column(DateTime, default=datetime.now)
    fecha_vencimiento = Column(DateTime)
    total = Column(Numeric(10, 2), nullable=False)
    sub_total = Column(Numeric(10, 2), nullable=False)
    iva = Column(Numeric(10, 2), nullable=False)
    moneda = Column(String(3), default="COP")
    plan_pago = Column(String(100))

    nombre_cliente = Column(String(200))
    documento_cliente = Column(String(50))
    correo_cliente = Column(String(150))
    direccion_cliente = Column(Text)
    telefono_cliente = Column(String(20))

    observaciones = Column(Text)
    cufe = Column(String(100))

    id_est_fact = Column(Integer, ForeignKey("estados_facturas.id_est_fact"))
    id_cita = Column(Integer, ForeignKey("citas.id_cita"))
    id_pago = Column(Integer, ForeignKey("pagos.id_pago"))

    detalles = relationship("FacturaDetalle", back_populates="factura", cascade="all, delete-orphan")

class FacturaDetalle(Base):
    __tablename__ = "facturas_detalle"
    id_fact_detalle = Column(Integer, primary_key=True)
    concepto = Column(Text, nullable=False)
    cantidad = Column(Integer, nullable=False)
    total_linea = Column(Numeric(10, 2), nullable=False)
    iva = Column(Numeric(10, 2), nullable=False)
    precio_uni = Column(Numeric(10, 2), nullable=False)
    id_factura = Column(Integer, ForeignKey("facturas.id_factura", ondelete="CASCADE"))

    factura = relationship("Factura", back_populates="detalles")

class EstadoFactura(Base):
    __tablename__ = "estados_facturas"
    id_est_fact = Column(Integer, primary_key=True)
    nom_est_fact = Column(String(100), nullable=False)

class EstadoDevolucion(Base):
    __tablename__ = "estados_devoluciones"
    id_est_devo = Column(Integer, primary_key=True)
    nom_est_devo = Column(String(100), nullable=False)

# --- NUEVA TABLA INTERMEDIA (Muchos a Muchos) ---
# Permite que un usuario (Staff) tenga varios servicios asignados
usuario_servicios = Table(
    "usuario_servicios",
    Base.metadata,
    Column("id_usuario", Integer, ForeignKey("usuarios.id_usuario", ondelete="CASCADE"), primary_key=True),
    Column("id_servicio", Integer, ForeignKey("servicios.id_servicio", ondelete="CASCADE"), primary_key=True),
)

class Usuario(Base):
    __tablename__ = "usuarios"
    id_usuario = Column(Integer, primary_key=True)
    nombre = Column(String(100), nullable=False)
    apellido = Column(String(100), nullable=False)
    correo = Column(String(150), unique=True, nullable=False)
    contrasena = Column(String(255), nullable=False)
    telefono = Column(String(20))
    direccion = Column(Text)
    cod_verif = Column(String(20))
    cod_expirado = Column(DateTime)
    verificado = Column(Boolean, default=False)
    id_tipo_doc = Column(Integer, ForeignKey("tipos_documentos.id_tipo_doc"))
    id_rol = Column(Integer, ForeignKey("roles.id_rol"), nullable=False)
    
    # --- SE ELIMINÓ id_cargo DE AQUÍ ---

    rol = relationship("Rol")
    # --- SE ELIMINÓ cargo = relationship("Cargo") DE AQUÍ ---
    tipo_doc = relationship("TipoDocumento") 
    documento = relationship("DocIdentidad", back_populates="usuario", uselist=False)
    mascotas = relationship("Mascota", back_populates="usuario")
    
    # --- NUEVA RELACIÓN CON SERVICIOS ---
    servicios = relationship("Servicio", secondary=usuario_servicios, backref="usuarios")

class DocIdentidad(Base):
    __tablename__ = "documentos_identidad"
    id_doc = Column(Integer, primary_key=True)
    num_doc = Column(String(50), nullable=False)
    id_tipo_doc = Column(Integer, ForeignKey("tipos_documentos.id_tipo_doc"), nullable=False)
    id_usuario = Column(Integer, ForeignKey("usuarios.id_usuario"), unique=True, nullable=False)

    usuario = relationship("Usuario", back_populates="documento")
    tipo = relationship("TipoDocumento")

class Mascota(Base):
    __tablename__ = "mascotas"
    id_mascota = Column(Integer, primary_key=True)
    nom_mascota = Column(String(100), nullable=False)
    raza = Column(String(150))
    peso = Column(Numeric(5, 2))
    edad = Column(Integer)
    carne_vacunacion = Column(Text)
    img_masc = Column(Text)
    otras_indicaciones = Column(Text)
    observar_condicion = Column(Text)
    observar_comportamiento = Column(Text)
    id_raza = Column(Integer, ForeignKey("razas.id_raza"))
    id_comportamiento = Column(Integer, ForeignKey("comportamientos.id_comport"))
    id_condicion_medica = Column(Integer, ForeignKey("condiciones_medicas.id_condicion"))
    id_usuario = Column(Integer, ForeignKey("usuarios.id_usuario"), nullable=False)

    usuario = relationship("Usuario", back_populates="mascotas")
    raza_rel = relationship("Raza")

class Comportamiento(Base):
    __tablename__ = "comportamientos"
    id_comport = Column(Integer, primary_key=True)
    nom_comportamiento = Column(String(150), nullable=False)

class CondicionMedica(Base):
    __tablename__ = "condiciones_medicas"
    id_condicion = Column(Integer, primary_key=True)
    nom_condicion = Column(String(150), nullable=False)

class Raza(Base):
    __tablename__ = "razas"
    id_raza = Column(Integer, primary_key=True)
    nom_raza = Column(String(100), nullable=False, unique=True)

class Servicio(Base):
    __tablename__ = "servicios"
    id_servicio = Column(Integer, primary_key=True)
    nombre      = Column(String(100), unique=True, nullable=False)
    descripcion = Column(Text)
    icono       = Column(String(20))
    activo      = Column(Boolean, default=True)
    orden       = Column(Integer, default=0)

class Plan(Base):
    __tablename__ = "planes"
    id_plan         = Column(Integer, primary_key=True)
    nom_plan        = Column(String(150), nullable=False)
    descripcion     = Column(Text)
    precio_actual   = Column(Numeric(10, 2), nullable=False)
    dias_permitidos = Column(Integer, default=1)
    duracion_minutos = Column(Integer, default=55)
    orden           = Column(Integer, default=0)
    activo          = Column(Boolean, default=True)
    id_servicio     = Column(Integer, ForeignKey("servicios.id_servicio"), nullable=False)

class Cita(Base):
    __tablename__ = "citas"
    id_cita = Column(Integer, primary_key=True)
    fecha = Column(Date, nullable=False)
    hora = Column(Time, nullable=False)
    zona = Column(String(100))
    direccion = Column(Text)
    complemento_direccion = Column(Text)
    es_conjunto = Column(Boolean, default=False)
    torre = Column(String(50))
    apto = Column(String(50))
    fecha_creacion = Column(DateTime, default=datetime.now)
    comment_admin = Column(Text)
    fecha_fin_real = Column(DateTime)
    fecha_hora_real = Column(DateTime)
    fecha_asignacion = Column(DateTime)
    es_paseo_prueba = Column(Boolean, default=False)
    precio_final = Column(Numeric(10,2))

    id_estado = Column(Integer, ForeignKey("estados_citas.id_estado"))
    id_mascota = Column(Integer, ForeignKey("mascotas.id_mascota"))
    id_usuario_cliente = Column(Integer, ForeignKey("usuarios.id_usuario"))
    id_usuario_paseador = Column(Integer, ForeignKey("usuarios.id_usuario"))
    id_suscripcion = Column(Integer, ForeignKey("suscripciones.id_suscripcion", ondelete="SET NULL"))
    id_plan = Column(Integer, ForeignKey("planes.id_plan"))

    dias_semana = Column(String(100))
    persona_entrega = Column(String(150))
    persona_recibe = Column(String(150))

class Pago(Base):
    __tablename__ = "pagos"
    id_pago = Column(Integer, primary_key=True)
    monto = Column(Numeric(10,2), nullable=False)
    fecha_pago = Column(DateTime, default=datetime.now)
    fecha_actualizacion = Column(DateTime)

    id_trans_wompi= Column(String(100))
    ref_wompi = Column(String(100))

    wompi_payload = Column(JSON)
    payment_method_type = Column(String(50))
    card_last_four = Column(String(4))
    bank_name = Column(String(100))
    amount_in_cents = Column(Integer)
    wompi_status = Column(String(50))
    customer_email = Column(String(150))
    wompi_finalized_at = Column(DateTime)
    wompi_sent_at = Column(DateTime)

    id_metodo_pago = Column(Integer, ForeignKey("metodos_pago.id_metodo_pago"))
    id_estado_pago = Column(Integer, ForeignKey("estados_pago.id_estado_pago"))
    id_cita = Column(Integer, ForeignKey("citas.id_cita"))

class DisponibilidadServicio(Base):
    __tablename__ = "disponibilidad_servicio"
    id_disponibilidad = Column(Integer, primary_key=True)
    id_servicio = Column(
        Integer,
        ForeignKey("servicios.id_servicio", ondelete="CASCADE"),
        nullable=False,
    )
    dia_semana = Column(SmallInteger, nullable=False)  # 0=Dom..6=Sáb
    hora_inicio = Column(Time, nullable=False, default="06:00")
    hora_fin = Column(Time, nullable=False, default="20:00")
    activo = Column(Boolean, nullable=False, default=True)

class ExcepcionDisponibilidad(Base):
    __tablename__ = "excepciones_disponibilidad"
    id_excepcion = Column(Integer, primary_key=True)
    id_servicio = Column(
        Integer,
        ForeignKey("servicios.id_servicio", ondelete="CASCADE"),
        nullable=False,
    )
    fecha = Column(Date, nullable=False)
    motivo = Column(Text)
    es_laborable = Column(Boolean, nullable=False, default=False)
    hora_inicio = Column(Time)
    hora_fin = Column(Time)

class Suscripcion(Base):
    __tablename__ = "suscripciones"
    id_suscripcion = Column(Integer, primary_key=True)
    id_usuario = Column(Integer, ForeignKey("usuarios.id_usuario", ondelete="CASCADE"), nullable=False)
    id_mascota = Column(Integer, ForeignKey("mascotas.id_mascota", ondelete="CASCADE"), nullable=False)
    id_plan = Column(Integer, ForeignKey("planes.id_plan"), nullable=False)
    fecha_inicio = Column(Date, nullable=False)
    fecha_fin = Column(Date, nullable=False)
    hora_preferida = Column(Time)
    dias_semana = Column(String(50))
    activa = Column(Boolean, default=True, nullable=False)
    fecha_creacion = Column(DateTime, default=datetime.now)

class WebhookEvento(Base):
    __tablename__ = "webhook_eventos"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    wompi_event_id = Column(String(100), nullable=False, unique=True, index=True)
    evento = Column(String(100), nullable=True)
    referencia = Column(String(200), nullable=True)
    payload = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("wompi_event_id", name="uq_webhook_evento_wompi_id"),
    )

class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, index=True)
    codigo = Column(String)
    expira_en = Column(DateTime)