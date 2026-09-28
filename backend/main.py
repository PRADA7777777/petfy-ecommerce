# backend/main.py
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import (
    auth_router,
    mascotas_router,
    servicios_router,
    planes_router,
    citas_router,
    webhooks_router,
    facturacion_router,     # ← SI FALTA, agregar
    suscripciones_router,   # ← SI FALTA, agregar
)

app = FastAPI(
    title="Petfy API",
    description="Backend de Petfy - Paseos para mascotas",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "https://petfy.com.co",
        "https://www.petfy.com.co",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
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


@app.get("/")
def root():
    return {"mensaje": "🐾 API de Petfy funcionando correctamente"}


@app.get("/health")
def health():
    return {"status": "ok"}