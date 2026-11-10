from slowapi import Limiter
from slowapi.util import get_remote_address

# Uvicorn (con --proxy-headers habilitado por defecto) ya resuelve la IP real
# del cliente desde X-Forwarded-For cuando el proxy está en 127.0.0.1.
# Usar get_remote_address() es seguro y correcto.
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[],
    storage_uri="memory://",
)
