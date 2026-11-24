from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import create_all_tables
from app.modules.auth.router import router as auth_router
from app.modules.categorias.router import router as categorias_router
from app.modules.pedidos.router import router as pedidos_router
from app.modules.productos.router import router as productos_router
from app.modules.usuarios.router import router as usuarios_router


@asynccontextmanager
async def lifespan(_: FastAPI):
    create_all_tables()  # crea las tablas que falten al iniciar
    yield


app = FastAPI(
    title="Food Store API",
    description=(
        "Sistema de pedidos de comida. Autenticación con JWT en cookie HttpOnly, "
        "roles `user` y `admin`, arquitectura en capas con Unit of Work."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# CORS con credenciales: el navegador acepta y envía la cookie HttpOnly desde el frontend.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_PREFIX = "/api/v1"
for router in (auth_router, usuarios_router, categorias_router, productos_router, pedidos_router):
    app.include_router(router, prefix=API_PREFIX)
