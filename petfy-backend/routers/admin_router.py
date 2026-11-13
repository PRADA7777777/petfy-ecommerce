# backend/routers/admin_router.py
import re
from datetime import date, datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session

from database import get_db
from models import Usuario, Rol, Servicio, Cita, Mascota, Factura, Plan, UbicacionPaseo, NovedadPaseo, EstadoCita, EventoPaseo
from schemas import CrearStaffRequest, CrearStaffResponse, ActivarPaseadorRequest, AsignarPaseadorRequest, CambiarEstadoPaseoRequest
from auth import hash_password
from routers.auth_router import usuario_autenticado
from routers.citas_router import (
    ESTADO_CITA_PENDIENTE, ESTADO_CITA_CONFIRMADA, ESTADO_CITA_EN_CURSO,
    ESTADO_CITA_COMPLETADA, ESTADO_CITA_CANCELADA,
)
from services.codigos_paseo import asignar_codigos_paseo, enviar_codigos_al_cliente

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


# ═════════════════════════════════════════════════════════════
# MAPA DE PASEOS EN CURSO (georreferenciación)
# ═════════════════════════════════════════════════════════════

@router.get("/paseadores/activos")
def get_paseadores_activos(
    db: Session = Depends(get_db),
    admin_actual: Usuario = Depends(usuario_autenticado)
):
    # 1. Validar permisos
    if admin_actual.id_rol != 1:
        raise HTTPException(status_code=403, detail="Solo administradores")

    # 2. Paseos en curso agrupados por paseador: una huella por paseador en el mapa
    citas = db.query(Cita).filter(
        Cita.id_estado == ESTADO_CITA_EN_CURSO,
        Cita.id_usuario_paseador.isnot(None),
    ).order_by(Cita.fecha_hora_real).all()

    paseadores = {}
    for cita in citas:
        if cita.id_usuario_paseador not in paseadores:
            paseador = db.query(Usuario).filter(Usuario.id_usuario == cita.id_usuario_paseador).first()
            paseadores[cita.id_usuario_paseador] = {
                "id_usuario": paseador.id_usuario,
                "nombre": f"{paseador.nombre} {paseador.apellido}",
                "telefono": paseador.telefono,
                "inicio": cita.fecha_hora_real,
                "ultima_posicion": None,
                "mascotas": [],
            }
        grupo = paseadores[cita.id_usuario_paseador]

        # 3. La posición del paseador es el punto más reciente entre todas sus mascotas
        ultimo_punto = db.query(UbicacionPaseo).filter(
            UbicacionPaseo.id_cita == cita.id_cita
        ).order_by(UbicacionPaseo.fecha_hora.desc()).first()
        if ultimo_punto and (
            grupo["ultima_posicion"] is None
            or ultimo_punto.fecha_hora > grupo["ultima_posicion"]["fecha_hora"]
        ):
            grupo["ultima_posicion"] = {
                "lat": float(ultimo_punto.latitud),
                "lng": float(ultimo_punto.longitud),
                "fecha_hora": ultimo_punto.fecha_hora,
            }

        # 4. Datos de cada mascota que lleva
        mascota = db.query(Mascota).filter(Mascota.id_mascota == cita.id_mascota).first()
        dueno = db.query(Usuario).filter(Usuario.id_usuario == cita.id_usuario_cliente).first()
        plan = db.query(Plan).filter(Plan.id_plan == cita.id_plan).first() if cita.id_plan else None
        grupo["mascotas"].append({
            "id_cita": cita.id_cita,
            "id_mascota": cita.id_mascota,
            "nom_mascota": mascota.nom_mascota if mascota else None,
            "dueno": {
                "nombre": f"{dueno.nombre} {dueno.apellido}",
                "telefono": dueno.telefono,
            } if dueno else None,
            "direccion": cita.direccion,
            "complemento_direccion": cita.complemento_direccion,
            "zona": cita.zona,
            "plan": plan.nom_plan if plan else None,
            "duracion_minutos": plan.duracion_minutos if plan else None,
            "novedades": db.query(NovedadPaseo).filter(NovedadPaseo.id_cita == cita.id_cita).count(),
        })

    return list(paseadores.values())


# ═════════════════════════════════════════════════════════════
# PERSONAL: STAFF Y PASEADORES (georreferenciación)
# ═════════════════════════════════════════════════════════════

