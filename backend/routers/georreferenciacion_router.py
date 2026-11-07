# backend/routers/georreferenciacion_router.py
import secrets
from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from database import get_db
from models import Cita, Mascota, Plan, Usuario
from models_georref import EventoPaseo, IdentificadorMascota, NovedadPaseo, UbicacionPaseo
from routers.citas_router import (
    ESTADO_CITA_COMPLETADA,
    ESTADO_CITA_CONFIRMADA,
    ESTADO_CITA_EN_CURSO,
)
from routers.mascotas_router import usuario_actual
from schemas_georref import ConfirmarEscaneoRequest, NovedadRequest, UbicacionRequest

router = APIRouter(prefix="/georreferenciacion", tags=["Georreferenciación"])

ID_ROL_ADMINISTRADOR = 1
ID_ROL_PASEADOR = 3


def _mascota_autorizada(id_mascota: int, usuario: Usuario, db: Session) -> Mascota:
    """Devuelve la mascota si el usuario es su dueño o es administrador.
    Responde 404 en cualquier otro caso (no revela si la mascota existe)."""
    consulta = db.query(Mascota).filter(Mascota.id_mascota == id_mascota)
    if not es_administrador(usuario):
        consulta = consulta.filter(Mascota.id_usuario == usuario.id_usuario)
    mascota = consulta.first()
    if not mascota:
        raise HTTPException(status_code=404, detail="Mascota no encontrada")
    return mascota


@router.get("/mascotas/{id_mascota}/codigo")
def obtener_codigo(
    id_mascota: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(usuario_actual),
):
    """Devuelve el código activo de la mascota SIN cambiarlo (para mostrar
    o imprimir el QR). Si aún no tiene código, codigo = null."""
    mascota = _mascota_autorizada(id_mascota, usuario, db)
    activo = db.query(IdentificadorMascota).filter(
        IdentificadorMascota.id_mascota == mascota.id_mascota,
        IdentificadorMascota.fecha_anulacion.is_(None),
    ).first()
    return {
        "id_mascota": mascota.id_mascota,
        "nom_mascota": mascota.nom_mascota,
        "codigo": activo.codigo if activo else None,
        "fecha_creacion": activo.fecha_creacion if activo else None,
    }


@router.post("/mascotas/{id_mascota}/codigo")
def generar_codigo(
    id_mascota: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(usuario_actual),
):
    # 0. Validar dueño o administrador
    mascota = _mascota_autorizada(id_mascota, usuario, db)

    try:
        # 1. Anular el código activo, si existe
        db.query(IdentificadorMascota).filter(
            IdentificadorMascota.id_mascota == mascota.id_mascota,
            IdentificadorMascota.fecha_anulacion.is_(None),
        ).update(
            {IdentificadorMascota.fecha_anulacion: func.now()},
            synchronize_session=False,
        )

        # 2 y 3. Generar el código nuevo e insertarlo
        nuevo = IdentificadorMascota(
            id_mascota=mascota.id_mascota,
            codigo=secrets.token_urlsafe(16),
        )
        db.add(nuevo)

        # Todo se confirma junto (transacción)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="No se pudo generar el código, intenta de nuevo")

    db.refresh(nuevo)
    return {
        "id_mascota": mascota.id_mascota,
        "nom_mascota": mascota.nom_mascota,
        "codigo": nuevo.codigo,
        "fecha_creacion": nuevo.fecha_creacion,
    }


# ─────────────────────────────────────────────────────────────
# PUNTOS DE INTEGRACIÓN (roles y asignación de paseadores)
# Por ahora, el rol de paseador y la asignación del paseador a cada
# cita se configuran a mano en la base de datos, hasta que se integren
# los roles y sus vistas (administrador y paseador). Este módulo no crea
# paseadores ni asigna citas: solo lee esos datos. Cuando esa
# integración exista, solo se ajustan estas dos funciones.
# ─────────────────────────────────────────────────────────────

def es_administrador(usuario: Usuario) -> bool:
    """Quién ve la información de todos los paseos.
    Por ahora: rol Administrador (id_rol = 1).
    Se ajusta cuando se integren los roles y cargos en las vistas."""
    return usuario.id_rol == ID_ROL_ADMINISTRADOR


def es_personal_de_paseo(usuario: Usuario) -> bool:
    """Quién puede registrar recogidas y entregas.
    Por ahora: rol Paseador (id_rol = 3) o Administrador.
    Se ajusta cuando se integren los roles y cargos en las vistas."""
    return usuario.id_rol == ID_ROL_PASEADOR or es_administrador(usuario)


