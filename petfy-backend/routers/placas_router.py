# petfy-backend/routers/placas_router.py
import random
import string
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from models import Placa, Mascota, Usuario
from routers.mascotas_router import usuario_actual

router = APIRouter(tags=["Placas"])

# Caracteres seguros (sin 0/O/1/I para evitar confusión al leer la placa)
ALFABETO = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"


def _generar_codigo(longitud: int = 6) -> str:
    return "".join(random.choices(ALFABETO, k=longitud))


# ─── 1. Generar lote de códigos (admin o simulación) ───
class GenerarLoteRequest(BaseModel):
    cantidad: int = 10
    lote: str | None = None
    material: str | None = None
    longitud: int = 6


@router.post("/placas/generar")
def generar_lote(payload: GenerarLoteRequest, db: Session = Depends(get_db)):
    """Genera códigos únicos 'disponibles'. NO requiere auth para pruebas."""
    if payload.cantidad < 1 or payload.cantidad > 500:
        raise HTTPException(400, "cantidad debe estar entre 1 y 500")

    nuevos = []
    intentos = 0
    while len(nuevos) < payload.cantidad and intentos < payload.cantidad * 5:
        codigo = _generar_codigo(payload.longitud)
        existe = db.query(Placa).filter(Placa.codigo == codigo).first()
        if not existe:
            placa = Placa(
                codigo=codigo,
                estado="disponible",
                lote=payload.lote,
                material=payload.material,
            )
            db.add(placa)
            nuevos.append(codigo)
        intentos += 1

    db.commit()
    return {"generados": len(nuevos), "codigos": nuevos}


# ─── 2. Consultar una placa (público, sin auth) ───
@router.get("/public/placas/{codigo}")
def consultar_placa(codigo: str, db: Session = Depends(get_db)):
    """Verifica si un código existe y su estado (sin exponer datos sensibles)."""
    placa = db.query(Placa).filter(Placa.codigo == codigo.upper()).first()
    if not placa:
        raise HTTPException(404, "Código de placa no válido")

    return {
        "codigo": placa.codigo,
        "estado": placa.estado,
        "tiene_mascota": placa.id_mascota is not None,
        "id_mascota": placa.id_mascota if placa.estado == "activo" else None,
    }


# ─── 3. Activar una placa (vincula código a mascota) ───
class ActivarPlacaRequest(BaseModel):
    codigo: str
    id_mascota: int


@router.post("/placas/activar")
def activar_placa(
    payload: ActivarPlacaRequest,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(usuario_actual),
):
    """Vincula un código 'disponible' a una mascota del usuario autenticado."""
    codigo = payload.codigo.strip().upper()

    # Validar placa
    placa = db.query(Placa).filter(Placa.codigo == codigo).first()
    if not placa:
        raise HTTPException(404, "El código de placa no existe. Verifica la placa.")
    if placa.estado == "activo":
        raise HTTPException(400, "Esta placa ya está activada por otra mascota.")
    if placa.estado == "suspendido":
        raise HTTPException(400, "Esta placa está suspendida. Contacta a soporte.")
    if placa.estado == "perdida":
        raise HTTPException(400, "Esta placa fue reportada como perdida. Contacta a soporte.")

    # Validar mascota
    mascota = db.query(Mascota).filter(
        Mascota.id_mascota == payload.id_mascota,
        Mascota.id_usuario == usuario.id_usuario,
    ).first()
    if not mascota:
        raise HTTPException(404, "Mascota no encontrada")

    # Validar que la mascota no tenga ya otra placa activa
    placa_existente = db.query(Placa).filter(
        Placa.id_mascota == mascota.id_mascota,
        Placa.estado == "activo",
    ).first()
    if placa_existente:
        raise HTTPException(
            400,
            f"Esta mascota ya tiene la placa {placa_existente.codigo} activa. Desactívala primero.",
        )

    # Activar
    placa.id_mascota = mascota.id_mascota
    placa.estado = "activo"
    placa.fecha_activacion = datetime.now()
    db.commit()

    return {
        "mensaje": "¡Placa activada!",
        "codigo": placa.codigo,
        "id_mascota": mascota.id_mascota,
        "nom_mascota": mascota.nom_mascota,
        "url_publica": f"/p/{placa.codigo}",
    }