ROL_STAFF = 3
SERVICIO_PASEOS = "paseos"


def _datos_staff(db: Session, usuario: Usuario) -> dict:
    return {
        "id_usuario": usuario.id_usuario,
        "nombre": usuario.nombre,
        "apellido": usuario.apellido,
        "correo": usuario.correo,
        "telefono": usuario.telefono,
        "activo": usuario.activo,
        "servicios": [{"id_servicio": s.id_servicio, "nombre": s.nombre} for s in usuario.servicios],
        "paseos_en_curso": db.query(Cita).filter(
            Cita.id_usuario_paseador == usuario.id_usuario,
            Cita.id_estado == ESTADO_CITA_EN_CURSO,
        ).count(),
    }


def _listar_staff(db: Session, search: str, estado: str, page: int, pageSize: int, solo_paseadores: bool) -> dict:
    # 1. Solo empleados, y si se pide, solo los que tienen el servicio de paseos
    consulta = db.query(Usuario).filter(Usuario.id_rol == ROL_STAFF)
    if solo_paseadores:
        consulta = consulta.filter(Usuario.servicios.any(Servicio.nombre == SERVICIO_PASEOS))

    # 2. Filtros de la pantalla
    if search:
        patron = f"%{search.strip()}%"
        consulta = consulta.filter(or_(
            Usuario.nombre.ilike(patron),
            Usuario.apellido.ilike(patron),
            Usuario.correo.ilike(patron),
        ))
    if estado == "activo":
        consulta = consulta.filter(Usuario.activo == True)
    elif estado == "inactivo":
        consulta = consulta.filter(Usuario.activo == False)

    # 3. Paginación
    page = max(page, 1)
    pageSize = min(max(pageSize, 1), 100)
    total = consulta.count()
    usuarios = consulta.order_by(Usuario.nombre, Usuario.apellido).offset((page - 1) * pageSize).limit(pageSize).all()

    return {
        "data": [_datos_staff(db, u) for u in usuarios],
        "total": total,
        "page": page,
        "pageSize": pageSize,
    }


@router.get("/staff")
def get_staff(
    search: str = "",
    estado: str = "",
    page: int = 1,
    pageSize: int = 10,
    db: Session = Depends(get_db),
    admin_actual: Usuario = Depends(usuario_autenticado)
):
    if admin_actual.id_rol != 1:
        raise HTTPException(status_code=403, detail="Solo administradores")
    return _listar_staff(db, search, estado, page, pageSize, solo_paseadores=False)


@router.get("/paseadores")
def get_paseadores(
    search: str = "",
    estado: str = "",
    page: int = 1,
    pageSize: int = 10,
    db: Session = Depends(get_db),
    admin_actual: Usuario = Depends(usuario_autenticado)
):
    if admin_actual.id_rol != 1:
        raise HTTPException(status_code=403, detail="Solo administradores")
    return _listar_staff(db, search, estado, page, pageSize, solo_paseadores=True)


@router.put("/paseadores/{id_usuario}/activar")
def activar_paseador(
    id_usuario: int,
    payload: ActivarPaseadorRequest,
    db: Session = Depends(get_db),
    admin_actual: Usuario = Depends(usuario_autenticado)
):
    # 1. Validar permisos
    if admin_actual.id_rol != 1:
        raise HTTPException(status_code=403, detail="Solo administradores")

    # 2. Solo se activan o desactivan empleados
    empleado = db.query(Usuario).filter(
        Usuario.id_usuario == id_usuario,
        Usuario.id_rol == ROL_STAFF,
    ).first()
    if not empleado:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")

    # 3. No se desactiva a quien tiene un paseo en curso
    if not payload.activo and db.query(Cita).filter(
        Cita.id_usuario_paseador == empleado.id_usuario,
        Cita.id_estado == ESTADO_CITA_EN_CURSO,
    ).count() > 0:
        raise HTTPException(status_code=409, detail="El paseador tiene un paseo en curso; desactívalo cuando termine")

    empleado.activo = payload.activo
    db.commit()

    estado = "activado" if payload.activo else "desactivado"
    return {"mensaje": f"Empleado {estado}", "id_usuario": empleado.id_usuario, "activo": empleado.activo}


