"""
Sistema de Automação de Suporte com IA
Backend principal — FastAPI
"""

import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database.connection import init_db
from routes.messages import router as messages_router
from routes.tickets import router as tickets_router
from routes.health import router as health_router

# ── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("suporte-ia")


# ── Startup/shutdown ──────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Iniciando Sistema de Suporte com IA…")
    await init_db()
    logger.info("Base de dados iniciada.")
    yield
    logger.info("Sistema encerrado.")


# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Sistema de Automação de Suporte com IA",
    description="API REST para gestão inteligente de tickets de suporte ao cliente",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(messages_router)
app.include_router(tickets_router)
