from fastapi import APIRouter
from datetime import datetime

router = APIRouter(tags=["Health"])

@router.get("/", summary="Root")
async def root():
    return {"sistema": "Suporte IA", "versao": "1.0.0", "estado": "operacional"}

@router.get("/health", summary="Health check")
async def health():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}
