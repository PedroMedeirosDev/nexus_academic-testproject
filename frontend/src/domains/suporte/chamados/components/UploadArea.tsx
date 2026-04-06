"use client";

import { useRef, useState } from "react";

type Props = {
  onArquivos: (arquivos: File[]) => void;
  carregando?: boolean;
  aceitar?: string; // ex: "image/*,application/pdf"
};

export function UploadArea({ onArquivos, carregando, aceitar }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [arrastando, setArrastando] = useState(false);

  function processar(arquivos: FileList | null) {
    if (!arquivos || arquivos.length === 0) return;
    onArquivos(Array.from(arquivos));
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Área de upload de arquivos"
      onClick={() => !carregando && inputRef.current?.click()}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !carregando)
          inputRef.current?.click();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setArrastando(true);
      }}
      onDragLeave={() => setArrastando(false)}
      onDrop={(e) => {
        e.preventDefault();
        setArrastando(false);
        processar(e.dataTransfer.files);
      }}
      className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-sm transition-colors
        ${arrastando ? "border-blue-500 bg-blue-500/10 text-blue-300" : "border-white/20 bg-white/[0.03] text-zinc-400"}
        ${carregando ? "pointer-events-none opacity-50" : "hover:border-blue-500/60 hover:bg-blue-500/5 hover:text-blue-300"}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
      {carregando ? (
        <span>Enviando…</span>
      ) : (
        <>
          <span className="font-medium">
            Arraste arquivos aqui ou clique para anexar
          </span>
          <span className="text-xs text-zinc-600">
            Imagens, vídeos, PDFs, DOCX
          </span>
        </>
      )}
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={aceitar}
        className="hidden"
        onChange={(e) => processar(e.target.files)}
      />
    </div>
  );
}
