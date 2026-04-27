"""
Rota /messages — recepção e processamento de mensagens com IA
"""

import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database.connection import get_db
from models.models import Message, Ticket, OrigemEnum
from models.schemas import MessageCreate, ProcessResult
from services.ai_service import process_message
from services.erp_service import sync_to_erp
from services.notification_service import send_response

logger = logging.getLogger("suporte-ia.routes.messages")
router = APIRouter(prefix="/messages", tags=["Messages"])


@router.post("", response_model=ProcessResult, status_code=201, summary="Receber e processar mensagem com IA")
async def receive_message(payload: MessageCreate, db: AsyncSession = Depends(get_db)):
    """
    Recebe uma mensagem de cliente, processa com IA e cria um ticket automaticamente.

    - **content**: Texto da mensagem (obrigatório)
    - **sender_name**: Nome do cliente (opcional)
    - **sender_contact**: Telefone ou email do cliente (opcional)
    - **origem**: Origem da mensagem — `whatsapp`, `email` ou `api`
    """
    # 1. Validar origem
    origem_val = payload.origem or "api"
    try:
        origem_enum = OrigemEnum(origem_val.lower())
    except ValueError:
        raise HTTPException(status_code=422, detail=f"Origem inválida: {origem_val}. Use whatsapp, email ou api.")

    logger.info("Nova mensagem recebida via %s de '%s'", origem_val, payload.sender_name or "desconhecido")

    # 2. Guardar mensagem na BD
    msg = Message(
        content=payload.content,
        sender_name=payload.sender_name,
        sender_contact=payload.sender_contact,
        origem=origem_enum,
    )
    db.add(msg)
    await db.flush()  # obter ID sem commit

    # 3. Processar com IA
    logger.info("Processando mensagem #%d com IA…", msg.id)
    try:
        result = await process_message(payload.content, origem=origem_val)
    except Exception as exc:
        logger.error("Erro na IA: %s", exc)
        await db.rollback()
        raise HTTPException(status_code=502, detail="Falha ao comunicar com o serviço de IA. Tente novamente.")

    logger.info(
        "IA → categoria=%s | prioridade=%s | resumo=%s",
        result.category, result.priority, result.summary[:80],
    )

    # 4. Criar ticket
    ticket = Ticket(
        message_id=msg.id,
        category=result.category,
        summary=result.summary,
        priority=result.priority,
        ai_response=result.ai_response,
    )
    db.add(ticket)
    await db.commit()
    await db.refresh(msg)
    await db.refresh(ticket)

    # Carregar relação
    ticket.message = msg

    # 5. Integração ERP (assíncrono — não bloqueia resposta)
    try:
        synced = await sync_to_erp(ticket.id, result.category, result.summary, payload.sender_name)
        if synced:
            ticket.erp_synced = "true"
            await db.commit()
    except Exception as exc:
        logger.warning("ERP sync falhou (não crítico): %s", exc)

    # 6. Enviar resposta ao cliente (simulado)
    try:
        await send_response(
            origem=origem_val,
            contact=payload.sender_contact,
            sender_name=payload.sender_name,
            ticket_id=ticket.id,
            ai_response=result.ai_response,
        )
    except Exception as exc:
        logger.warning("Notificação falhou (não crítica): %s", exc)

    logger.info("Ticket #%d criado com sucesso.", ticket.id)

    return ProcessResult(
        message=msg,
        ticket=ticket,
    )
