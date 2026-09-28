# backend/routers/mascotas_router.py
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import Optional

from database import get_db
from models import Mascota, Usuario, Comportamiento, CondicionMedica, Raza
from schemas import MascotaRequest, MascotaOut, CatalogoItem
from auth import decodificar_token

router = APIRouter(prefix="/mascotas", tags=["Mascotas"])


def usuario_actual(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)) -> Usuario:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token requerido")
    token = authorization.replace("Bearer ", "")
    data = decodificar_token(token)
    if not data or "sub" not in data:
        raise HTTPException(status_code=401, detail="Token inválido")
    usuario = db.query(Usuario).filter(Usuario.id_usuario == int(data["sub"])).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return usuario

# CATÁLOGOS

@router.get("/catalogos/comportamientos", response_model=list[CatalogoItem])
def listar_comportamientos(db: Session = Depends(get_db)):
    items = db.query(Comportamiento).order_by(Comportamiento.id_comport).all()
    return [{"id": c.id_comport, "nombre": c.nom_comportamiento} for c in items]


@router.get("/catalogos/condiciones", response_model=list[CatalogoItem])
def listar_condiciones(db: Session = Depends(get_db)):
    items = db.query(CondicionMedica).order_by(CondicionMedica.id_condicion).all()
    return [{"id": c.id_condicion, "nombre": c.nom_condicion} for c in items]


@router.get("/catalogos/razas", response_model=list[CatalogoItem])
def listar_razas(db: Session = Depends(get_db)):
    items = db.query(Raza).order_by(Raza.nom_raza).all()
    return [{"id": r.id_raza, "nombre": r.nom_raza} for r in items]

# CRUD MASCOTAS

@router.post("", response_model=MascotaOut)
def crear_mascota(
    payload: MascotaRequest,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(usuario_actual),
):

# Resolver nombre de raza: prioriza texto custom si es "Otra"
    nom_raza = (payload.raza or "").strip() or None

    if payload.id_raza:
        raza_obj = db.query(Raza).filter(Raza.id_raza == payload.id_raza).first()
        if raza_obj:
            # Si el catálogo dice "Otra" y hay texto custom, respetarlo
            if raza_obj.nom_raza.strip().lower() == "otra" and payload.raza:
                nom_raza = payload.raza.strip()
            else:
                nom_raza = raza_obj.nom_raza

    nueva = Mascota(
        nom_mascota=payload.nommascota,
        raza=nom_raza,
        id_raza=payload.id_raza,
        peso=payload.peso,
        edad=payload.edad,
        carne_vacunacion=payload.carne_vacunacion,
        otras_indicaciones=payload.otras_indicaciones,
        observar_condicion=payload.observar_condicion,
        observar_comportamiento=payload.observar_comportamiento,
        img_masc=payload.img_masc,
        id_comportamiento=payload.id_comportamiento,
        id_condicion_medica=payload.id_condicion_medica,
        id_usuario=usuario.id_usuario,
    )
    db.add(nueva)
    db.commit()
    db.refresh(nueva)

    return _mascota_to_out(nueva, db)

@router.put("/{id_mascota}", response_model=MascotaOut)
def actualizar_mascota(
    id_mascota: int,
    payload: MascotaRequest,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(usuario_actual),
):
    mascota = (
        db.query(Mascota)
        .filter(
            Mascota.id_mascota == id_mascota,
            Mascota.id_usuario == usuario.id_usuario,   # solo el dueño puede editar
        )
        .first()
    )
    if not mascota:
        raise HTTPException(status_code=404, detail="Mascota no encontrada")

    #  Misma lógica de raza que en crear
    nom_raza = (payload.raza or "").strip() or None
    if payload.id_raza:
        raza_obj = db.query(Raza).filter(Raza.id_raza == payload.id_raza).first()
        if raza_obj:
            if raza_obj.nom_raza.strip().lower() == "otra" and payload.raza:
                nom_raza = payload.raza.strip()
            else:
                nom_raza = raza_obj.nom_raza

    # Actualizar campos
    mascota.nom_mascota = payload.nommascota
    mascota.raza = nom_raza
    mascota.id_raza = payload.id_raza
    mascota.peso = payload.peso
    mascota.edad = payload.edad
    mascota.carne_vacunacion = payload.carne_vacunacion
    mascota.otras_indicaciones = payload.otras_indicaciones
    mascota.observar_condicion = payload.observar_condicion
    mascota.observar_comportamiento = payload.observar_comportamiento
    mascota.img_masc = payload.img_masc
    mascota.id_comportamiento = payload.id_comportamiento
    mascota.id_condicion_medica = payload.id_condicion_medica

    db.commit()
    db.refresh(mascota)
    return _mascota_to_out(mascota, db)

@router.get("", response_model=list[MascotaOut])
def listar_mis_mascotas(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(usuario_actual),
):
    mascotas = db.query(Mascota).filter(Mascota.id_usuario == usuario.id_usuario).all()
    return [_mascota_to_out(m, db) for m in mascotas]


def _mascota_to_out(m: Mascota, db: Session) -> dict:
    nom_raza = m.raza
    if m.id_raza:
        raza_obj = db.query(Raza).filter(Raza.id_raza == m.id_raza).first()
        if raza_obj:
            if raza_obj.nom_raza.strip().lower() == "otra" and m.raza:
                nom_raza = m.raza
            else:
                nom_raza = raza_obj.nom_raza


    return {
        "id_mascota": m.id_mascota,
        "nom_mascota": m.nom_mascota,
        "raza": m.raza,
        "id_raza": m.id_raza,
        "nom_raza": nom_raza,
        "peso": float(m.peso) if m.peso else None,
        "edad": m.edad,
        "carne_vacunacion": m.carne_vacunacion,
        "otras_indicaciones": m.otras_indicaciones,
        "observar_condicion": m.observar_condicion,
        "observar_comportamiento": m.observar_comportamiento,
        "img_masc": m.img_masc,
        "id_comportamiento": m.id_comportamiento,
        "id_condicion_medica": m.id_condicion_medica,
    }


@router.delete("/{id_mascota}")
def eliminar_mascota(
    id_mascota: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(usuario_actual),
):
    mascota = (
        db.query(Mascota)
        .filter(Mascota.id_mascota == id_mascota, Mascota.id_usuario == usuario.id_usuario)
        .first()
    )
    if not mascota:
        raise HTTPException(status_code=404, detail="Mascota no encontrada")
    db.delete(mascota)
    db.commit()
    return {"mensaje": "Mascota eliminada"}