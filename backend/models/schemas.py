"""
Schemas Pydantic — validação de entrada/saída
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


# ── Request ───────────────────────────────────────────────────────────────────

class MessageCreate(BaseModel):
    content:        str          = Field(..., min_length=3, max_length=5000, description="Texto da mensagem do cliente")
    sender_name:    Optional[str] = Field(None, max_length=200)
    sender_contact: Optional[str] = Field(None, max_length=200, description="Número de telefone ou endereço de email")
    origem:         Optional[str] = Field("api", description="whatsapp | email | api")


class TicketStatusUpdate(BaseModel):
    status: str = Field(..., description="aberto | em_progresso | fechado")


# ── Response ──────────────────────────────────────────────────────────────────

class MessageOut(BaseModel):
    id:             int
    content:        str
    sender_name:    Optional[str]
    sender_contact: Optional[str]
    origem:         str
    created_at:     datetime

    model_config = {"from_attributes": True}


class TicketOut(BaseModel):
    id:          int
    message_id:  int
    category:    str
    summary:     str
    priority:    str
    status:      str
    ai_response: Optional[str]
    erp_synced:  str
    created_at:  datetime
    updated_at:  datetime
    message:     Optional[MessageOut] = None

    model_config = {"from_attributes": True}


class ProcessResult(BaseModel):
    message: MessageOut
    ticket:  TicketOut


class PaginatedTickets(BaseModel):
    total:   int
    page:    int
    size:    int
    pages:   int
    items:   list[TicketOut]
