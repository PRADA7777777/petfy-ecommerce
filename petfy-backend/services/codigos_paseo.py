# backend/services/codigos_paseo.py
import secrets
from datetime import datetime
from sqlalchemy.orm import Session
from models import Cita, CodigoPaseo, Mascota, Usuario
from email_service import enviar_codigos_paseo_email


def asignar_codigos_paseo(db: Session, citas: list) -> list:
    """Crea el código de 4 dígitos de cada cita confirmada que todavía no lo tenga."""
    nuevos = []
    for cita in citas:
        if db.query(CodigoPaseo).filter(CodigoPaseo.id_cita == cita.id_cita).first():
            continue
        codigo = CodigoPaseo(
            id_cita=cita.id_cita,
            codigo=f"{secrets.randbelow(10000):04d}",
            fecha_creacion=datetime.now(),
        )
        db.add(codigo)
        nuevos.append(codigo)
    return nuevos


def enviar_codigos_al_cliente(db: Session, codigos: list) -> bool:
    """Envía al dueño un solo correo con la lista de sus paseos y el código de cada uno."""
    if not codigos:
        return False

    filas = []
    cliente = None
    for codigo in codigos:
        cita = db.query(Cita).filter(Cita.id_cita == codigo.id_cita).first()
        mascota = db.query(Mascota).filter(Mascota.id_mascota == cita.id_mascota).first()
        if cliente is None:
            cliente = db.query(Usuario).filter(Usuario.id_usuario == cita.id_usuario_cliente).first()
        filas.append({
            "fecha": cita.fecha,
            "hora": cita.hora,
            "mascota": mascota.nom_mascota if mascota else "Tu mascota",
            "codigo": codigo.codigo,
        })

    if not cliente or not cliente.correo:
        return False

    filas.sort(key=lambda fila: (fila["fecha"], fila["hora"]))
    return enviar_codigos_paseo_email(cliente.correo, cliente.nombre, filas)
