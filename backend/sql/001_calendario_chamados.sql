-- ─────────────────────────────────────────────────────────────────────────────
-- Nexus Acadêmico – DDL inicial
-- Execute no Supabase SQL Editor (ou psql)
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Unidades (campi / escolas)
CREATE TABLE IF NOT EXISTS unidades (
  id    SERIAL       PRIMARY KEY,
  nome  VARCHAR(100) NOT NULL,
  sigla VARCHAR(10)  NOT NULL UNIQUE
);

-- Seed: unidade padrão "Nexus"
INSERT INTO unidades (nome, sigla) VALUES ('Nexus', 'CD')
  ON CONFLICT (sigla) DO NOTHING;


-- ─── Calendário ──────────────────────────────────────────────────────────────

-- 2. Eventos do calendário
CREATE TABLE IF NOT EXISTS cal_eventos (
  id            SERIAL        PRIMARY KEY,
  id_unidade    INTEGER       NOT NULL REFERENCES unidades(id),
  titulo        VARCHAR(255)  NOT NULL,
  descricao     VARCHAR(1000) NOT NULL DEFAULT '',
  data          DATE          NOT NULL,
  hora_inicio   VARCHAR(5)    NOT NULL DEFAULT '',   -- "HH:MM" ou vazio
  hora_fim      VARCHAR(5)    NOT NULL DEFAULT '',   -- "HH:MM" ou vazio
  dia_inteiro   BOOLEAN       NOT NULL DEFAULT FALSE,
  criado_em     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cal_eventos_unidade_data
  ON cal_eventos (id_unidade, data);


-- ─── Suporte / Chamados ───────────────────────────────────────────────────────

-- 3. Chamados de suporte
CREATE TABLE IF NOT EXISTS sup_chamados (
  id            SERIAL        PRIMARY KEY,
  id_unidade    INTEGER       NOT NULL REFERENCES unidades(id),
  assunto       VARCHAR(255)  NOT NULL,
  situacao      VARCHAR(20)   NOT NULL DEFAULT 'Aberto'
                  CHECK (situacao IN ('Aberto','Em andamento','Resolvido','Fechado')),
  prioridade    VARCHAR(10)   NOT NULL DEFAULT 'Normal'
                  CHECK (prioridade IN ('Urgente','Alta','Normal','Baixa')),
  tipo          VARCHAR(50)   NOT NULL DEFAULT '',
  setor         VARCHAR(50)   NOT NULL DEFAULT '',
  solicitante   VARCHAR(100)  NOT NULL,
  responsavel   VARCHAR(100)  NOT NULL DEFAULT '',
  criado_em     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sup_chamados_unidade
  ON sup_chamados (id_unidade, criado_em DESC);

-- 4. Histórico / conversação de cada chamado
CREATE TABLE IF NOT EXISTS sup_historico_chamado (
  id          SERIAL       PRIMARY KEY,
  id_chamado  INTEGER      NOT NULL REFERENCES sup_chamados(id) ON DELETE CASCADE,
  autor       VARCHAR(100) NOT NULL,
  mensagem    TEXT         NOT NULL,
  criado_em   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sup_historico_chamado
  ON sup_historico_chamado (id_chamado, criado_em);
