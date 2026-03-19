-- ─────────────────────────────────────────────────────────────────────────────
-- Nexus Acadêmico – Adiciona foto_url à tabela de alunos
-- Execute no Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE alunos
  ADD COLUMN IF NOT EXISTS foto_url TEXT NOT NULL DEFAULT '';
