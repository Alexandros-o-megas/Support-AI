"""
Serviço de IA — classificação, sumarização e geração de resposta
Usa a API da Groq (compatível com OpenAI Chat Completions)
"""

import json
import logging
import os
from dataclasses import dataclass

import httpx

logger = logging.getLogger("suporte-ia.ai")

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
API_URL = os.getenv("GROQ_API_URL", "https://api.groq.com/openai/v1/chat/completions")
MODEL = os.getenv("GROQ_MODEL", "llama-3.1-70b-versatile")


@dataclass
class AIResult:
    category:    str   # suporte | vendas | reclamacao | urgente
    priority:    str   # baixa | media | alta
    summary:     str
    ai_response: str   # resposta sugerida ao cliente


async def _call_groq(system: str, user: str, max_tokens: int = 800) -> str:
    if not GROQ_API_KEY:
        raise RuntimeError("GROQ_API_KEY não configurada.")

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "temperature": 0.2,
        "max_tokens": max_tokens,
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(API_URL, headers=headers, json=payload)
        r.raise_for_status()
        data = r.json()
        return data["choices"][0]["message"]["content"].strip()


async def process_message(text: str, origem: str = "api") -> AIResult:
    """
    Envia a mensagem do cliente para a IA e obtém:
    - categoria
    - prioridade
    - resumo
    - resposta sugerida ao cliente
    """
    system = """Você é um assistente especializado em suporte ao cliente para uma empresa moçambicana.
Analise a mensagem e responda SOMENTE com um objeto JSON válido, sem markdown, sem texto antes ou depois.

Estrutura obrigatória:
{
  "category": "<suporte|vendas|reclamacao|urgente>",
  "priority": "<baixa|media|alta>",
  "summary": "<resumo claro em 1-2 frases>",
  "ai_response": "<resposta profissional e empática ao cliente em português, max 3 frases>"
}

Regras de classificação:
- "urgente": linguagem de emergência, perigo, fraude, sistema totalmente fora
- "reclamacao": insatisfação, queixa, problema com produto/serviço
- "vendas": interesse em comprar, preço, planos, upgrade
- "suporte": dúvida técnica, ajuda, como usar

Regras de prioridade:
- "alta": urgente, reclamação grave, cliente bloqueado
- "media": problema funcional, reclamação moderada
- "baixa": dúvida informativa, interesse em vendas

A resposta deve ser em português de Moçambique."""

    user = f"Mensagem do cliente (origem: {origem}):\n\n{text}"

    raw = await _call_groq(system, user)

    try:
        data = json.loads(raw)
        # Normalise values
        cat = data.get("category", "suporte").lower()
        if cat not in ("suporte", "vendas", "reclamacao", "urgente"):
            cat = "suporte"
        pri = data.get("priority", "media").lower()
        if pri not in ("baixa", "media", "alta"):
            pri = "media"
        return AIResult(
            category=cat,
            priority=pri,
            summary=data.get("summary", "Sem resumo disponível."),
            ai_response=data.get("ai_response", "Obrigado pelo seu contacto. Iremos responder em breve."),
        )
    except (json.JSONDecodeError, KeyError) as exc:
        logger.warning("Falha ao parsear resposta da IA: %s — raw: %s", exc, raw[:200])
        return AIResult(
            category="suporte",
            priority="media",
            summary="Mensagem recebida — classificação manual necessária.",
            ai_response="Obrigado pelo seu contacto. A nossa equipa irá analisá-lo em breve.",
        )