# ═════════════════════════════════════════════════════════════
# PASEOS: LISTADO Y ASIGNACIÓN DE PASEADOR (georreferenciación)
# ═════════════════════════════════════════════════════════════

CAPACIDAD_PASEADOR = 3  # perros al mismo tiempo (misma fecha y hora)


def _datos_paseo(db: Session, cita: Cita) -> dict:
    mascota = db.query(Mascota).filter(Mascota.id_mascota == cita.id_mascota).first()
    cliente = db.query(Usuario).filter(Usuario.id_usuario == cita.id_usuario_cliente).first()
    paseador = db.query(Usuario).filter(Usuario.id_usuario == cita.id_usuario_paseador).first() if cita.id_usuario_paseador else None
    estado = db.query(EstadoCita).filter(EstadoCita.id_estado == cita.id_estado).first()
    llego = db.query(EventoPaseo).filter(
        EventoPaseo.id_cita == cita.id_cita,
        EventoPaseo.tipo_evento == "LLEGADA",
    ).first() is not None

    return {
        "id_cita": cita.id_cita,
        "fecha": cita.fecha,
        "hora": cita.hora.strftime("%H:%M") if cita.hora else None,
        "id_estado": cita.id_estado,
        "estado": estado.nom_estado if estado else None,
        "llego": llego,
        "zona": cita.zona,
        "direccion": cita.direccion,
        "complemento_direccion": cita.complemento_direccion,
        "id_usuario_paseador": cita.id_usuario_paseador,
        "paseador": {
            "id_usuario": paseador.id_usuario,
            "nombre": paseador.nombre,
            "apellido": paseador.apellido,
        } if paseador else None,
        "mascota": {
            "id_mascota": mascota.id_mascota,
            "nom_mascota": mascota.nom_mascota,
        } if mascota else None,
        "cliente": {
            "nombre": cliente.nombre,
            "apellido": cliente.apellido,
            "telefono": cliente.telefono,
        } if cliente else None,
    }


def _perros_en_franja(db: Session, id_paseador: int, fecha, hora, excluir_cita: int = None) -> int:
    consulta = db.query(Cita).filter(
        Cita.id_usuario_paseador == id_paseador,
        Cita.fecha == fecha,
        Cita.hora == hora,
        Cita.id_estado != ESTADO_CITA_CANCELADA,
    )
    if excluir_cita:
        consulta = consulta.filter(Cita.id_cita != excluir_cita)
    return consulta.count()


@router.get("/paseos")
def get_paseos(
    fecha: str = "",
    estado: str = "",
    paseador: str = "",
    page: int = 1,
    pageSize: int = 50,
    db: Session = Depends(get_db),
    admin_actual: Usuario = Depends(usuario_autenticado)
):
    if admin_actual.id_rol != 1:
        raise HTTPException(status_code=403, detail="Solo administradores")

    # 1. Solo citas del servicio de paseos
    consulta = db.query(Cita).join(Plan, Plan.id_plan == Cita.id_plan).join(
        Servicio, Servicio.id_servicio == Plan.id_servicio
    ).filter(Servicio.nombre == SERVICIO_PASEOS)

    # 2. Filtros de la pantalla
    if fecha:
        try:
            consulta = consulta.filter(Cita.fecha == date.fromisoformat(fecha))
        except ValueError:
            raise HTTPException(status_code=400, detail="Formato de fecha inválido")
    if estado.isdigit():
        consulta = consulta.filter(Cita.id_estado == int(estado))
    if paseador.isdigit():
        consulta = consulta.filter(Cita.id_usuario_paseador == int(paseador))

    # 3. Paginación
    page = max(page, 1)
    pageSize = min(max(pageSize, 1), 200)
    total = consulta.count()
    citas = consulta.order_by(Cita.fecha, Cita.hora).offset((page - 1) * pageSize).limit(pageSize).all()

    return {
        "data": [_datos_paseo(db, c) for c in citas],
        "total": total,
        "page": page,
        "pageSize": pageSize,
    }


@router.get("/paseos/hoy")
def get_paseos_hoy(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(usuario_autenticado)
):
    # 1. El administrador ve todos los paseos de hoy; el paseador, solo los suyos
    if usuario.id_rol not in (1, ROL_STAFF):
        raise HTTPException(status_code=403, detail="Acceso denegado")

    consulta = db.query(Cita).filter(
        Cita.fecha == date.today(),
        Cita.id_estado != ESTADO_CITA_CANCELADA,
    )
    if usuario.id_rol == ROL_STAFF:
        consulta = consulta.filter(Cita.id_usuario_paseador == usuario.id_usuario)

    citas = consulta.order_by(Cita.hora).all()
    return {"todos": [_datos_paseo(db, c) for c in citas]}