# ─── 4. Desactivar placa (liberar código) ───
@router.post("/placas/desactivar")
def desactivar_placa(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(usuario_actual),
    codigo: str = "",
):
    codigo = codigo.strip().upper()
    placa = db.query(Placa).filter(Placa.codigo == codigo).first()
    if not placa:
        raise HTTPException(404, "Placa no encontrada")

    # Verificar que la placa pertenece a una mascota del usuario
    mascota = db.query(Mascota).filter(
        Mascota.id_mascota == placa.id_mascota,
        Mascota.id_usuario == usuario.id_usuario,
    ).first()
    if not mascota:
        raise HTTPException(403, "No puedes desactivar esta placa")

    placa.id_mascota = None
    placa.estado = "disponible"
    placa.fecha_activacion = None
    db.commit()
    return {"mensaje": "Placa desactivada. El código queda libre."}


# ─── 5. Ver placa activa de una mascota ───
@router.get("/mascotas/{id_mascota}/placa")
def ver_placa_mascota(
    id_mascota: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(usuario_actual),
):
    mascota = db.query(Mascota).filter(
        Mascota.id_mascota == id_mascota,
        Mascota.id_usuario == usuario.id_usuario,
    ).first()
    if not mascota:
        raise HTTPException(404, "Mascota no encontrada")

    placa = db.query(Placa).filter(
        Placa.id_mascota == id_mascota,
        Placa.estado == "activo",
    ).first()

    if not placa:
        return {"tiene_placa": False, "placa": None}

    return {
        "tiene_placa": True,
        "placa": {
            "codigo": placa.codigo,
            "url_publica": f"/p/{placa.codigo}",
            "fecha_activacion": placa.fecha_activacion.isoformat() if placa.fecha_activacion else None,
        },
    }


# ─── 6. Resolver código → mascota (endpoint público, para /p/[codigo]) ───
@router.get("/public/placas/{codigo}/mascota")
def resolver_placa(codigo: str, db: Session = Depends(get_db)):
    """Devuelve los datos públicos de la mascota asociada a este código."""
    placa = db.query(Placa).filter(Placa.codigo == codigo.upper()).first()
    if not placa:
        raise HTTPException(404, "Código de placa no válido")
    if placa.estado != "activo" or not placa.id_mascota:
        raise HTTPException(404, "Esta placa aún no está activada")

    # Reutilizamos la lógica del endpoint público de mascota
    from routers.public_router import mascota_publica
    return mascota_publica(placa.id_mascota, db)

# ═══════════════════════════════════════════════════════════════
# ENDPOINTS ADMIN (solo rol=1)
# ═══════════════════════════════════════════════════════════════

from fastapi.responses import StreamingResponse
from sqlalchemy import func as sql_func
import io
import csv


class PlacaAdminOut(BaseModel):
    id_placa: int
    codigo: str
    estado: str
    lote: str | None
    material: str | None
    id_mascota: int | None
    nom_mascota: str | None
    nom_dueno: str | None
    fecha_generacion: str | None
    fecha_activacion: str | None


@router.get("/admin/placas/stats")
def placas_stats(db: Session = Depends(get_db), admin: Usuario = Depends(usuario_actual)):
    if admin.id_rol != 1:
        raise HTTPException(403, "Solo administradores")

    total = db.query(Placa).count()
    disponibles = db.query(Placa).filter(Placa.estado == "disponible").count()
    activas = db.query(Placa).filter(Placa.estado == "activo").count()
    suspendidas = db.query(Placa).filter(Placa.estado == "suspendido").count()

    lotes = db.query(Placa.lote, sql_func.count(Placa.id_placa)).filter(
        Placa.lote.isnot(None)
    ).group_by(Placa.lote).all()

    return {
        "total": total,
        "disponibles": disponibles,
        "activas": activas,
        "suspendidas": suspendidas,
        "lotes": [{"lote": l, "cantidad": c} for l, c in lotes],
    }