def puede_escanear(usuario: Usuario, cita: Cita) -> bool:
    """Si el usuario es el paseador de esta cita.
    Por ahora: compara con citas.id_usuario_paseador (asignado a mano).
    Se ajusta cuando se integre la asignación de paseadores en las vistas."""
    return cita.id_usuario_paseador == usuario.id_usuario


def _cita_en_curso_del_paseador(id_cita: int, usuario: Usuario, db: Session, motivo: str) -> Cita:
    """Validaciones para registrar datos durante el paseo (ubicación y novedades).
    Solo el paseador asignado y solo mientras la cita está En Curso."""
    if not es_personal_de_paseo(usuario):
        raise HTTPException(status_code=403, detail=motivo)

    cita = db.query(Cita).filter(Cita.id_cita == id_cita).first()
    if not cita or not puede_escanear(usuario, cita):
        raise HTTPException(status_code=404, detail="Cita no encontrada")

    if cita.id_estado != ESTADO_CITA_EN_CURSO:
        raise HTTPException(status_code=409, detail="El paseo no está en curso")
    return cita


def _cita_del_dueno_o_admin(id_cita: int, usuario: Usuario, db: Session):
    """Devuelve (cita, mascota) si el usuario es el dueño de la mascota o administrador.
    Responde 404 con el mismo mensaje si la cita no existe o no tiene acceso."""
    cita = db.query(Cita).filter(Cita.id_cita == id_cita).first()
    if not cita:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    try:
        mascota = _mascota_autorizada(cita.id_mascota, usuario, db)
    except HTTPException:
        # Mismo mensaje que una cita inexistente: no revelar que la cita existe
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    return cita, mascota


def _resolver_escaneo(codigo: str, usuario: Usuario, db: Session):
    """Validaciones compartidas por la consulta y la confirmación del escaneo.
    Devuelve (identificador, cita, mascota, accion)."""
    # 1. Solo paseadores o administradores
    if not es_personal_de_paseo(usuario):
        raise HTTPException(status_code=403, detail="No tienes permiso para registrar paseos")

    # 2. El código debe existir y estar activo
    identificador = db.query(IdentificadorMascota).filter(
        IdentificadorMascota.codigo == codigo,
        IdentificadorMascota.fecha_anulacion.is_(None),
    ).first()
    if not identificador:
        raise HTTPException(status_code=404, detail="Código no válido")

    # 3. Citas de hoy de esa mascota, confirmadas o en curso
    #    (primero las "En Curso": si hay un paseo abierto, toca entregarlo)
    citas_hoy = db.query(Cita).filter(
        Cita.id_mascota == identificador.id_mascota,
        Cita.fecha == date.today(),
        Cita.id_estado.in_([ESTADO_CITA_CONFIRMADA, ESTADO_CITA_EN_CURSO]),
    ).order_by(Cita.id_estado.desc(), Cita.hora.asc()).all()

    cita = next((c for c in citas_hoy if puede_escanear(usuario, c)), None)
    if not cita:
        raise HTTPException(status_code=404, detail="No tienes un paseo asignado hoy para esta mascota")

    # 4. Recogida o entrega según el estado
    mascota = db.query(Mascota).filter(Mascota.id_mascota == cita.id_mascota).first()
    accion = "entrega" if cita.id_estado == ESTADO_CITA_EN_CURSO else "recogida"
    return identificador, cita, mascota, accion


@router.get("/escaneo/{codigo}")
def resolver_escaneo(
    codigo: str,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(usuario_actual),
):
    """Consulta qué acción corresponde al escanear un código.
    Solo lectura: no registra nada (eso lo hace la confirmación)."""
    _, cita, mascota, accion = _resolver_escaneo(codigo, usuario, db)
    # Datos del dueño para el aviso por WhatsApp (solo los recibe el paseador
    # ya validado como asignado a esta cita)
    dueno = db.query(Usuario).filter(Usuario.id_usuario == cita.id_usuario_cliente).first()
    return {
        "accion": accion,
        "id_cita": cita.id_cita,
        "id_mascota": cita.id_mascota,
        "nom_mascota": mascota.nom_mascota if mascota else None,
        "hora_agendada": cita.hora.strftime("%H:%M") if cita.hora else None,
        "hora_recogida": cita.fecha_hora_real.strftime("%H:%M") if cita.fecha_hora_real else None,
        "direccion": cita.direccion,
        "nombre_dueno": dueno.nombre if dueno else None,
        "telefono_dueno": dueno.telefono if dueno else None,
    }


