# backend/models.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Numeric, Date, Time, SmallInteger, JSON
from datetime import datetime
from sqlalchemy.orm import relationship
from database import Base

class Rol(Base):
    __tablename__ = "roles"
    __table_args__ = {"schema": "petfy_db"}
    id_rol = Column(Integer, primary_key=True)
    nombre_rol = Column(String(50), unique=True, nullable=False)

class Cargo(Base):
    __tablename__ = "cargos"
    __table_args__ = {"schema": "petfy_db"}
    id_cargo = Column(Integer, primary_key=True)
    nom_cargo = Column(String(100), nullable=False)
    descripcion = Column(Text)

class TipoDocumento(Base):
    __tablename__ = "tipos_documentos"
    __table_args__ = {"schema": "petfy_db"}
    id_tipo_doc = Column(Integer, primary_key=True)
    nom_tipo_doc = Column(String(50), unique=True, nullable=False)

class EstadoCita(Base):
    __tablename__ = "estados_citas"
    __table_args__ = {"schema": "petfy_db"}
    id_estado = Column(Integer, primary_key=True)
    nom_estado = Column(String(100), nullable=False)


class EstadoPago(Base):
    __tablename__ = "estados_pago"
    __table_args__ = {"schema": "petfy_db"}
    id_estado_pago = Column(Integer, primary_key=True)
    nom_estado_pago = Column(String(100), nullable=False)


class MetodoPago(Base):
    __tablename__ = "metodos_pago"
    __table_args__ = {"schema": "petfy_db"}
    id_metodo_pago = Column(Integer, primary_key=True)
    nom_metodo = Column(String(100), nullable=False)
    descripcion = Column(Text)
    activo = Column(Boolean, default=True)

class Factura(Base):
    __tablename__ = "facturas"
    __table_args__ = {"schema": "petfy_db"}
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

    id_est_fact = Column(Integer, ForeignKey("petfy_db.estados_facturas.id_est_fact"))
    id_cita = Column(Integer, ForeignKey("petfy_db.citas.id_cita"))
    id_pago = Column(Integer, ForeignKey("petfy_db.pagos.id_pago"))

    detalles = relationship("FacturaDetalle", back_populates="factura", cascade="all, delete-orphan")

class FacturaDetalle(Base):
    __tablename__ = "facturas_detalle"
    __table_args__ = {"schema": "petfy_db"}
    id_fact_detalle = Column(Integer, primary_key=True)
    concepto = Column(Text, nullable=False)
    cantidad = Column(Integer, nullable=False)
    total_linea = Column(Numeric(10, 2), nullable=False)
    iva = Column(Numeric(10, 2), nullable=False)
    precio_uni = Column(Numeric(10, 2), nullable=False)
    id_factura = Column(Integer, ForeignKey("petfy_db.facturas.id_factura", ondelete="CASCADE"))

    factura = relationship("Factura", back_populates="detalles")

class EstadoFactura(Base):
    __tablename__ = "estados_facturas"
    __table_args__ = {"schema": "petfy_db"}
    id_est_fact = Column(Integer, primary_key=True)
    nom_est_fact = Column(String(100), nullable=False)


class EstadoDevolucion(Base):
    __tablename__ = "estados_devoluciones"
    __table_args__ = {"schema": "petfy_db"}
    id_est_devo = Column(Integer, primary_key=True)
    nom_est_devo = Column(String(100), nullable=False)

class Usuario(Base):
    __tablename__ = "usuarios"
    __table_args__ = {"schema": "petfy_db"}
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
    id_tipo_doc = Column(Integer, ForeignKey("petfy_db.tipos_documentos.id_tipo_doc"))
    id_rol = Column(Integer, ForeignKey("petfy_db.roles.id_rol"), nullable=False)
    id_cargo = Column(Integer, ForeignKey("petfy_db.cargos.id_cargo"))

    rol = relationship("Rol")
    cargo = relationship("Cargo")
    tipo_doc = relationship("TipoDocumento") 
    documento = relationship("DocIdentidad", back_populates="usuario", uselist=False)
    mascotas = relationship("Mascota", back_populates="usuario")

class DocIdentidad(Base):
    __tablename__ = "documentos_identidad"
    __table_args__ = {"schema": "petfy_db"}
    id_doc = Column(Integer, primary_key=True)
    num_doc = Column(String(50), nullable=False)
    id_tipo_doc = Column(Integer, ForeignKey("petfy_db.tipos_documentos.id_tipo_doc"), nullable=False)
    id_usuario = Column(Integer, ForeignKey("petfy_db.usuarios.id_usuario"), unique=True, nullable=False)

    usuario = relationship("Usuario", back_populates="documento")
    tipo = relationship("TipoDocumento")

class Mascota(Base):
    __tablename__ = "mascotas"
    __table_args__ = {"schema": "petfy_db"}
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
    id_raza = Column(Integer, ForeignKey("petfy_db.razas.id_raza"))
    id_comportamiento = Column(Integer, ForeignKey("petfy_db.comportamientos.id_comport"))
    id_condicion_medica = Column(Integer, ForeignKey("petfy_db.condiciones_medicas.id_condicion"))
    id_usuario = Column(Integer, ForeignKey("petfy_db.usuarios.id_usuario"), nullable=False)

    usuario = relationship("Usuario", back_populates="mascotas")
    raza_rel = relationship("Raza")

