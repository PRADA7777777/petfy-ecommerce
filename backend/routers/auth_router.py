# backend/routers/auth_router.py
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
import os

from database import get_db
from models import Usuario, DocIdentidad, TipoDocumento, Mascota, Rol
from schemas import RegistroRequest, RegistroResponse, VerificarRequest, LoginRequest, LoginResponse, ActualizarPerfilRequest, CambiarPasswordRequest
from auth import hash_password, verify_password, crear_token, decodificar_token
from email_service import generar_codigo, enviar_codigo_email

router = APIRouter(prefix="/auth", tags=["Autenticación"])
CODIGO_EXPIRA_MINUTOS = int(os.getenv("CODIGO_EXPIRACION_MINUTOS", 5))


# 1. ENDPOINT PARA CARGAR LOS TIPOS DE DOCUMENTO EN EL FRONTEND

@router.get("/tipos-documento")
def listar_tipos_documento(db: Session = Depends(get_db)):
    tipos = db.query(TipoDocumento).order_by(TipoDocumento.id_tipo_doc).all()
    return [{"id_tipo_doc": t.id_tipo_doc, "nom_tipo_doc": t.nom_tipo_doc} for t in tipos]

# 2. ENDPOINT DE REGISTRO (CON VALIDACIÓN DE CÓDIGO Y EXPIRACIÓN)

@router.post("/registro", response_model=RegistroResponse)
def registro(payload: RegistroRequest, db: Session = Depends(get_db)):
    # 1. Buscar si el correo ya existe
    usuario_existente = db.query(Usuario).filter(Usuario.correo == payload.correo).first()

    if usuario_existente:
        if usuario_existente.verificado:
            raise HTTPException(status_code=400, detail="El correo ya está registrado y verificado")
        
        codigo = generar_codigo()
        usuario_existente.nombre = payload.nombre
        usuario_existente.apellido = payload.apellido
        usuario_existente.contrasena = hash_password(payload.contrasena)
        usuario_existente.telefono = payload.telefono
        usuario_existente.direccion = payload.direccion
        usuario_existente.cod_verif = codigo
        usuario_existente.cod_expirado = datetime.now() + timedelta(minutes=CODIGO_EXPIRA_MINUTOS)
        

        doc_existente = db.query(DocIdentidad).filter(DocIdentidad.id_usuario == usuario_existente.id_usuario).first()
        if doc_existente:
            doc_existente.num_doc = payload.numdoc
            doc_existente.id_tipo_doc = payload.idtipodoc
        
        db.commit()
        enviar_codigo_email(payload.correo, codigo, payload.nombre)
        
        return RegistroResponse(
            mensaje="Registro actualizado. Revisa tu correo para el nuevo código.",
            idusuario=usuario_existente.id_usuario,
            correo=usuario_existente.correo,
        )

    if db.query(DocIdentidad).filter(DocIdentidad.num_doc == payload.numdoc).first():
        raise HTTPException(status_code=400, detail="El documento ya está registrado")

    if payload.telefono and db.query(Usuario).filter(Usuario.telefono == payload.telefono).first():
        raise HTTPException(status_code=400, detail="El teléfono ya está registrado")


    codigo = generar_codigo()
    expira = datetime.now() + timedelta(minutes=CODIGO_EXPIRA_MINUTOS)

    rol_cliente = db.query(Rol).filter(Rol.nombre_rol.ilike("cliente")).first()
    id_rol = rol_cliente.id_rol if rol_cliente else 2

    nuevo = Usuario(
        nombre=payload.nombre,
        apellido=payload.apellido,
        correo=payload.correo,
        contrasena=hash_password(payload.contrasena),
        telefono=payload.telefono,
        direccion=payload.direccion,
        cod_verif=codigo,
        cod_expirado=expira,
        verificado=False,
        id_rol=id_rol,
    )
    db.add(nuevo)
    db.flush()

    doc = DocIdentidad(
        num_doc=payload.numdoc,
        id_tipo_doc=payload.idtipodoc,
        id_usuario=nuevo.id_usuario,
    )
    db.add(doc)
    db.commit()
    db.refresh(nuevo)

    enviar_codigo_email(payload.correo, codigo, payload.nombre)

    return RegistroResponse(
        mensaje="Registro exitoso. Revisa tu correo para el código de verificación.",
        idusuario=nuevo.id_usuario,
        correo=nuevo.correo,
    )


# 3. ENDPOINT PARA VERIFICAR EL CÓDIGO (CON LÍMITE DE 5 MINUTOS)

@router.post("/verificar")
def verificar_codigo(payload: VerificarRequest, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.correo == payload.correo).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if usuario.verificado:
        return {"mensaje": "El usuario ya está verificado"}

    if usuario.cod_verif != payload.codigo:
        raise HTTPException(status_code=400, detail="Código incorrecto")

    # Validación de los 5 minutos de expiración
    if usuario.cod_expirado and datetime.now() > usuario.cod_expirado:
        raise HTTPException(status_code=400, detail="El código expiró. Solicita uno nuevo")

    usuario.verificado = True
    usuario.cod_verif = None
    usuario.cod_expirado = None
    db.commit()

    return {"mensaje": "¡Cuenta verificada con éxito!"}