@router.get("/admin/placas")
def listar_placas_admin(
    page: int = 1,
    page_size: int = 20,
    estado: str = "todos",
    lote: str = "",
    search: str = "",
    db: Session = Depends(get_db),
    admin: Usuario = Depends(usuario_actual),
):
    if admin.id_rol != 1:
        raise HTTPException(403, "Solo administradores")

    q = db.query(Placa)
    if estado != "todos":
        q = q.filter(Placa.estado == estado)
    if lote:
        q = q.filter(Placa.lote == lote)
    if search:
        q = q.filter(Placa.codigo.ilike(f"%{search.upper()}%"))

    total = q.count()
    offset = (page - 1) * page_size
    placas = q.order_by(Placa.id_placa.desc()).offset(offset).limit(page_size).all()

    # Mapa de mascotas
    ids_mascota = [p.id_mascota for p in placas if p.id_mascota]
    mascotas_map = {}
    if ids_mascota:
        mascotas = db.query(Mascota).filter(Mascota.id_mascota.in_(ids_mascota)).all()
        for m in mascotas:
            dueno = db.query(Usuario).filter(Usuario.id_usuario == m.id_usuario).first()
            mascotas_map[m.id_mascota] = {
                "nom_mascota": m.nom_mascota,
                "nom_dueno": dueno.nombre if dueno else None,
            }

    data = []
    for p in placas:
        m_info = mascotas_map.get(p.id_mascota, {}) if p.id_mascota else {}
        data.append({
            "id_placa": p.id_placa,
            "codigo": p.codigo,
            "estado": p.estado,
            "lote": p.lote,
            "material": p.material,
            "id_mascota": p.id_mascota,
            "nom_mascota": m_info.get("nom_mascota"),
            "nom_dueno": m_info.get("nom_dueno"),
            "fecha_generacion": p.fecha_generacion.isoformat() if p.fecha_generacion else None,
            "fecha_activacion": p.fecha_activacion.isoformat() if p.fecha_activacion else None,
        })

    return {"data": data, "total": total, "page": page, "page_size": page_size}


@router.get("/admin/placas/export")
def exportar_placas_csv(
    estado: str = "todos",
    lote: str = "",
    db: Session = Depends(get_db),
    admin: Usuario = Depends(usuario_actual),
):
    if admin.id_rol != 1:
        raise HTTPException(403, "Solo administradores")

    q = db.query(Placa)
    if estado != "todos":
        q = q.filter(Placa.estado == estado)
    if lote:
        q = q.filter(Placa.lote == lote)

    placas = q.order_by(Placa.id_placa).all()

    output = io.StringIO()
    output.write("\ufeff")  # BOM para Excel
    writer = csv.writer(output)
    writer.writerow(["codigo", "url_completa", "lote", "material", "estado"])
    for p in placas:
        writer.writerow([
            p.codigo,
            f"https://petfy.com.co/p/{p.codigo}",
            p.lote or "",
            p.material or "",
            p.estado,
        ])

    output.seek(0)
    filename = f"placas_{estado}_{lote or 'todas'}.csv".replace(" ", "_")

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/admin/placas/{codigo}/suspender")
def suspender_placa(
    codigo: str,
    db: Session = Depends(get_db),
    admin: Usuario = Depends(usuario_actual),
):
    if admin.id_rol != 1:
        raise HTTPException(403, "Solo administradores")

    placa = db.query(Placa).filter(Placa.codigo == codigo.upper()).first()
    if not placa:
        raise HTTPException(404, "Placa no encontrada")

    placa.estado = "suspendido"
    db.commit()
    return {"mensaje": "Placa suspendida", "codigo": placa.codigo}


@router.post("/admin/placas/{codigo}/reactivar")
def reactivar_placa(
    codigo: str,
    db: Session = Depends(get_db),
    admin: Usuario = Depends(usuario_actual),
):
    if admin.id_rol != 1:
        raise HTTPException(403, "Solo administradores")

    placa = db.query(Placa).filter(Placa.codigo == codigo.upper()).first()
    if not placa:
        raise HTTPException(404, "Placa no encontrada")

    if placa.id_mascota:
        placa.estado = "activo"
    else:
        placa.estado = "disponible"
    db.commit()
    return {"mensaje": "Placa reactivada", "codigo": placa.codigo}