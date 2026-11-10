import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env", encoding='utf-8')

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from rate_limit import limiter

from routers import (
    auth_router,
    mascotas_router,
    servicios_router,
    planes_router,
    citas_router,
    webhooks_router,
    facturacion_router,
    suscripciones_router,
    contacto_router,
    admin_router,
)

ENV = os.getenv("ENV", "dev")

app = FastAPI(
    title="Petfy API",
    description="Backend de Petfy - Paseos para mascotas",
    version="1.0.0",
    docs_url="/docs" if ENV == "dev" else None,
    redoc_url="/redoc" if ENV == "dev" else None,
    openapi_url="/openapi.json" if ENV == "dev" else None,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "https://petfy.com.co",
        "https://www.petfy.com.co",
        "http://192.168.137.1:3000",
    ],
    allow_methods=["*"],
    allow_credentials=True,
    allow_headers=["Content-Type", "Authorization", "Accept", "Origin", "X-Requested-With"],
    expose_headers=["*"],
    max_age=3600,
)

app.include_router(auth_router.router)
app.include_router(mascotas_router.router)
app.include_router(servicios_router.router)
app.include_router(planes_router.router)
app.include_router(citas_router.router)
app.include_router(webhooks_router.router)
app.include_router(facturacion_router.router)
app.include_router(suscripciones_router.router)
app.include_router(contacto_router.router)
app.include_router(admin_router.router)

@app.get("/")
def root():
    return {"mensaje": "🐾 API de Petfy funcionando correctamente"}


@app.get("/health")
def health():
    return {"status": "ok"}
