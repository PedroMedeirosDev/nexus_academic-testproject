"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/shared/lib/supabaseClient";
import {
  comentariosService,
  anexosService,
  type Comentario,
  type Anexo,
} from "../services/comentariosService";
import { UploadArea } from "./UploadArea";
import { AnexoViewer } from "./AnexoViewer";

type Props = {
  chamadoId: number;
};

function formatarData(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
}

export function ComentariosSection({ chamadoId }: Props) {
  const [usuarioId, setUsuarioId] = useState<string | null>(null);
  const [autorNome, setAutorNome] = useState("");
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [anexosPorComentario, setAnexosPorComentario] = useState<
    Record<number, Anexo[]>
  >({});
  const [novoTexto, setNovoTexto] = useState("");
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [textoEdit, setTextoEdit] = useState("");
  const [textoEditOriginal, setTextoEditOriginal] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [uploadandoComentarioId, setUploadandoComentarioId] = useState<
    number | null
  >(null);
  const [uploadandoNovo, setUploadandoNovo] = useState(false);
  const [arquivosNovos, setArquivosNovos] = useState<File[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Carrega usuário logado
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUsuarioId(user.id);
        setAutorNome(
          user.user_metadata?.nome ??
            user.user_metadata?.full_name ??
            user.email ??
            "Usuário",
        );
      }
    });
  }, []);

  // Carrega comentários e seus anexos
  useEffect(() => {
    carregarTudo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chamadoId]);

  async function carregarTudo() {
    try {
      const [lista, todosAnexos] = await Promise.all([
        comentariosService.listar(chamadoId),
        anexosService.listar(chamadoId),
      ]);
      setComentarios(lista);

      // Agrupa anexos por comentario_id
      const mapa: Record<number, Anexo[]> = {};
      for (const a of todosAnexos) {
        const cid = a.comentario_id ?? -1;
        if (!mapa[cid]) mapa[cid] = [];
        mapa[cid].push(a);
      }
      setAnexosPorComentario(mapa);
    } catch (e: unknown) {
      setErro((e as Error).message);
    }
  }

  async function enviarComentario() {
    if (!novoTexto.trim() && arquivosNovos.length === 0) return;
    setEnviando(true);
    setErro(null);
    try {
      let comentario: Comentario | null = null;

      if (novoTexto.trim()) {
        comentario = await comentariosService.criar(
          chamadoId,
          novoTexto.trim(),
          autorNome,
        );
        setComentarios((prev) => [...prev, comentario!]);
      }

      // Upload dos arquivos selecionados
      if (arquivosNovos.length > 0) {
        setUploadandoNovo(true);
        const novosAnexos: Anexo[] = [];
        for (const arquivo of arquivosNovos) {
          const anexo = await anexosService.upload(
            chamadoId,
            comentario?.id ?? null,
            arquivo,
          );
          novosAnexos.push(anexo);
        }
        if (novosAnexos.length > 0) {
          const cid = comentario?.id ?? -1;
          setAnexosPorComentario((prev) => ({
            ...prev,
            [cid]: [...(prev[cid] ?? []), ...novosAnexos],
          }));
        }
        setUploadandoNovo(false);
      }

      setNovoTexto("");
      setArquivosNovos([]);
      setTimeout(
        () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
        100,
      );
    } catch (e: unknown) {
      setErro((e as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  function iniciarEdicao(c: Comentario) {
    setEditandoId(c.id);
    setTextoEdit(c.texto);
    setTextoEditOriginal(c.texto);
    setErro(null);
  }

  async function salvarEdicao(c: Comentario) {
    if (!textoEdit.trim()) return;
    setErro(null);
    try {
      const atualizado = await comentariosService.atualizar(
        c.id,
        textoEdit.trim(),
      );
      setComentarios((prev) =>
        prev.map((x) => (x.id === c.id ? atualizado : x)),
      );
    } catch (e: unknown) {
      setErro((e as Error).message);
    } finally {
      setEditandoId(null);
    }
  }

  async function uploadParaComentario(comentarioId: number, arquivos: File[]) {
    setUploadandoComentarioId(comentarioId);
    setErro(null);
    try {
      const novosAnexos: Anexo[] = [];
      for (const arquivo of arquivos) {
        const anexo = await anexosService.upload(
          chamadoId,
          comentarioId,
          arquivo,
        );
        novosAnexos.push(anexo);
      }
      setAnexosPorComentario((prev) => ({
        ...prev,
        [comentarioId]: [...(prev[comentarioId] ?? []), ...novosAnexos],
      }));
      // Marca o comentário como editado ao adicionar anexos
      const atualizado = await comentariosService.marcarEditado(comentarioId);
      setComentarios((prev) =>
        prev.map((x) => (x.id === comentarioId ? atualizado : x)),
      );
    } catch (e: unknown) {
      setErro((e as Error).message);
    } finally {
      setUploadandoComentarioId(null);
    }
  }

  async function excluirAnexo(anexo: Anexo) {
    setErro(null);
    try {
      await anexosService.excluir(anexo);
      const cid = anexo.comentario_id ?? -1;
      setAnexosPorComentario((prev) => ({
        ...prev,
        [cid]: (prev[cid] ?? []).filter((a) => a.id !== anexo.id),
      }));
    } catch (e: unknown) {
      setErro((e as Error).message);
    }
  }

  const inputCls =
    "w-full rounded-lg border border-white/10 bg-[#0b1020] px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500";

  return (
    <section className="rounded-2xl border border-white/10 bg-[#151b2d] p-5">
      {erro && (
        <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {erro}
        </div>
      )}

      {/* Anexos da descrição (vinculados ao chamado, sem comentário) */}
      {(anexosPorComentario[-1] ?? []).length > 0 && (
        <div className="mb-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-zinc-500">
            Anexos da descrição
          </p>
          <AnexoViewer
            anexos={anexosPorComentario[-1]}
            onExcluir={excluirAnexo}
            podeExcluir={(a) => a.usuario_id === usuarioId}
          />
        </div>
      )}

      <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-500">
        Comentários
      </p>

      {/* Lista de comentários */}
      {comentarios.length === 0 && (
        <p className="mb-4 text-sm text-zinc-600">Nenhum comentário ainda.</p>
      )}

      <ul className="mb-6 space-y-5">
        {comentarios.map((c) => {
          const ehAutor = c.usuario_id === usuarioId;
          const isEditando = editandoId === c.id;

          return (
            <li
              key={c.id}
              className="rounded-xl border border-white/5 bg-white/[0.02] p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-semibold text-zinc-200">
                    {c.autor_nome}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {formatarData(c.criado_em)}
                  </span>
                  {c.editado && c.editado_em && (
                    <span className="text-xs italic text-zinc-600">
                      editado em {formatarData(c.editado_em)}
                    </span>
                  )}
                </div>
                {ehAutor && !isEditando && (
                  <button
                    type="button"
                    onClick={() => iniciarEdicao(c)}
                    className="text-xs text-zinc-500 hover:text-zinc-300"
                  >
                    Editar
                  </button>
                )}
              </div>

              {isEditando ? (
                <div className="mt-2 space-y-2">
                  <textarea
                    rows={3}
                    value={textoEdit}
                    onChange={(e) => setTextoEdit(e.target.value)}
                    className={`${inputCls} resize-none`}
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => salvarEdicao(c)}
                      disabled={
                        !textoEdit.trim() || textoEdit === textoEditOriginal
                      }
                      className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-40"
                    >
                      Salvar
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditandoId(null)}
                      className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-400 hover:bg-white/5"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-300">
                  {c.texto}
                </p>
              )}

              {/* Anexos deste comentário */}
              <AnexoViewer
                anexos={anexosPorComentario[c.id] ?? []}
                onExcluir={ehAutor ? excluirAnexo : undefined}
                podeExcluir={() => true}
              />

              {/* Upload adicional — só visível ao editar */}
              {ehAutor && isEditando && (
                <div className="mt-3">
                  <UploadArea
                    onArquivos={(files) => uploadParaComentario(c.id, files)}
                    carregando={uploadandoComentarioId === c.id}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <div ref={bottomRef} />

      {/* Novo comentário */}
      <div className="space-y-3 border-t border-white/10 pt-4">
        <textarea
          rows={3}
          placeholder="Adicionar um comentário…"
          value={novoTexto}
          onChange={(e) => {
            setNovoTexto(e.target.value);
            setErro(null);
          }}
          className={`${inputCls} resize-none`}
        />

        {/* Arquivos selecionados para o novo comentário */}
        {arquivosNovos.length > 0 && (
          <ul className="space-y-1">
            {arquivosNovos.map((f, i) => (
              <li
                key={i}
                className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-300"
              >
                <span className="truncate">{f.name}</span>
                <button
                  type="button"
                  onClick={() =>
                    setArquivosNovos((prev) => prev.filter((_, j) => j !== i))
                  }
                  className="ml-2 text-zinc-500 hover:text-red-400"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}

        <UploadArea
          onArquivos={(files) =>
            setArquivosNovos((prev) => [...prev, ...files])
          }
          carregando={uploadandoNovo}
        />

        <button
          type="button"
          onClick={enviarComentario}
          disabled={
            enviando || (!novoTexto.trim() && arquivosNovos.length === 0)
          }
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-40"
        >
          {enviando ? "Enviando…" : "Comentar"}
        </button>
      </div>
    </section>
  );
}