@router.post("/escaneo/{codigo}/confirmar")
def confirmar_escaneo(
    codigo: str,
    payload: ConfirmarEscaneoRequest,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(usuario_actual),
):
    """Registra la recogida o la entrega y avanza el estado de la cita:
    Confirmada -> En Curso (recogida) -> Completada (entrega)."""
    identificador, cita, mascota, accion = _resolver_escaneo(codigo, usuario, db)

    try:
        evento = EventoPaseo(
            id_cita=cita.id_cita,
            id_identificador=identificador.id_identificador,
            id_usuario=usuario.id_usuario,
            tipo_evento=accion.upper(),
            metodo_lectura=payload.metodo_lectura,
            latitud=payload.latitud,
            longitud=payload.longitud,
        )
        db.add(evento)

        if accion == "recogida":
            cita.id_estado = ESTADO_CITA_EN_CURSO
            cita.fecha_hora_real = func.now()
        else:
            cita.id_estado = ESTADO_CITA_COMPLETADA
            cita.fecha_fin_real = func.now()

        db.commit()  # evento + cambio de estado en la misma transacción
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Este evento ya fue registrado")

    db.refresh(evento)
    return {
        "accion": accion,
        "id_evento": evento.id_evento,
        "id_cita": cita.id_cita,
        "nom_mascota": mascota.nom_mascota if mascota else None,
        "fecha_hora_evento": evento.fecha_hora,
    }


# ---------------------------------------------------------------------
# Ubicación en vivo (etapa 2)
# ---------------------------------------------------------------------

@router.post("/citas/{id_cita}/ubicacion", status_code=201)
def registrar_ubicacion(
    id_cita: int,
    payload: UbicacionRequest,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(usuario_actual),
):
    """Guarda un punto de la ruta del paseador. Solo se acepta mientras
    la cita está En Curso (entre la recogida y la entrega).
    Las mascotas que el paseador lleva al mismo tiempo están donde él está: el punto
    se guarda en todas sus citas en curso, para que ningún recorrido quede cortado."""
    cita = _cita_en_curso_del_paseador(
        id_cita, usuario, db, "Solo el personal de paseo puede enviar ubicación"
    )

    citas_en_curso = (
        db.query(Cita)
        .filter(
            Cita.id_usuario_paseador == usuario.id_usuario,
            Cita.id_estado == ESTADO_CITA_EN_CURSO,
        )
        .all()
    )

    ubicaciones = [
        UbicacionPaseo(
            id_cita=c.id_cita,
            id_usuario=usuario.id_usuario,
            latitud=payload.latitud,
            longitud=payload.longitud,
            precision_m=payload.precision_m,
        )
        for c in citas_en_curso
    ]
    db.add_all(ubicaciones)
    db.commit()

    ubicacion = next(u for u in ubicaciones if u.id_cita == cita.id_cita)
    db.refresh(ubicacion)
    return {
        "id_ubicacion": ubicacion.id_ubicacion,
        "fecha_hora": ubicacion.fecha_hora,
        "citas_actualizadas": len(ubicaciones),
    }


@router.get("/citas/{id_cita}/ruta")
def obtener_ruta(
    id_cita: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(usuario_actual),
):
    """Devuelve los puntos de la ruta del paseo en orden de tiempo.
    Solo el dueño de la mascota o el administrador. Solo consulta."""
    cita, mascota = _cita_del_dueno_o_admin(id_cita, usuario, db)

    nombre_paseador = None
    if cita.id_usuario_paseador:
        nombre = db.query(Usuario.nombre).filter(Usuario.id_usuario == cita.id_usuario_paseador).scalar()
        # Solo el primer nombre: el dueño no necesita más datos del paseador
        nombre_paseador = nombre.split()[0] if nombre else None

    puntos = (
        db.query(UbicacionPaseo)
        .filter(UbicacionPaseo.id_cita == cita.id_cita)
        .order_by(UbicacionPaseo.fecha_hora)
        .all()
    )
    return {
        "id_cita": cita.id_cita,
        "nom_mascota": mascota.nom_mascota,
        "nombre_paseador": nombre_paseador,
        "en_curso": cita.id_estado == ESTADO_CITA_EN_CURSO,
        "puntos": [
            {"latitud": float(p.latitud), "longitud": float(p.longitud), "fecha_hora": p.fecha_hora}
            for p in puntos
        ],
    }


# ---------------------------------------------------------------------
# Novedades del paseo
# ---------------------------------------------------------------------

@router.post("/citas/{id_cita}/novedades", status_code=201)
def registrar_novedad(
    id_cita: int,
    payload: NovedadRequest,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(usuario_actual),
):
    """Guarda una novedad escrita por el paseador. Solo mientras la cita está En Curso."""
    cita = _cita_en_curso_del_paseador(
        id_cita, usuario, db, "Solo el personal de paseo puede registrar novedades"
    )

    novedad = NovedadPaseo(
        id_cita=cita.id_cita,
        id_usuario=usuario.id_usuario,
        texto=payload.texto,
    )
    db.add(novedad)
    db.commit()
    db.refresh(novedad)
    return {
        "id_novedad": novedad.id_novedad,
        "texto": novedad.texto,
        "fecha_hora": novedad.fecha_hora,
    }


