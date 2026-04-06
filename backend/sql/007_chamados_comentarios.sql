-- ─────────────────────────────────────────────────────────────────────────────
-- Nexus Acadêmico – Comentários e Anexos de Chamados
-- Execute no Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- Comentários de cada chamado (substitui sup_historico_chamado como principal)
CREATE TABLE IF NOT EXISTS sup_comentarios (
  id            SERIAL        PRIMARY KEY,
  chamado_id    INTEGER       NOT NULL REFERENCES sup_chamados(id) ON DELETE CASCADE,
  usuario_id    UUID          NOT NULL,  -- auth.users.id
  autor_nome    VARCHAR(150)  NOT NULL,  -- nome snapshot para exibição
  texto         TEXT          NOT NULL,
  editado       BOOLEAN       NOT NULL DEFAULT FALSE,
  editado_em    TIMESTAMPTZ,
  criado_em     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sup_comentarios_chamado
  ON sup_comentarios (chamado_id, criado_em);

-- Anexos de chamados (ligados a um comentário ou ao próprio chamado)
CREATE TABLE IF NOT EXISTS sup_anexos (
  id            SERIAL        PRIMARY KEY,
  chamado_id    INTEGER       NOT NULL REFERENCES sup_chamados(id) ON DELETE CASCADE,
  comentario_id INTEGER       REFERENCES sup_comentarios(id) ON DELETE CASCADE,
  usuario_id    UUID          NOT NULL,
  nome_arquivo  VARCHAR(255)  NOT NULL,
  url           TEXT          NOT NULL,
  mime_type     VARCHAR(100)  NOT NULL DEFAULT '',
  tamanho_bytes BIGINT        NOT NULL DEFAULT 0,
  criado_em     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sup_anexos_chamado
  ON sup_anexos (chamado_id);

CREATE INDEX IF NOT EXISTS idx_sup_anexos_comentario
  ON sup_anexos (comentario_id);

-- RLS: usuário autenticado pode ler qualquer comentário/anexo de chamado
ALTER TABLE sup_comentarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE sup_anexos ENABLE ROW LEVEL SECURITY;

-- Leitura: qualquer usuário autenticado
CREATE POLICY "comentarios_select" ON sup_comentarios
  FOR SELECT TO authenticated USING (true);

-- Inserção: somente o próprio usuário
CREATE POLICY "comentarios_insert" ON sup_comentarios
  FOR INSERT TO authenticated WITH CHECK (usuario_id = auth.uid());

-- Atualização: somente o autor do comentário
CREATE POLICY "comentarios_update" ON sup_comentarios
  FOR UPDATE TO authenticated USING (usuario_id = auth.uid());

-- Exclusão: somente o autor
CREATE POLICY "comentarios_delete" ON sup_comentarios
  FOR DELETE TO authenticated USING (usuario_id = auth.uid());

-- Anexos: leitura pública autenticada
CREATE POLICY "anexos_select" ON sup_anexos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "anexos_insert" ON sup_anexos
  FOR INSERT TO authenticated WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "anexos_delete" ON sup_anexos
  FOR DELETE TO authenticated USING (usuario_id = auth.uid());

-- ─── Storage Bucket ───────────────────────────────────────────────────────────
-- Cria o bucket público para anexos de chamados (idempotente)
INSERT INTO storage.buckets (id, name, public)
VALUES ('chamados-anexos', 'chamados-anexos', true)
ON CONFLICT (id) DO NOTHING;

-- Política de upload: apenas usuários autenticados
CREATE POLICY "chamados_anexos_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'chamados-anexos');

-- Política de leitura pública
CREATE POLICY "chamados_anexos_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'chamados-anexos');

-- Política de exclusão: apenas o dono do arquivo
CREATE POLICY "chamados_anexos_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'chamados-anexos' AND owner = auth.uid()::text);