# 4. ENDPOINT PARA REENVIAR EL CÓDIGO

@router.post("/reenviar-codigo")
def reenviar_codigo(payload: dict, db: Session = Depends(get_db)):
    correo = payload.get("correo")
    usuario = db.query(Usuario).filter(Usuario.correo == correo).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if usuario.verificado:
        raise HTTPException(status_code=400, detail="El usuario ya está verificado")

    codigo = generar_codigo()
    usuario.cod_verif = codigo
    usuario.cod_expirado = datetime.now() + timedelta(minutes=CODIGO_EXPIRA_MINUTOS)
    db.commit()

    enviar_codigo_email(usuario.correo, codigo, usuario.nombre)
    return {"mensaje": "Código reenviado"}


# 5. ENDPOINT DE LOGIN
@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.correo == payload.correo).first()
    if not usuario or not verify_password(payload.contrasena, usuario.contrasena):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")

    if not usuario.verificado:
        raise HTTPException(status_code=403, detail="Debes verificar tu cuenta primero")

    tiene_mascotas = db.query(Mascota).filter(Mascota.id_usuario == usuario.id_usuario).count() > 0
    primer_ingreso = not tiene_mascotas

    doc = db.query(DocIdentidad).filter(DocIdentidad.id_usuario == usuario.id_usuario).first()
    tipo_doc = None
    if doc and doc.id_tipo_doc:
        tipo_doc = db.query(TipoDocumento).filter(
            TipoDocumento.id_tipo_doc == doc.id_tipo_doc
        ).first()

    token = crear_token({"sub": str(usuario.id_usuario), "correo": usuario.correo})

    return LoginResponse(
        access_token=token,
        usuario={
            "idusuario": usuario.id_usuario,
            "nombre": usuario.nombre,
            "apellido": usuario.apellido,
            "correo": usuario.correo,
            "telefono": usuario.telefono,
            "direccion": usuario.direccion,
            "verificado": usuario.verificado,
            "id_tipo_doc": doc.id_tipo_doc if doc else None,
            "nom_tipo_doc": tipo_doc.nom_tipo_doc if tipo_doc else None,
            "num_doc": doc.num_doc if doc else None,
        },
        primer_ingreso=primer_ingreso,
        tiene_mascotas=tiene_mascotas,
    )

def usuario_autenticado(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> Usuario:
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


@router.put("/perfil")
def actualizar_perfil(
    payload: ActualizarPerfilRequest,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(usuario_autenticado),
):
    # --- Validaciones básicas ---
    if not payload.nombre.strip() or not payload.apellido.strip():
        raise HTTPException(status_code=400, detail="Nombre y apellido son obligatorios")

    correo_nuevo = payload.correo.strip().lower()

    # --- ¿Otro usuario ya usa ese correo? ---
    if correo_nuevo != usuario.correo.lower():
        correo_ajeno = (
            db.query(Usuario)
            .filter(
                Usuario.correo == correo_nuevo,
                Usuario.id_usuario != usuario.id_usuario,
            )
            .first()
        )
        if correo_ajeno:
            raise HTTPException(status_code=400, detail="Ese correo ya está registrado")

    # --- Actualizar solo los campos permitidos ---
    usuario.nombre = payload.nombre.strip()
    usuario.apellido = payload.apellido.strip()
    usuario.correo = correo_nuevo
    usuario.telefono = payload.telefono
    usuario.direccion = payload.direccion

    db.commit()
    db.refresh(usuario)

    # --- Armar respuesta con datos del doc (read-only) ---
    doc = db.query(DocIdentidad).filter(DocIdentidad.id_usuario == usuario.id_usuario).first()
    tipo_doc = None
    if doc and doc.id_tipo_doc:
        tipo_doc = db.query(TipoDocumento).filter(
            TipoDocumento.id_tipo_doc == doc.id_tipo_doc
        ).first()

    return {
        "idusuario": usuario.id_usuario,
        "nombre": usuario.nombre,
        "apellido": usuario.apellido,
        "correo": usuario.correo,
        "telefono": usuario.telefono,
        "direccion": usuario.direccion,
        "verificado": usuario.verificado,
        "id_tipo_doc": doc.id_tipo_doc if doc else None,
        "nom_tipo_doc": tipo_doc.nom_tipo_doc if tipo_doc else None,
        "num_doc": doc.num_doc if doc else None,
    }

@router.post("/cambiar-password")
def cambiar_password(
    payload: CambiarPasswordRequest,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(usuario_autenticado),
):
    # 1. Verificar contraseña actual
    if not verify_password(payload.contrasena_actual, usuario.contrasena):
        raise HTTPException(status_code=400, detail="La contraseña actual es incorrecta")

    # 2. Verificar que la nueva sea diferente
    if verify_password(payload.contrasena_nueva, usuario.contrasena):
        raise HTTPException(
            status_code=400,
            detail="La nueva contraseña no puede ser igual a la actual",
        )

    # 3. Guardar
    usuario.contrasena = hash_password(payload.contrasena_nueva)
    db.commit()

    return {"mensaje": "Contraseña actualizada correctamente"}