from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
import resend
import os

router = APIRouter(prefix="/contacto", tags=["Contacto"])

# Inicializar Resend (se leerá del .env automáticamente)
resend.api_key = os.getenv("RESEND_API_KEY")

class ContactoRequest(BaseModel):
    nombre: str
    apellido: str
    email: EmailStr
    telefono: str | None = None
    asunto: str
    mensaje: str

@router.post("")
async def enviar_mensaje_contacto(data: ContactoRequest):
    try:
        # Crear el HTML del correo
        html_content = f"""
        <h2>Nuevo mensaje de contacto desde Petfy</h2>
        <p><strong>Nombre:</strong> {data.nombre} {data.apellido}</p>
        <p><strong>Email:</strong> {data.email}</p>
        <p><strong>Teléfono:</strong> {data.telefono or 'No proporcionado'}</p>
        <p><strong>Asunto:</strong> {data.asunto}</p>
        <p><strong>Mensaje:</strong></p>
        <p>{data.mensaje}</p>
        """

        # Enviar correo con Resend
        r = resend.Emails.send({
            "from": os.getenv("RESEND_FROM_EMAIL"), # ej: noreply@petfy.com.co
            "to": "gerencia@petfy.com.co",
            "subject": f"Contacto Web: {data.asunto}",
            "html": html_content
        })
        
        return {"status": "ok", "mensaje": "Correo enviado correctamente", "id": r.get("id")}
    
    except Exception as e:
        print(f"Error enviando correo: {e}")
        raise HTTPException(status_code=500, detail="Error al enviar el correo")