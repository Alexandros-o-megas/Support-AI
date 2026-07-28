"""
Modelos da base de dados — SQLAlchemy (async)
"""

import enum
from datetime import datetime

from sqlalchemy import (
    Column, DateTime, Enum, ForeignKey, Integer, String, Text, func,
)
from sqlalchemy.orm import DeclarativeBase, relationship


class Base(DeclarativeBase):
    pass


# ── Enums ─────────────────────────────────────────────────────────────────────

class CategoryEnum(str, enum.Enum):
    suporte    = "suporte"
    vendas     = "vendas"
    reclamacao = "reclamacao"
    urgente    = "urgente"


class PriorityEnum(str, enum.Enum):
    baixa = "baixa"
    media = "media"
    alta  = "alta"


class StatusEnum(str, enum.Enum):
    aberto      = "aberto"
    em_progresso = "em_progresso"
    fechado     = "fechado"


class OrigemEnum(str, enum.Enum):
    whatsapp = "whatsapp"
    email    = "email"
    api      = "api"


def _pg_enum(enum_cls, pg_name: str):
    """Enum SQLAlchemy alinhado com os tipos nativos criados em database/init.sql."""
    return Enum(
        enum_cls,
        name=pg_name,
        native_enum=True,
        create_type=False,
        values_callable=lambda e: [m.value for m in e],
    )


# ── Tables ────────────────────────────────────────────────────────────────────

class Message(Base):
    __tablename__ = "messages"

    id            = Column(Integer, primary_key=True, index=True)
    content       = Column(Text, nullable=False)
    sender_name   = Column(String(200), nullable=True)
    sender_contact = Column(String(200), nullable=True)   # phone ou email
    origem        = Column(_pg_enum(OrigemEnum, "origem_enum"), default=OrigemEnum.api, nullable=False)
    created_at    = Column(DateTime(timezone=True), server_default=func.now())

    ticket = relationship("Ticket", back_populates="message", uselist=False)


class Ticket(Base):
    __tablename__ = "tickets"

    id          = Column(Integer, primary_key=True, index=True)
    message_id  = Column(Integer, ForeignKey("messages.id"), nullable=False)
    category    = Column(_pg_enum(CategoryEnum, "category_enum"), nullable=False)
    summary     = Column(Text, nullable=False)
    priority    = Column(_pg_enum(PriorityEnum, "priority_enum"), nullable=False)
    status      = Column(_pg_enum(StatusEnum, "status_enum"), default=StatusEnum.aberto, nullable=False)
    ai_response = Column(Text, nullable=True)    # resposta gerada pela IA ao cliente
    erp_synced  = Column(String(10), default="false")
    created_at  = Column(DateTime(timezone=True), server_default=func.now())
    updated_at  = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    message = relationship("Message", back_populates="ticket")
