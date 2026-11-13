# backend/schemas.py
from pydantic import BaseModel, EmailStr, Field
from datetime import date, time
from typing import Optional, List

class Config:
    from_attributes = True

class CatalogoItem(BaseModel):
    id: int
    nombre: str

class TipoDocumentoOut(BaseModel):
    idtipodoc: int
    nomtipodoc: str

class RegistroRequest(BaseModel):
    nombre: str = Field(..., min_length=2, max_length=100)
    apellido: str = Field(..., min_length=2, max_length=100)
    correo: EmailStr
    contrasena: str = Field(..., min_length=8, max_length=50)
    telefono: str = Field(..., pattern=r"^\+?[0-9\s\-]{7,15}$")
    direccion: str = Field(..., min_length=5)
    idtipodoc: int
    numdoc: str = Field(..., min_length=5, max_length=20)

class RegistroResponse(BaseModel):
    mensaje: str
    idusuario: int
    correo: str

class VerificarRequest(BaseModel):
    correo: EmailStr
    codigo: str

class LoginRequest(BaseModel):
    correo: EmailStr
    contrasena: str

# --- NUEVO ESQUEMA PARA LOS SERVICIOS (Ya lo tenías, lo mantenemos) ---
class ServicioOut(BaseModel):
    id_servicio: int
    nombre: str
    descripcion: Optional[str] = None
    icono: Optional[str] = None
    orden: int
    class Config:
        from_attributes = True

# --- NUEVO ESQUEMA PARA EL USUARIO LOGUEADO ---
class UsuarioLoginOut(BaseModel):
    idusuario: int
    id_usuario: int
    nombre: str
    apellido: str
    correo: str
    id_rol: int
    servicios: List[ServicioOut] = []
    verificado: bool

# --- LOGIN RESPONSE CORREGIDO ---
class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    usuario: UsuarioLoginOut # <-- Ahora es un objeto estricto, no un dict
    primer_ingreso: bool
    tiene_mascotas: bool

class MascotaRequest(BaseModel):
    nommascota: str
    raza: Optional[str] = None
    id_raza: Optional[int] = None
    peso: Optional[float] = None
    edad: Optional[int] = None
    carne_vacunacion: Optional[str] = None
    otras_indicaciones: Optional[str] = None
    observar_condicion: Optional[str] = None
    observar_comportamiento: Optional[str] = None
    img_masc: Optional[str] = None
    id_comportamiento: Optional[int] = None
    id_condicion_medica: Optional[int] = None

class MascotaOut(BaseModel):
    id_mascota: int
    nom_mascota: str
    raza: Optional[str] = None
    id_raza: Optional[int] = None
    nom_raza: Optional[str] = None
    peso: Optional[float] = None
    edad: Optional[int] = None
    carne_vacunacion: Optional[str] = None
    otras_indicaciones: Optional[str] = None
    observar_condicion: Optional[str] = None
    observar_comportamiento: Optional[str] = None
    img_masc: Optional[str] = None
    id_comportamiento: Optional[int] = None
    id_condicion_medica: Optional[int] = None

class ActualizarPerfilRequest(BaseModel):
    nombre: str
    apellido: str
    telefono: Optional[str] = None
    direccion: Optional[str] = None

class CambiarPasswordRequest(BaseModel):
    contrasena_actual: str
    contrasena_nueva: str = Field(..., min_length=8, max_length=72)

class PlanOut(BaseModel):
    id_plan: int
    nom_plan: str
    descripcion: Optional[str] = None
    precio_actual: float
    dias_permitidos: int
    duracion_minutos: Optional[int] = 55
    orden: int
    id_servicio: int
    class Config:
        from_attributes = True

class CitaRequest(BaseModel):
    id_mascota: int
    id_plan: int
    fecha: str
    hora: str
    zona: Optional[str] = None
    direccion: str
    complemento_direccion: Optional[str] = None
    es_conjunto: bool = False
    torre: Optional[str] = None
    apto: Optional[str] = None
    dias_semana: list[str] = []
    persona_entrega: Optional[str] = None
    persona_recibe: Optional[str] = None
    es_paseo_prueba: bool = False
    recurrente: bool = False  

class CitaResponse(BaseModel):
    id_cita: int
    monto: float
    referencia: str
    estado: str
    firma_integridad: str
    id_suscripcion: Optional[int] = None
    citas_generadas: Optional[list[dict]] = None

class DiaDisponible(BaseModel):
    dia_semana: int
    label: str
    hora_inicio: str
    hora_fin: str

class ExcepcionOut(BaseModel):
    fecha: str
    motivo: Optional[str] = None
    es_laborable: bool

class DisponibilidadOut(BaseModel):
    id_plan: int
    id_servicio: int
    dias_permitidos: int
    dias_disponibles: list[DiaDisponible]
    excepciones: list[ExcepcionOut]

class ReprogramarRequest(BaseModel):
    fecha: str
    hora: Optional[str] = None

class SlotHora(BaseModel):
    hora: str
    ocupados: int
    capacidad: int
    disponible: bool

class DisponibilidadDiaOut(BaseModel):
    fecha: str
    laborable: bool
    motivo: Optional[str] = None
    slots: list[SlotHora] = []

class CambiarRutinaRequest(BaseModel):
    dias_semana: list[str] = Field(..., min_length=1, max_length=7)

class CambiarDiaRequest(BaseModel):
    fecha: str

class RecuperarPasswordRequest(BaseModel):
    email: EmailStr

class VerificarCodigoRequest(BaseModel):
    email: EmailStr
    codigo: str

class RecuperarCambiarPasswordRequest(BaseModel):
    email: EmailStr
    codigo: str
    nueva_password: str

class CrearStaffRequest(BaseModel):
    nombre: str = Field(..., min_length=2, max_length=100)
    apellido: str = Field(..., min_length=2, max_length=100)
    telefono: str = Field(..., pattern=r"^\+?[0-9\s\-]{7,15}$")
    servicios: List[int] = Field(..., min_items=1) # <-- Ahora recibe una lista de IDs de servicios
    contrasena: str = Field(..., min_length=8, max_length=50)

class CrearStaffResponse(BaseModel):
    mensaje: str
    correo_generado: str
    contrasena_temporal: str

# --- GEORREFERENCIACIÓN DEL PASEO ---

class IniciarPaseoRequest(BaseModel):
    codigo: str = Field(..., pattern=r"^[0-9]{4}$")

class PuntoGPSRequest(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)

class NovedadRequest(BaseModel):
    texto: str = Field(..., min_length=1, max_length=500)

class FinalizarPaseoRequest(BaseModel):
    foto: str = Field(..., max_length=3_000_000, pattern=r"^data:image/(png|jpeg|jpg|webp);base64,")
    novedad: Optional[str] = Field(None, max_length=500)

class ActivarPaseadorRequest(BaseModel):
    activo: bool

class AsignarPaseadorRequest(BaseModel):
    id_usuario_paseador: Optional[int] = None

class CambiarEstadoPaseoRequest(BaseModel):
    id_estado: int

class AsignacionItem(BaseModel):
    id_cita: int
    id_usuario_paseador: int

class AsignarMasivoRequest(BaseModel):
    asignaciones: List[AsignacionItem] = Field(..., min_length=1)
