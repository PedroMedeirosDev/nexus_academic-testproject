"use client";

import { useRef, useState, useEffect, ChangeEvent } from "react";
import { useUploadFoto } from "@/shared/hooks/useUploadFoto";

export function PerfilPage() {
  const [usuarioId, setUsuarioId] = useState("");
  const [nomeUsuario, setNomeUsuario] = useState("Usuário");
  const [emailUsuario, setEmailUsuario] = useState("");
  const [fotoAtual, setFotoAtual] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const id = localStorage.getItem("sessao_usuario_id") ?? "";
    const nome = localStorage.getItem("sessao_usuario_nome") ?? "Usuário";
    const email = localStorage.getItem("sessao_usuario_email") ?? "";
    setUsuarioId(id);
    setNomeUsuario(nome);
    setEmailUsuario(email);
  }, []);

  const { uploading, erro, fotoUrl, upload, limparErro } = useUploadFoto({
    usuarioId,
    onSucesso: (url) => {
      setFotoAtual(url);
      setPreview(null);
    },
  });

  // Usa a URL mais recente disponível: resultado do upload > foto atual > null
  const fotoExibida = fotoUrl ?? fotoAtual;
  const inicial = nomeUsuario.charAt(0).toUpperCase();

  function handleSelecionarArquivo(e: ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;

    limparErro();

    // Gera preview local antes do upload
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(arquivo);

    upload(arquivo);

    // Limpa o input para permitir reselecionar o mesmo arquivo
    e.target.value = "";
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="rounded-2xl border border-white/10 bg-[#151b2d] p-6">
        <h2 className="text-xl font-semibold">Foto de Perfil</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Tipos aceitos: JPG, PNG, WEBP. Tamanho máximo: 5 MB.
        </p>

        <div className="mt-6 flex flex-col items-center gap-5 sm:flex-row sm:items-start">
          {/* Avatar */}
          <div className="relative shrink-0">
            {(preview ?? fotoExibida) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={(preview ?? fotoExibida)!}
                alt="Foto de perfil"
                className="h-24 w-24 rounded-full border-2 border-blue-500/40 object-cover"
              />
            ) : (
              <span className="inline-flex h-24 w-24 items-center justify-center rounded-full border-2 border-blue-500/30 bg-[#10182d] text-3xl font-bold text-blue-300">
                {inicial}
              </span>
            )}

            {uploading && (
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 text-xs text-white">
                Enviando…
              </span>
            )}
          </div>

          {/* Controles */}
          <div className="flex flex-col gap-3">
            <button
              type="button"
              disabled={uploading || !usuarioId}
              onClick={() => inputRef.current?.click()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploading ? "Enviando…" : "Alterar foto"}
            </button>

            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleSelecionarArquivo}
            />

            {fotoExibida && !uploading && (
              <p className="text-xs text-emerald-400">
                ✓ Foto atualizada com sucesso
              </p>
            )}

            {erro && <p className="text-xs text-red-400">{erro}</p>}
          </div>
        </div>
      </div>

      {/* Informações da conta */}
      <div className="rounded-2xl border border-white/10 bg-[#151b2d] p-6">
        <h2 className="text-xl font-semibold">Informações da Conta</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex gap-3">
            <dt className="w-20 shrink-0 text-zinc-500">Nome</dt>
            <dd className="font-medium">{nomeUsuario}</dd>
          </div>
          <div className="flex gap-3">
            <dt className="w-20 shrink-0 text-zinc-500">E-mail</dt>
            <dd className="font-medium">{emailUsuario || "—"}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
