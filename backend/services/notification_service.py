"""
Serviço de notificações — simula envio de respostas via WhatsApp e Email
Em produção: integrar com Twilio (WhatsApp) e SendGrid/SMTP (email)
"""

import logging

logger = logging.getLogger("suporte-ia.notifications")

_sent_log: list[dict] = []


async def send_response(
    origem: str,
    contact: str | None,
    sender_name: str | None,
    ticket_id: int,
    ai_response: str,
) -> bool:
    """
    Simula o envio da resposta automática ao cliente.
    origem: "whatsapp" | "email" | "api"
    """
    if not contact:
        logger.warning("Ticket #%d — sem contacto para notificação.", ticket_id)
        return False

    name = sender_name or "Cliente"

    if origem == "whatsapp":
        logger.info(
            "📱 WhatsApp → %s (%s) | Ticket #%d\nMensagem: %s",
            name, contact, ticket_id, ai_response,
        )
        _sent_log.append({
            "canal": "whatsapp",
            "para": contact,
            "ticket_id": ticket_id,
            "mensagem": ai_response,
        })
    elif origem == "email":
        subject = f"[Ticket #{ticket_id}] Recebemos o seu contacto"
        body = f"""Olá {name},\n\n{ai_response}\n\nNúmero do seu ticket: #{ticket_id}\n\nCumprimentos,\nEquipa de Suporte"""
        logger.info(
            "✉️  Email → %s (%s) | Ticket #%d\nAssunto: %s\nCorpo:\n%s",
            name, contact, ticket_id, subject, body,
        )
        _sent_log.append({
            "canal": "email",
            "para": contact,
            "ticket_id": ticket_id,
            "assunto": subject,
            "mensagem": body,
        })
    else:
        logger.info("🔔 API → Ticket #%d processado. Sem notificação externa.", ticket_id)

    return True


def get_sent_log() -> list[dict]:
    return list(_sent_log)
