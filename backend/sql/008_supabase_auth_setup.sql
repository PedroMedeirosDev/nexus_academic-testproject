-- ─────────────────────────────────────────────────────────────────────────────
-- Nexus Acadêmico – Migração para Supabase Auth
-- Execute no Supabase SQL Editor (requer permissão de service_role / admin)
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Adiciona coluna auth_id para vincular ao auth.users do Supabase
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS auth_id UUID UNIQUE;

CREATE INDEX IF NOT EXISTS idx_usuarios_auth_id
  ON usuarios (auth_id);

-- 2. Cria os usuários no Supabase Auth a partir dos dados da tabela usuarios
--    Usa WHERE NOT EXISTS para ser idempotente (seguro rodar múltiplas vezes)
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  confirmation_token,
  recovery_token,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated',
  'authenticated',
  u.email,
  crypt(u.senha, gen_salt('bf', 10)),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('nome', u.nome, 'perfil', u.perfil),
  '',
  '',
  now(),
  now()
FROM usuarios u
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users a WHERE a.email = u.email
);

-- 2b. Cria identidades no auth.identities (OBRIGATÓRIO para signInWithPassword funcionar)
INSERT INTO auth.identities (
  id,
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  a.email,
  a.id,
  jsonb_build_object('sub', a.id::text, 'email', a.email),
  'email',
  now(),
  now(),
  now()
FROM auth.users a
WHERE NOT EXISTS (
  SELECT 1 FROM auth.identities i WHERE i.user_id = a.id
);

-- 3. Vincula auth_id ao registro correspondente na tabela usuarios
UPDATE usuarios u
SET auth_id = a.id
FROM auth.users a
WHERE a.email = u.email
  AND u.auth_id IS NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- PRÓXIMO PASSO (backend):
-- Adicione ao arquivo backend/.env:
--   SUPABASE_URL=https://uvjadvezqawqpkccnyhs.supabase.co
-- Não é mais necessário o SUPABASE_JWT_SECRET — o backend usa JWKS (chave pública)
-- ─────────────────────────────────────────────────────────────────────────────