class Comportamiento(Base):
    __tablename__ = "comportamientos"
    __table_args__ = {"schema" : "petfy_db"}
    id_comport = Column(Integer, primary_key=True)
    nom_comportamiento = Column(String(150), nullable=False)


class CondicionMedica(Base):
    __tablename__ = "condiciones_medicas"
    __table_args__ = {"schema" : "petfy_db"}
    id_condicion = Column(Integer, primary_key=True)
    nom_condicion = Column(String(150), nullable=False)

class Raza(Base):
    __tablename__ = "razas"
    __table_args__ = {"schema" : "petfy_db"}
    id_raza = Column(Integer, primary_key=True)
    nom_raza = Column(String(100), nullable=False, unique=True)

class Servicio(Base):
    __tablename__ = "servicios"
    __table_args__ = {"schema": "petfy_db"}
    id_servicio = Column(Integer, primary_key=True)
    nombre      = Column(String(100), unique=True, nullable=False)
    descripcion = Column(Text)
    icono       = Column(String(20))
    activo      = Column(Boolean, default=True)
    orden       = Column(Integer, default=0)

class Plan(Base):
    __tablename__ = "planes"
    __table_args__ = {"schema": "petfy_db"}
    id_plan         = Column(Integer, primary_key=True)
    nom_plan        = Column(String(150), nullable=False)
    descripcion     = Column(Text)
    precio_actual   = Column(Numeric(10, 2), nullable=False)
    dias_permitidos = Column(Integer, default=1)
    duracion_minutos = Column(Integer, default=55)
    orden           = Column(Integer, default=0)
    activo          = Column(Boolean, default=True)
    id_servicio     = Column(Integer, ForeignKey("petfy_db.servicios.id_servicio"), nullable=False)

class Cita(Base):
    __tablename__ = "citas"
    __table_args__ = {"schema" : "petfy_db"}
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

    id_estado = Column(Integer, ForeignKey("petfy_db.estados_citas.id_estado"))
    id_mascota = Column(Integer, ForeignKey("petfy_db.mascotas.id_mascota"))
    id_usuario_cliente = Column(Integer, ForeignKey("petfy_db.usuarios.id_usuario"))
    id_usuario_paseador = Column(Integer, ForeignKey("petfy_db.usuarios.id_usuario"))
    id_suscripcion = Column(Integer, ForeignKey("petfy_db.suscripciones.id_suscripcion", ondelete="SET NULL"))
    id_plan = Column(Integer, ForeignKey("petfy_db.planes.id_plan"))

    dias_semana = Column(String(100))
    persona_entrega = Column(String(150))
    persona_recibe = Column(String(150))

class Pago(Base):
    __tablename__ = "pagos"
    __table_args__ = {"schema" : "petfy_db"}
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

    id_metodo_pago = Column(Integer, ForeignKey("petfy_db.metodos_pago.id_metodo_pago"))
    id_estado_pago = Column(Integer, ForeignKey("petfy_db.estados_pago.id_estado_pago"))
    id_cita = Column(Integer, ForeignKey("petfy_db.citas.id_cita"))

class DisponibilidadServicio(Base):
    __tablename__ = "disponibilidad_servicio"
    __table_args__ = {"schema": "petfy_db"}
    id_disponibilidad = Column(Integer, primary_key=True)
    id_servicio = Column(
        Integer,
        ForeignKey("petfy_db.servicios.id_servicio", ondelete="CASCADE"),
        nullable=False,
    )
    dia_semana = Column(SmallInteger, nullable=False)  # 0=Dom..6=Sáb
    hora_inicio = Column(Time, nullable=False, default="06:00")
    hora_fin = Column(Time, nullable=False, default="20:00")
    activo = Column(Boolean, nullable=False, default=True)


class ExcepcionDisponibilidad(Base):
    __tablename__ = "excepciones_disponibilidad"
    __table_args__ = {"schema": "petfy_db"}
    id_excepcion = Column(Integer, primary_key=True)
    id_servicio = Column(
        Integer,
        ForeignKey("petfy_db.servicios.id_servicio", ondelete="CASCADE"),
        nullable=False,
    )
    fecha = Column(Date, nullable=False)
    motivo = Column(Text)
    es_laborable = Column(Boolean, nullable=False, default=False)
    hora_inicio = Column(Time)
    hora_fin = Column(Time)

class Suscripcion(Base):
    __tablename__ = "suscripciones"
    __table_args__ = {"schema": "petfy_db"}
    id_suscripcion = Column(Integer, primary_key=True)
    id_usuario = Column(Integer, ForeignKey("petfy_db.usuarios.id_usuario", ondelete="CASCADE"), nullable=False)
    id_mascota = Column(Integer, ForeignKey("petfy_db.mascotas.id_mascota", ondelete="CASCADE"), nullable=False)
    id_plan = Column(Integer, ForeignKey("petfy_db.planes.id_plan"), nullable=False)
    fecha_inicio = Column(Date, nullable=False)
    fecha_fin = Column(Date, nullable=False)
    hora_preferida = Column(Time)
    dias_semana = Column(String(50))
    activa = Column(Boolean, default=True, nullable=False)
    fecha_creacion = Column(DateTime, default=datetime.now)