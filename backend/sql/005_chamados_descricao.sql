-- ─────────────────────────────────────────────────────────────────────────────
-- Nexus Acadêmico – Adiciona descricao à tabela de chamados
-- Execute no Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE sup_chamados
  ADD COLUMN IF NOT EXISTS descricao TEXT NOT NULL DEFAULT '';
