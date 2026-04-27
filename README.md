# Sistema de Automação de Suporte com IA

Sistema completo para automatização de atendimento ao cliente com Inteligência Artificial, classificação automática de mensagens e gestão de tickets.

---

## Arquitectura

```
suporte-ia/
├── backend/                  # Python + FastAPI
│   ├── main.py               # Entrada da aplicação
│   ├── routes/
│   │   ├── messages.py       # POST /messages
│   │   ├── tickets.py        # GET/PATCH /tickets
│   │   └── health.py         # GET /health
│   ├── models/
│   │   ├── models.py         # SQLAlchemy ORM
│   │   └── schemas.py        # Pydantic schemas
│   ├── services/
│   │   ├── ai_service.py     # Integração Groq API (OpenAI-compatible)
│   │   ├── erp_service.py    # ERP simulado
│   │   └── notification_service.py  # WhatsApp/Email simulado
│   ├── database/
│   │   └── connection.py     # Conexão PostgreSQL async
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                 # React + Vite
│   ├── src/
│   │   ├── main.jsx
│   │   └── App.jsx           # Dashboard completo
│   ├── nginx.conf
│   └── Dockerfile
├── database/
│   └── init.sql              # Schema + dados de exemplo
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Stack Tecnológica

| Camada        | Tecnologia                          |
|---------------|-------------------------------------|
| Backend       | Python 3.12, FastAPI, Uvicorn       |
| Base de Dados | PostgreSQL 16, SQLAlchemy (async)   |
| Frontend      | React 18, Vite, CSS customizado     |
| IA            | Groq (Chat Completions)             |
| Infra         | Docker, Docker Compose, Nginx       |

---

## Pré-requisitos

- Docker e Docker Compose instalados
- Chave da API Groq (`GROQ_API_KEY`)

---

## Instalação e Arranque

### 1. Clonar e configurar variáveis de ambiente

```bash
cd suporte-ia
cp .env.example .env
# Editar .env e adicionar a GROQ_API_KEY
```

### 2. Arrancar todos os serviços

```bash
docker-compose up --build
```

Serviços disponíveis:
- **Dashboard**: http://localhost:3000
- **API Backend**: http://localhost:8000
- **Documentação Swagger**: http://localhost:8000/docs
- **PostgreSQL**: localhost:5432

### 3. (Sem Docker) Desenvolvimento local

```bash
# Backend
cd backend
pip install -r requirements.txt
export DATABASE_URL="postgresql+asyncpg://user:pass@localhost:5432/suporte_ia"
export GROQ_API_KEY="gsk_..."
uvicorn main:app --reload --port 8000

# Frontend (outro terminal)
cd frontend
npm install
VITE_API_URL=http://localhost:8000 npm run dev
```

---

## API REST — Referência

### POST /messages
Recebe uma mensagem, processa com IA e cria um ticket.

**Corpo (JSON):**
```json
{
  "content": "O meu serviço está fora desde ontem à noite!",
  "sender_name": "João Machava",
  "sender_contact": "+258841234567",
  "origem": "whatsapp"
}
```

`origem` aceita: `whatsapp` | `email` | `api`

**Resposta (201):**
```json
{
  "message": { "id": 1, "content": "...", "origem": "whatsapp", ... },
  "ticket": {
    "id": 1,
    "category": "urgente",
    "priority": "alta",
    "summary": "Cliente reporta interrupção de serviço.",
    "status": "aberto",
    "ai_response": "Pedimos desculpa pelo inconveniente. A nossa equipa está a investigar.",
    "erp_synced": "false",
    ...
  }
}
```

---

### GET /tickets
Lista tickets com filtros e paginação.

**Parâmetros de query:**
| Parâmetro | Tipo   | Valores                                  |
|-----------|--------|------------------------------------------|
| page      | int    | default: 1                               |
| size      | int    | default: 20, max: 100                    |
| status    | string | aberto / em_progresso / fechado          |
| priority  | string | alta / media / baixa                     |
| category  | string | suporte / vendas / reclamacao / urgente  |

**Exemplo:**
```
GET /tickets?status=aberto&priority=alta&page=1&size=10
```

---

### GET /tickets/{id}
Retorna detalhe completo de um ticket (com mensagem original).

---

### PATCH /tickets/{id}
Actualiza o status de um ticket.

```json
{ "status": "em_progresso" }
```

---

### GET /tickets/stats/summary
Retorna contagens para o dashboard.

```json
{
  "total": 42,
  "por_status": { "aberto": 15, "em_progresso": 8, "fechado": 19 },
  "por_prioridade": { "alta": 7, "media": 20, "baixa": 15 },
  "por_categoria": { "suporte": 18, "vendas": 10, "reclamacao": 9, "urgente": 5 }
}
```

---

## Como a IA Funciona

Para cada mensagem recebida, o sistema envia um prompt estruturado à API da Groq com instruções para retornar JSON com:

```
{
  "category": "suporte | vendas | reclamacao | urgente",
  "priority": "baixa | media | alta",
  "summary": "resumo em 1-2 frases",
  "ai_response": "resposta ao cliente em português"
}
```

**Regras de classificação:**
- `urgente`: linguagem de emergência, fraude, sistema totalmente fora
- `reclamacao`: insatisfação, queixa, problema
- `vendas`: interesse em comprar, preços, planos
- `suporte`: dúvida técnica, ajuda, como usar

**Regras de prioridade:**
- `alta`: urgente, cliente bloqueado, reclamação grave
- `media`: problema funcional, reclamação moderada
- `baixa`: dúvida informativa, interesse em vendas

---

## Integração ERP (Simulada)

Quando um ticket é classificado como **`vendas`**, o sistema:
1. Cria um registo interno `ERP-00001`
2. Loga no console: `📦 ERP SYNC → ERP-00001 | Ticket #5 | Lead criado`
3. Marca o ticket com `erp_synced: true`
4. O campo aparece no dashboard com tag "ERP"

