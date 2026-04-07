import { supabase } from "@/shared/lib/supabaseClient";

export type Comentario = {
  id: number;
  chamado_id: number;
  usuario_id: string;
  autor_nome: string;
  texto: string;
  editado: boolean;
  editado_em: string | null;
  criado_em: string;
};

export type Anexo = {
  id: number;
  chamado_id: number;
  comentario_id: number | null;
  usuario_id: string;
  nome_arquivo: string;
  url: string;
  mime_type: string;
  tamanho_bytes: number;
  criado_em: string;
};

export const comentariosService = {
  listar: async (chamadoId: number): Promise<Comentario[]> => {
    const { data, error } = await supabase
      .from("sup_comentarios")
      .select("*")
      .eq("chamado_id", chamadoId)
      .order("criado_em", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  criar: async (
    chamadoId: number,
    texto: string,
    autorNome: string,
  ): Promise<Comentario> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    const { data, error } = await supabase
      .from("sup_comentarios")
      .insert({
        chamado_id: chamadoId,
        usuario_id: user.id,
        autor_nome: autorNome,
        texto,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  atualizar: async (id: number, textoNovo: string): Promise<Comentario> => {
    const { data, error } = await supabase
      .from("sup_comentarios")
      .update({
        texto: textoNovo,
        editado: true,
        editado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  marcarEditado: async (id: number): Promise<Comentario> => {
    const { data, error } = await supabase
      .from("sup_comentarios")
      .update({
        editado: true,
        editado_em: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  excluir: async (id: number): Promise<void> => {
    const { error } = await supabase
      .from("sup_comentarios")
      .delete()
      .eq("id", id);
    if (error) throw new Error(error.message);
  },
};

const BUCKET = "chamados-anexos";
export const ANEXO_MAX_BYTES = 50 * 1024 * 1024; // 50 MB
export const ANEXO_MAX_LABEL = "50 MB";

export const anexosService = {
  listar: async (chamadoId: number): Promise<Anexo[]> => {
    const { data, error } = await supabase
      .from("sup_anexos")
      .select("*")
      .eq("chamado_id", chamadoId)
      .order("criado_em", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  upload: async (
    chamadoId: number,
    comentarioId: number | null,
    file: File,
    onProgresso?: (pct: number) => void,
  ): Promise<Anexo> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw new Error("Sessão inválida");

    // Sanitiza o nome do arquivo para evitar path traversal
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${chamadoId}/${Date.now()}_${safeName}`;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

    // Upload via XHR para expor eventos de progresso reais
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${supabaseUrl}/storage/v1/object/${BUCKET}/${path}`);
      xhr.setRequestHeader("Authorization", `Bearer ${session.access_token}`);
      xhr.setRequestHeader(
        "Content-Type",
        file.type || "application/octet-stream",
      );
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgresso) {
          onProgresso(Math.round((e.loaded / e.total) * 100));
        }
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          onProgresso?.(100);
          resolve();
        } else {
          reject(
            new Error(`Upload falhou (${xhr.status}): ${xhr.responseText}`),
          );
        }
      };
      xhr.onerror = () => reject(new Error("Erro de rede no upload"));
      xhr.send(file);
    });

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);

    const { data, error } = await supabase
      .from("sup_anexos")
      .insert({
        chamado_id: chamadoId,
        comentario_id: comentarioId,
        usuario_id: user.id,
        nome_arquivo: safeName,
        url: urlData.publicUrl,
        mime_type: file.type,
        tamanho_bytes: file.size,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  excluir: async (anexo: Anexo): Promise<void> => {
    // Extrai o path relativo do bucket a partir da URL pública
    const url = new URL(anexo.url);
    const prefix = `/storage/v1/object/public/${BUCKET}/`;
    const storagePath = url.pathname.startsWith(prefix)
      ? url.pathname.slice(prefix.length)
      : null;

    if (storagePath) {
      await supabase.storage.from(BUCKET).remove([storagePath]);
    }

    const { error } = await supabase
      .from("sup_anexos")
      .delete()
      .eq("id", anexo.id);
    if (error) throw new Error(error.message);
  },
};
