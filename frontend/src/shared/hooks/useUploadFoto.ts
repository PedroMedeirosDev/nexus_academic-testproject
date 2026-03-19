import { useState, useCallback } from "react";
import { uploadFotoUsuario } from "@/shared/services/uploadService";
import { apiClient } from "@/shared/services/apiClient";

interface UseUploadFotoOptions {
  usuarioId: string;
  onSucesso?: (fotoUrl: string) => void;
}

interface UseUploadFotoResult {
  uploading: boolean;
  erro: string | null;
  fotoUrl: string | null;
  upload: (arquivo: File) => Promise<void>;
  limparErro: () => void;
}

/**
 * Gerencia o ciclo completo de upload de foto de perfil:
 * 1. Envia o arquivo ao Supabase Storage
 * 2. Persiste a URL pública via PATCH /usuarios/{id}/foto no backend Go
 */
export function useUploadFoto({
  usuarioId,
  onSucesso,
}: UseUploadFotoOptions): UseUploadFotoResult {
  const [uploading, setUploading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);

  const upload = useCallback(
    async (arquivo: File) => {
      setUploading(true);
      setErro(null);

      try {
        // 1. Upload para o Supabase Storage
        const url = await uploadFotoUsuario(usuarioId, arquivo);

        // 2. Persiste a URL no banco via backend Go
        await apiClient.patch(`/usuarios/${usuarioId}/foto`, { fotoUrl: url });

        setFotoUrl(url);
        onSucesso?.(url);
      } catch (e) {
        const mensagem =
          e instanceof Error ? e.message : "Erro ao fazer upload da foto.";
        setErro(mensagem);
      } finally {
        setUploading(false);
      }
    },
    [usuarioId, onSucesso],
  );

  const limparErro = useCallback(() => setErro(null), []);

  return { uploading, erro, fotoUrl, upload, limparErro };
}
