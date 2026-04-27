"""
Integração simulada com ERP
Quando categoria = "vendas", regista e envia para o ERP mock.
"""

import json
import logging
from datetime import datetime

logger = logging.getLogger("suporte-ia.erp")

# Simula um registo em memória do ERP (em produção seria uma chamada HTTP real)
_erp_log: list[dict] = []


async def sync_to_erp(ticket_id: int, category: str, summary: str, sender: str | None) -> bool:
    """
    Envia dados do ticket para o ERP simulado.
    Retorna True se sincronizado com sucesso.
    """
    if category != "vendas":
        return False

    entry = {
        "erp_ref":   f"ERP-{ticket_id:05d}",
        "ticket_id": ticket_id,
        "category":  category,
        "summary":   summary,
        "sender":    sender or "desconhecido",
        "synced_at": datetime.utcnow().isoformat(),
        "status":    "lead_criado",
    }

    _erp_log.append(entry)

    # Simula log de envio ao ERP
    logger.info(
        "📦 ERP SYNC → %s | Ticket #%d | Lead criado para '%s'",
        entry["erp_ref"], ticket_id, sender or "desconhecido",
    )
    logger.info("ERP payload: %s", json.dumps(entry, ensure_ascii=False))

    return True


def get_erp_log() -> list[dict]:
    """Retorna todos os registos simulados enviados ao ERP."""
    return list(_erp_log)
