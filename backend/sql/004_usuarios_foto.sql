-- ─────────────────────────────────────────────────────────────────────────────
-- Nexus Acadêmico – Adiciona foto_url à tabela de usuários
-- Execute no Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS foto_url TEXT NOT NULL DEFAULT '';
