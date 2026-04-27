-- ============================================================
-- Sistema de Automação de Suporte com IA
-- Script de inicialização da base de dados PostgreSQL
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Enums ──────────────────────────────────────────────────
DO $$ BEGIN
    CREATE TYPE category_enum AS ENUM ('suporte', 'vendas', 'reclamacao', 'urgente');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE priority_enum AS ENUM ('baixa', 'media', 'alta');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE status_enum AS ENUM ('aberto', 'em_progresso', 'fechado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE origem_enum AS ENUM ('whatsapp', 'email', 'api');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Tabela messages ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
    id              SERIAL PRIMARY KEY,
    content         TEXT        NOT NULL,
    sender_name     VARCHAR(200),
    sender_contact  VARCHAR(200),
    origem          origem_enum NOT NULL DEFAULT 'api',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Tabela tickets ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tickets (
    id          SERIAL PRIMARY KEY,
    message_id  INTEGER     NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    category    category_enum NOT NULL,
    summary     TEXT        NOT NULL,
    priority    priority_enum NOT NULL,
    status      status_enum  NOT NULL DEFAULT 'aberto',
    ai_response TEXT,
    erp_synced  VARCHAR(10)  NOT NULL DEFAULT 'false',
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Índices ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_tickets_status    ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority  ON tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_category  ON tickets(category);
CREATE INDEX IF NOT EXISTS idx_tickets_created   ON tickets(created_at DESC);

-- ── Trigger: updated_at automático ─────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tickets_updated_at ON tickets;
CREATE TRIGGER trg_tickets_updated_at
    BEFORE UPDATE ON tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Dados de exemplo ────────────────────────────────────────
INSERT INTO messages (content, sender_name, sender_contact, origem) VALUES
('O meu internet está fora desde ontem à noite. Preciso de ajuda urgente!', 'João Machava', '+258841234567', 'whatsapp'),
('Quero saber os preços dos planos empresariais. Tenho interesse.', 'Maria Sitoe', 'maria@empresa.co.mz', 'email'),
('Cobram-me dois meses mas só usei um. Isto é um roubo!', 'Carlos Tembe', '+258871112233', 'whatsapp'),
('Como faço para mudar a password da minha conta?', 'Ana Cumbe', 'ana.cumbe@gmail.com', 'email')
ON CONFLICT DO NOTHING;