@router.get("/citas/{id_cita}/novedades")
def listar_novedades(
    id_cita: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(usuario_actual),
):
    """Devuelve las novedades de la cita en orden de tiempo.
    Las ve el paseador asignado, el dueño de la mascota o el administrador. Solo consulta."""
    cita = db.query(Cita).filter(Cita.id_cita == id_cita).first()
    if not (cita and puede_escanear(usuario, cita)):
        cita, _ = _cita_del_dueno_o_admin(id_cita, usuario, db)

    filas = (
        db.query(NovedadPaseo, Usuario.nombre)
        .join(Usuario, Usuario.id_usuario == NovedadPaseo.id_usuario)
        .filter(NovedadPaseo.id_cita == cita.id_cita)
        .order_by(NovedadPaseo.fecha_hora)
        .all()
    )
    return {
        "id_cita": cita.id_cita,
        "novedades": [
            {
                "id_novedad": n.id_novedad,
                "texto": n.texto,
                "fecha_hora": n.fecha_hora,
                "autor": nombre,
            }
            for n, nombre in filas
        ],
    }


# ---------------------------------------------------------------------
# Mapa del administrador
# ---------------------------------------------------------------------

def _datos_contacto(usuario: Usuario | None) -> dict | None:
    if not usuario:
        return None
    return {
        "nombre": f"{usuario.nombre} {usuario.apellido}",
        "telefono": usuario.telefono,
    }


@router.get("/admin/paseos-en-curso")
def paseos_en_curso(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(usuario_actual),
):
    """Paseos en curso agrupados por paseador, con su última posición y los datos
    de cada mascota. Solo el administrador. Solo consulta."""
    if not es_administrador(usuario):
        # Mismo criterio que el resto del módulo: no revelar que el recurso existe
        raise HTTPException(status_code=404, detail="No encontrado")

    citas = (
        db.query(Cita)
        .filter(Cita.id_estado == ESTADO_CITA_EN_CURSO)
        .order_by(Cita.fecha_hora_real)
        .all()
    )

    paseadores: dict[int, dict] = {}
    for cita in citas:
        mascota = db.query(Mascota).filter(Mascota.id_mascota == cita.id_mascota).first()
        dueno = db.query(Usuario).filter(Usuario.id_usuario == cita.id_usuario_cliente).first()
        plan = db.query(Plan).filter(Plan.id_plan == cita.id_plan).first() if cita.id_plan else None
        ultimo_punto = (
            db.query(UbicacionPaseo)
            .filter(UbicacionPaseo.id_cita == cita.id_cita)
            .order_by(UbicacionPaseo.fecha_hora.desc())
            .first()
        )
        novedades = db.query(func.count(NovedadPaseo.id_novedad)).filter(
            NovedadPaseo.id_cita == cita.id_cita
        ).scalar()

        id_paseador = cita.id_usuario_paseador
        if id_paseador not in paseadores:
            paseador = db.query(Usuario).filter(Usuario.id_usuario == id_paseador).first()
            paseadores[id_paseador] = {
                "id_usuario": id_paseador,
                **(_datos_contacto(paseador) or {"nombre": None, "telefono": None}),
                "inicio": cita.fecha_hora_real,
                "ultima_posicion": None,
                "mascotas": [],
            }
        grupo = paseadores[id_paseador]

        # La posición del paseador es el punto más reciente entre todas sus mascotas
        if ultimo_punto and (
            grupo["ultima_posicion"] is None
            or ultimo_punto.fecha_hora > grupo["ultima_posicion"]["fecha_hora"]
        ):
            grupo["ultima_posicion"] = {
                "latitud": float(ultimo_punto.latitud),
                "longitud": float(ultimo_punto.longitud),
                "fecha_hora": ultimo_punto.fecha_hora,
            }

        grupo["mascotas"].append({
            "id_cita": cita.id_cita,
            "id_mascota": cita.id_mascota,
            "nom_mascota": mascota.nom_mascota if mascota else None,
            "dueno": _datos_contacto(dueno),
            "direccion": cita.direccion,
            "complemento_direccion": cita.complemento_direccion,
            "zona": cita.zona,
            "plan": plan.nom_plan if plan else None,
            "duracion_minutos": plan.duracion_minutos if plan else None,
            "novedades": novedades,
        })

    return {"paseadores": list(paseadores.values())}