Em produção, substituir `services/erp_service.py` por uma chamada HTTP real ao ERP.

---

## Notificações (Simuladas)

Conforme a origem da mensagem:

- **WhatsApp** → loga: `📱 WhatsApp → João (+258841234567) | Ticket #1 | Mensagem: …`
- **Email** → loga: `✉️ Email → maria@empresa.co.mz | Assunto: [Ticket #2] Recebemos o seu contacto`
- **API** → sem notificação externa

Em produção, integrar com:
- **WhatsApp**: Twilio WhatsApp API ou Meta Cloud API
- **Email**: SendGrid, Mailgun, ou SMTP

---

## Exemplos de Teste (curl)

```bash
# Mensagem urgente via WhatsApp
curl -X POST http://localhost:8000/messages \
  -H "Content-Type: application/json" \
  -d '{
    "content": "AJUDA! O sistema não funciona e tenho uma apresentação em 1 hora!",
    "sender_name": "Carlos Tembe",
    "sender_contact": "+258871112233",
    "origem": "whatsapp"
  }'

# Interesse em vendas via email
curl -X POST http://localhost:8000/messages \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Boa tarde, gostaria de saber os preços para um plano empresarial de 50 utilizadores.",
    "sender_name": "Empresa XYZ",
    "sender_contact": "compras@xyz.co.mz",
    "origem": "email"
  }'

# Listar tickets urgentes
curl "http://localhost:8000/tickets?category=urgente&priority=alta"

# Actualizar status
curl -X PATCH http://localhost:8000/tickets/1 \
  -H "Content-Type: application/json" \
  -d '{"status": "em_progresso"}'
```

---

## Dashboard

Aceder em: **http://localhost:3000**

**Funcionalidades:**
- Dashboard com métricas em tempo real (total, por status, por prioridade, por categoria)
- Lista de tickets com filtros (status, prioridade, categoria)
- Paginação
- Modal de detalhe com mensagem original, resumo IA, resposta IA
- Actualização de status directamente no modal
- Tags ERP e origem (WhatsApp/email/API)
- Formulário para submeter nova mensagem manualmente

---

## Variáveis de Ambiente

| Variável           | Obrigatória | Descrição                         |
|--------------------|-------------|-----------------------------------|
| GROQ_API_KEY       | ✅ Sim      | Chave API da Groq                 |
| DATABASE_URL       | Não (Docker) | URL da base de dados PostgreSQL  |

---

## Logs

Os logs são emitidos com timestamps estruturados:

```
2026-04-27 10:23:01 [INFO] suporte-ia.routes.messages — Nova mensagem recebida via whatsapp de 'Carlos Tembe'
2026-04-27 10:23:01 [INFO] suporte-ia.routes.messages — Processando mensagem #5 com IA…
2026-04-27 10:23:03 [INFO] suporte-ia.ai — IA → categoria=urgente | prioridade=alta | resumo=Cliente reporta...
2026-04-27 10:23:03 [INFO] suporte-ia.notifications — 📱 WhatsApp → Carlos Tembe (+258871112233) | Ticket #5
```

Ver logs em tempo real:
```bash
docker-compose logs -f backend
```
