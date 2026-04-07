"use client";

import { useEffect, useState } from "react";
import type { Anexo } from "../services/comentariosService";

type Props = {
  anexos: Anexo[];
  onExcluir?: (anexo: Anexo) => void;
  podeExcluir?: (anexo: Anexo) => boolean;
};

function tipoAnexo(
  mime: string,
  nome: string,
): "imagem" | "video" | "pdf" | "docx" | "outro" {
  if (mime.startsWith("image/")) return "imagem";
  if (mime.startsWith("video/")) return "video";
  if (mime === "application/pdf" || nome.toLowerCase().endsWith(".pdf"))
    return "pdf";
  if (
    mime ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    nome.toLowerCase().endsWith(".docx") ||
    nome.toLowerCase().endsWith(".doc")
  )
    return "docx";
  return "outro";
}

function formatarTamanho(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function IcoX() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function AnexoViewer({ anexos, onExcluir, podeExcluir }: Props) {
  const [modalIndex, setModalIndex] = useState<number | null>(null);

  // Navega com as teclas de seta quando a galeria está aberta
  useEffect(() => {
    if (modalIndex === null) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft")
        setModalIndex((i) => (i! - 1 + imagens.length) % imagens.length);
      else if (e.key === "ArrowRight")
        setModalIndex((i) => (i! + 1) % imagens.length);
      else if (e.key === "Escape") setModalIndex(null);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // imagens changes only when anexos changes, so this is stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalIndex]);

  if (anexos.length === 0) return null;

  const imagens = anexos.filter(
    (a) => tipoAnexo(a.mime_type, a.nome_arquivo) === "imagem",
  );
  const outros = anexos.filter(
    (a) => tipoAnexo(a.mime_type, a.nome_arquivo) !== "imagem",
  );

  return (
    <div className="mt-3 space-y-3">
      {/* Galeria de imagens */}
      {imagens.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {imagens.map((a) => (
            <div key={a.id} className="group relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={a.url}
                alt={a.nome_arquivo}
                onClick={() =>
                  setModalIndex(imagens.findIndex((img) => img.id === a.id))
                }
                className="h-20 w-20 cursor-zoom-in rounded-lg border border-white/10 object-cover hover:border-blue-500/40"
              />
              {onExcluir && podeExcluir?.(a) && (
                <button
                  type="button"
                  onClick={() => onExcluir(a)}
                  className="absolute -right-1.5 -top-1.5 hidden rounded-full bg-red-600 p-0.5 text-white group-hover:flex"
                >
                  <IcoX />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Outros anexos */}
      {outros.map((a) => {
        const tipo = tipoAnexo(a.mime_type, a.nome_arquivo);
        return (
          <div
            key={a.id}
            className="w-fit max-w-full overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]"
          >
            <div className="flex items-center justify-between px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-base">
                  {tipo === "video"
                    ? "🎬"
                    : tipo === "pdf"
                      ? "📄"
                      : tipo === "docx"
                        ? "📝"
                        : "📎"}
                </span>
                <span className="truncate text-xs text-zinc-300">
                  {a.nome_arquivo}
                </span>
                <span className="shrink-0 text-xs text-zinc-600">
                  {formatarTamanho(a.tamanho_bytes)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:underline"
                >
                  Abrir
                </a>
                {onExcluir && podeExcluir?.(a) && (
                  <button
                    type="button"
                    onClick={() => onExcluir(a)}
                    className="text-zinc-500 hover:text-red-400"
                  >
                    <IcoX />
                  </button>
                )}
              </div>
            </div>

            {/* Vídeo inline */}
            {tipo === "video" && (
              <div className="border-t border-white/10 p-3">
                <video
                  controls
                  className="block w-full max-w-2xl rounded-lg bg-black"
                  style={{ maxHeight: "360px" }}
                >
                  <source src={a.url} type={a.mime_type} />
                  Seu navegador não suporta o player de vídeo.
                </video>
              </div>
            )}

            {/* PDF inline */}
            {tipo === "pdf" && (
              <div className="border-t border-white/10 p-3">
                <iframe
                  src={a.url}
                  title={a.nome_arquivo}
                  className="h-96 w-full max-w-3xl rounded-lg border border-white/10"
                />
              </div>
            )}

            {/* DOCX via Microsoft Office Online */}
            {tipo === "docx" && (
              <div className="border-t border-white/10 p-3">
                <iframe
                  src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(a.url)}`}
                  title={a.nome_arquivo}
                  className="h-96 w-full max-w-3xl rounded-lg border border-white/10"
                />
              </div>
            )}
          </div>
        );
      })}

      {/* Galeria / lightbox */}
      {modalIndex !== null && imagens.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          onClick={() => setModalIndex(null)}
        >
          {/* Fechar */}
          <button
            type="button"
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/25"
            onClick={() => setModalIndex(null)}
          >
            <IcoX />
          </button>

          {/* Seta esquerda */}
          {imagens.length > 1 && (
            <button
              type="button"
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/25"
              onClick={(e) => {
                e.stopPropagation();
                setModalIndex(
                  (i) => (i! - 1 + imagens.length) % imagens.length,
                );
              }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}

          {/* Imagem atual */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imagens[modalIndex].url}
            alt={imagens[modalIndex].nome_arquivo}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] max-w-[80vw] rounded-xl object-contain shadow-2xl"
          />

          {/* Seta direita */}
          {imagens.length > 1 && (
            <button
              type="button"
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/25"
              onClick={(e) => {
                e.stopPropagation();
                setModalIndex((i) => (i! + 1) % imagens.length);
              }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )}

          {/* Contador */}
          {imagens.length > 1 && (
            <div className="absolute bottom-4 rounded-full bg-black/50 px-3 py-1 text-xs text-zinc-300">
              {modalIndex + 1} / {imagens.length}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
