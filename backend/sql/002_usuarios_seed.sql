-- ─────────────────────────────────────────────────────────────────────────────
-- Nexus Acadêmico – Seed de usuários
-- Execute APÓS 001_calendario_chamados.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- Adiciona coluna perfil à tabela existente (seguro rodar novamente)
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS perfil VARCHAR(20) NOT NULL DEFAULT 'usuario';

-- Responsáveis / staff (podem ser atribuídos a chamados)
INSERT INTO usuarios (nome, email, senha, perfil) VALUES
  ('Moacir Schmidt',  'moacir.schmidt@nexus.edu.br',   '123456', 'staff'),
  ('Ana Paula Lima',  'ana.lima@nexus.edu.br',          '123456', 'staff'),
  ('João Carvalho',   'joao.carvalho@nexus.edu.br',     '123456', 'staff')
ON CONFLICT (email) DO UPDATE SET perfil = EXCLUDED.perfil;

-- Solicitantes / usuários gerais
INSERT INTO usuarios (nome, email, senha, perfil) VALUES
  ('Pedro Medeiros',  'pedro.medeiros@nexus.edu.br',   '123456', 'usuario'),
  ('Gustavo Gobira',  'gustavo.gobira@nexus.edu.br',   '123456', 'usuario'),
  ('Felipe Santos',   'felipe.santos@nexus.edu.br',    '123456', 'usuario'),
  ('Lucas Sobrinho',  'lucas.sobrinho@nexus.edu.br',   '123456', 'usuario'),
  ('Fátima Costa',    'fatima.costa@nexus.edu.br',     '123456', 'usuario'),
  ('Rui Barbosa',     'rui.barbosa@nexus.edu.br',      '123456', 'usuario'),
  ('Luciana Matos',   'luciana.matos@nexus.edu.br',    '123456', 'usuario'),
  ('Maria Silva',     'maria.silva@nexus.edu.br',      '123456', 'usuario')
ON CONFLICT (email) DO UPDATE SET perfil = EXCLUDED.perfil;