@router.put("/paseos/{id_cita}/asignar")
def asignar_paseador(
    id_cita: int,
    payload: AsignarPaseadorRequest,
    db: Session = Depends(get_db),
    admin_actual: Usuario = Depends(usuario_autenticado)
):
    # 1. Validar permisos
    if admin_actual.id_rol != 1:
        raise HTTPException(status_code=403, detail="Solo administradores")

    # 2. Solo se asigna en citas que todavía no empiezan
    cita = db.query(Cita).filter(Cita.id_cita == id_cita).first()
    if not cita:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    if cita.id_estado not in (ESTADO_CITA_PENDIENTE, ESTADO_CITA_CONFIRMADA):
        raise HTTPException(status_code=409, detail="Solo se puede asignar en citas pendientes o confirmadas")

    # 3. Quitar el paseador
    if payload.id_usuario_paseador is None:
        cita.id_usuario_paseador = None
        cita.fecha_asignacion = None
        db.commit()
        return {"mensaje": "Paseador retirado", "id_cita": cita.id_cita}

    # 4. Debe ser un paseador activo
    paseador = db.query(Usuario).filter(
        Usuario.id_usuario == payload.id_usuario_paseador,
        Usuario.id_rol == ROL_STAFF,
    ).first()
    if not paseador or not any(s.nombre == SERVICIO_PASEOS for s in paseador.servicios):
        raise HTTPException(status_code=404, detail="Paseador no encontrado")
    if not paseador.activo:
        raise HTTPException(status_code=409, detail="El paseador está inactivo")

    # 5. Máximo 3 perros en la misma franja
    ocupados = _perros_en_franja(db, paseador.id_usuario, cita.fecha, cita.hora, excluir_cita=cita.id_cita)
    if ocupados >= CAPACIDAD_PASEADOR:
        raise HTTPException(
            status_code=409,
            detail=f"El paseador ya tiene {CAPACIDAD_PASEADOR} perros en esa franja",
        )

    cita.id_usuario_paseador = paseador.id_usuario
    cita.fecha_asignacion = datetime.now()
    db.commit()

    return {
        "mensaje": "Paseador asignado",
        "id_cita": cita.id_cita,
        "id_usuario_paseador": paseador.id_usuario,
        "perros_en_franja": ocupados + 1,
    }


@router.put("/paseos/{id_cita}/estado")
def cambiar_estado_paseo(
    id_cita: int,
    payload: CambiarEstadoPaseoRequest,
    db: Session = Depends(get_db),
    admin_actual: Usuario = Depends(usuario_autenticado)
):
    # 1. Validar permisos
    if admin_actual.id_rol != 1:
        raise HTTPException(status_code=403, detail="Solo administradores")

    cita = db.query(Cita).filter(Cita.id_cita == id_cita).first()
    if not cita:
        raise HTTPException(status_code=404, detail="Cita no encontrada")

    # 2. "En curso" y "Completada" solo los pone el paseador con el código y al finalizar
    if payload.id_estado not in (ESTADO_CITA_PENDIENTE, ESTADO_CITA_CONFIRMADA, ESTADO_CITA_CANCELADA):
        raise HTTPException(status_code=400, detail="Ese estado lo registra el paseador durante el paseo")
    if cita.id_estado in (ESTADO_CITA_EN_CURSO, ESTADO_CITA_COMPLETADA):
        raise HTTPException(status_code=409, detail="No se puede cambiar el estado de un paseo en curso o terminado")

    cita.id_estado = payload.id_estado

    # 3. Al confirmarla a mano también recibe su código de inicio
    codigos_nuevos = asignar_codigos_paseo(db, [cita]) if payload.id_estado == ESTADO_CITA_CONFIRMADA else []
    db.commit()
    if codigos_nuevos:
        enviar_codigos_al_cliente(db, codigos_nuevos)

    return {"mensaje": "Estado actualizado", "id_cita": cita.id_cita, "id_estado": cita.id_estado}