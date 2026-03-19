import { supabase } from "@/shared/lib/supabaseClient";

const BUCKET = "fotos_usuarios";

/**
 * Faz upload de uma imagem para o bucket 'fotos_usuarios' no Supabase Storage.
 * O arquivo é salvo em {usuarioId}/{timestamp}.{ext} para evitar colisões.
 * Retorna a URL pública permanente da imagem.
 */
export async function uploadFotoUsuario(
  usuarioId: string,
  arquivo: File,
): Promise<string> {
  const ext = arquivo.name.split(".").pop() ?? "jpg";
  const caminho = `${usuarioId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(caminho, arquivo, { upsert: true });

  if (uploadError) {
    throw new Error(`Falha no upload: ${uploadError.message}`);
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(caminho);

  return data.publicUrl;
}

/**
 * Faz upload da foto de um aluno para o bucket 'fotos_alunos'.
 * Caminho: {alunoId}/{timestamp}.{ext}
 */
export async function uploadFotoAluno(
  alunoId: number,
  arquivo: File,
): Promise<string> {
  const BUCKET_ALUNOS = "fotos_alunos";
  const ext = arquivo.name.split(".").pop() ?? "jpg";
  const caminho = `${alunoId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_ALUNOS)
    .upload(caminho, arquivo, { upsert: true });

  if (uploadError) {
    throw new Error(`Falha no upload: ${uploadError.message}`);
  }

  const { data } = supabase.storage.from(BUCKET_ALUNOS).getPublicUrl(caminho);
  return data.publicUrl;
}
