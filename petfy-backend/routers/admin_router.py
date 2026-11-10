# backend/routers/admin_router.py
import re
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Usuario, Rol, Servicio, Cita, Mascota, Factura
from schemas import CrearStaffRequest, CrearStaffResponse
from auth import hash_password
from routers.auth_router import usuario_autenticado

router = APIRouter(prefix="/admin", tags=["Administración"])

# ENDPOINT PARA CREAR PERSONAL (Paseadores, Bañadores, etc.)
@router.post("/staff", response_model=CrearStaffResponse)
def crear_staff(
    payload: CrearStaffRequest, 
    db: Session = Depends(get_db),
    admin_actual: Usuario = Depends(usuario_autenticado)
):
    # 1. Validar permisos
    if admin_actual.id_rol != 1:
        raise HTTPException(status_code=403, detail="Acceso denegado. Solo administradores.")

    # 2. Validar que los servicios seleccionados existan en la BD
    servicios_asignados = db.query(Servicio).filter(Servicio.id_servicio.in_(payload.servicios)).all()
    if not servicios_asignados:
        raise HTTPException(status_code=404, detail="Ninguno de los servicios seleccionados existe")

    # 3. Generar el correo con el prefijo "staff" (staff01, staff02, etc.)
    prefijo = "staff"
    
    ultimo_usuario = db.query(Usuario).filter(
        Usuario.correo.like(f"{prefijo}%@petfy.com")
    ).order_by(Usuario.correo.desc()).first()
    
    if ultimo_usuario:
        match = re.search(r'(\d+)', ultimo_usuario.correo)
        if match:
            siguiente_numero = int(match.group(1)) + 1
        else:
            siguiente_numero = 1
    else:
        siguiente_numero = 1

    nuevo_correo = f"{prefijo}{siguiente_numero:02d}@petfy.com"

    if db.query(Usuario).filter(Usuario.correo == nuevo_correo).first():
        raise HTTPException(status_code=400, detail="El correo generado ya existe. Intenta de nuevo.")

    # 4. Buscar el rol de Staff (id_rol = 3 EN TU BASE DE DATOS)
    rol_staff = db.query(Rol).filter(Rol.id_rol == 3).first()
    if not rol_staff:
        raise HTTPException(status_code=500, detail="El rol de Staff no está configurado en la BD")
    
    # 5. Crear el nuevo usuario
    nuevo_staff = Usuario(
        nombre=payload.nombre,
        apellido=payload.apellido,
        correo=nuevo_correo,
        contrasena=hash_password(payload.contrasena),
        telefono=payload.telefono,
        verificado=True,
        id_rol=3  # <-- ASIGNACIÓN CORRECTA
    )
    
    nuevo_staff.servicios = servicios_asignados
    
    db.add(nuevo_staff)
    db.commit()
    db.refresh(nuevo_staff)

    return CrearStaffResponse(
        mensaje=f"Empleado creado exitosamente. Se le asignaron {len(servicios_asignados)} servicio(s).",
        correo_generado=nuevo_correo,
        contrasena_temporal=payload.contrasena
    )

@router.get("/stats")
def get_stats(db: Session = Depends(get_db), admin_actual: Usuario = Depends(usuario_autenticado)):
    if admin_actual.id_rol != 1:
        raise HTTPException(status_code=403, detail="Solo administradores")
        
    return {
        "usuarios_total": db.query(Usuario).count(),
        "clientes": db.query(Usuario).filter(Usuario.id_rol == 2).count(),
        "staff": db.query(Usuario).filter(Usuario.id_rol == 3).count(),
        "mascotas": 0, 
        "citas_hoy": 0,
        "citas_pendientes": 0,
        "citas_completadas_mes": 0,
        "ingresos_mes": "0",
        "facturas_emitidas": 0,
        "devoluciones_pendientes": 0
    }

@router.get("/citas")
def get_citas_admin(
    page: int = 1,
    db: Session = Depends(get_db),
    admin_actual: Usuario = Depends(usuario_autenticado)
):
    if admin_actual.id_rol != 1:
        raise HTTPException(status_code=403, detail="Solo administradores")

    citas = db.query(Cita).order_by(Cita.fecha.desc(), Cita.hora.desc()).limit(10).all()
    
    return {
        "data": citas,
        "total": db.query(Cita).count(),
        "page": page
    }