"""
Rotas /tickets — listagem, detalhe e actualização de status
"""

import logging
import math

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database.connection import get_db
from models.models import Ticket
from models.schemas import PaginatedTickets, TicketOut, TicketStatusUpdate

logger = logging.getLogger("suporte-ia.routes.tickets")
router = APIRouter(prefix="/tickets", tags=["Tickets"])

VALID_STATUSES = ("aberto", "em_progresso", "fechado")


@router.get("", response_model=PaginatedTickets, summary="Listar tickets com filtros e paginação")
async def list_tickets(
    page:     int          = Query(1,    ge=1,  description="Número da página"),
    size:     int          = Query(20,   ge=1, le=100, description="Itens por página"),
    status:   str | None   = Query(None, description="Filtrar por status"),
    priority: str | None   = Query(None, description="Filtrar por prioridade"),
    category: str | None   = Query(None, description="Filtrar por categoria"),
    db: AsyncSession = Depends(get_db),
):
    q = select(Ticket).options(selectinload(Ticket.message))

    if status:
        q = q.where(Ticket.status == status)
    if priority:
        q = q.where(Ticket.priority == priority)
    if category:
        q = q.where(Ticket.category == category)

    # Contagem total
    count_q = select(func.count()).select_from(q.subquery())
    total = (await db.execute(count_q)).scalar_one()

    # Paginação
    offset = (page - 1) * size
    q = q.order_by(Ticket.created_at.desc()).offset(offset).limit(size)
    rows = (await db.execute(q)).scalars().all()

    return PaginatedTickets(
        total=total,
        page=page,
        size=size,
        pages=math.ceil(total / size) if total else 1,
        items=rows,
    )


@router.get("/{ticket_id}", response_model=TicketOut, summary="Detalhe de um ticket")
async def get_ticket(ticket_id: int, db: AsyncSession = Depends(get_db)):
    q = select(Ticket).options(selectinload(Ticket.message)).where(Ticket.id == ticket_id)
    ticket = (await db.execute(q)).scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail=f"Ticket #{ticket_id} não encontrado.")
    return ticket


@router.patch("/{ticket_id}", response_model=TicketOut, summary="Actualizar status do ticket")
async def update_ticket_status(
    ticket_id: int,
    payload:   TicketStatusUpdate,
    db:        AsyncSession = Depends(get_db),
):
    if payload.status not in VALID_STATUSES:
        raise HTTPException(
            status_code=422,
            detail=f"Status inválido: '{payload.status}'. Valores aceites: {', '.join(VALID_STATUSES)}",
        )

    q = select(Ticket).options(selectinload(Ticket.message)).where(Ticket.id == ticket_id)
    ticket = (await db.execute(q)).scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail=f"Ticket #{ticket_id} não encontrado.")

    old_status = ticket.status
    ticket.status = payload.status
    await db.commit()
    await db.refresh(ticket)

    logger.info("Ticket #%d: status alterado %s → %s", ticket_id, old_status, payload.status)
    return ticket


@router.get("/stats/summary", tags=["Stats"], summary="Estatísticas gerais do dashboard")
async def get_stats(db: AsyncSession = Depends(get_db)):
    """Retorna contagens por categoria, prioridade e status para o dashboard."""
    total = (await db.execute(select(func.count(Ticket.id)))).scalar_one()

    async def count_by(field, value):
        return (await db.execute(
            select(func.count(Ticket.id)).where(field == value)
        )).scalar_one()

    return {
        "total": total,
        "por_status": {
            "aberto":       await count_by(Ticket.status, "aberto"),
            "em_progresso": await count_by(Ticket.status, "em_progresso"),
            "fechado":      await count_by(Ticket.status, "fechado"),
        },
        "por_prioridade": {
            "alta":  await count_by(Ticket.priority, "alta"),
            "media": await count_by(Ticket.priority, "media"),
            "baixa": await count_by(Ticket.priority, "baixa"),
        },
        "por_categoria": {
            "suporte":    await count_by(Ticket.category, "suporte"),
            "vendas":     await count_by(Ticket.category, "vendas"),
            "reclamacao": await count_by(Ticket.category, "reclamacao"),
            "urgente":    await count_by(Ticket.category, "urgente"),
        },
    }
