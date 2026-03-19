-- ─────────────────────────────────────────────────────────────────────────────
-- Nexus Acadêmico – Tabela de Alunos
-- Execute no Supabase SQL Editor após 001 e 002
-- ─────────────────────────────────────────────────────────────────────────────

-- Remove a tabela existente para garantir o schema correto (safe em dev)
DROP TABLE IF EXISTS alunos CASCADE;

CREATE TABLE alunos (
  id               SERIAL        PRIMARY KEY,
  id_unidade       INTEGER       NOT NULL REFERENCES unidades(id),
  nome             VARCHAR(150)  NOT NULL,
  codigo           VARCHAR(20)   NOT NULL UNIQUE,
  cpf              VARCHAR(14)   NOT NULL DEFAULT '',
  data_nascimento  DATE,
  situacao         VARCHAR(20)   NOT NULL DEFAULT 'Ativo'
                     CHECK (situacao IN ('Ativo','Inativo','Trancado','Formado')),
  criado_em        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  atualizado_em    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_alunos_unidade_situacao
  ON alunos (id_unidade, situacao);

CREATE INDEX idx_alunos_nome
  ON alunos (nome);

-- Seed: aluna Liz Dávila Nogueira (usada no componente de Ficha)
INSERT INTO alunos (id_unidade, nome, codigo, situacao)
VALUES (1, 'Liz Dávila Nogueira', '2502904484', 'Ativo')
ON CONFLICT (codigo) DO NOTHING;
ALTER TABLE usuarios 
ADD COLUMN foto_url TEXT;