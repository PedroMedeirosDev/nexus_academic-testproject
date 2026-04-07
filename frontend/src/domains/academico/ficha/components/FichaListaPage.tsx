"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, UserPlus, GraduationCap, X } from "lucide-react";
import { useAlunos } from "../hooks/useAlunos";
import type { Aluno } from "../services/alunosService";

// ─── Badge de situação ────────────────────────────────────────────────────────

function BadgeSituacao({ situacao }: { situacao: Aluno["situacao"] }) {
  const cls = {
    Ativo: "bg-emerald-500/15 text-emerald-400",
    Inativo: "bg-zinc-500/15 text-zinc-400",
    Trancado: "bg-amber-500/15 text-amber-400",
    Formado: "bg-blue-500/15 text-blue-400",
  }[situacao];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {situacao}
    </span>
  );
}

// ─── Linha skeleton de carregamento ──────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-white/5 bg-white/2 px-4 py-3 animate-pulse">
      <div className="h-9 w-9 shrink-0 rounded-full bg-white/8" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-1/3 rounded bg-white/8" />
        <div className="h-2 w-1/4 rounded bg-white/6" />
      </div>
      <div className="h-5 w-14 rounded-full bg-white/8" />
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function FichaListaPage() {
  const router = useRouter();
  const [busca, setBusca] = useState("");
  const [filtroAtivo, setFiltroAtivo] = useState("");

  // Debounce: atualiza o filtro 400 ms após o usuário parar de digitar
  useEffect(() => {
    const timer = setTimeout(() => setFiltroAtivo(busca.trim()), 400);
    return () => clearTimeout(timer);
  }, [busca]);

  const filtros = filtroAtivo ? { nome: filtroAtivo } : {};
  const {
    alunos,
    count,
    isLoading,
    isError,
    error,
    hasNextPage,
    carregarMais,
    isFetchingNextPage,
  } = useAlunos(filtros);

  function limpar() {
    setBusca("");
    setFiltroAtivo("");
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-zinc-500">
          Busque um aluno para acessar a ficha ou cadastre um novo.
        </p>
        <button
          type="button"
          onClick={() => router.push("/academico/ficha/novo")}
          className="flex shrink-0 items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
        >
          <UserPlus size={15} />
          Novo Aluno
        </button>
      </div>

      {/* Barra de pesquisa */}
      <div className="relative">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
        />
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome ou código…"
          maxLength={150}
          className="w-full rounded-lg border border-white/10 bg-[#121827] py-2.5 pl-9 pr-9 text-sm text-zinc-200 placeholder-zinc-600 outline-none transition focus:border-primary-600/60 focus:ring-1 focus:ring-primary-600/30"
        />
        {busca && (
          <button
            type="button"
            onClick={limpar}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Resultado */}
      <div className="space-y-2">
        {/* Contador */}
        {!isLoading && !isError && (
          <p className="text-xs text-zinc-600">
            {filtroAtivo
              ? `${count} resultado${count !== 1 ? "s" : ""} para "${filtroAtivo}"`
              : `${count} aluno${count !== 1 ? "s" : ""} cadastrado${count !== 1 ? "s" : ""}`}
          </p>
        )}

        {/* Erro */}
        {isError && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            Erro ao buscar alunos:{" "}
            {error instanceof Error ? error.message : "Tente novamente."}
          </div>
        )}

        {/* Skeletons de carregamento */}
        {isLoading && (
          <div className="space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        )}

        {/* Lista de alunos */}
        {!isLoading && !isError && alunos.length > 0 && (
          <div className="space-y-1.5">
            {alunos.map((aluno) => (
              <button
                key={aluno.id}
                type="button"
                onClick={() => router.push(`/academico/ficha/${aluno.id}`)}
                className="flex w-full items-center gap-4 rounded-xl border border-white/6 bg-[#121827] px-4 py-3 text-left transition hover:border-blue-500/30 hover:bg-blue-600/5"
              >
                {/* Avatar */}
                <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-800 text-sm font-bold text-zinc-300 select-none">
                  {aluno.fotoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={aluno.fotoUrl} alt={aluno.nome} className="h-full w-full object-cover" />
                  ) : (
                    aluno.nome.charAt(0).toUpperCase()
                  )}
                </div>

                {/* Dados */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-100">
                    {aluno.nome}
                  </p>
                  <p className="truncate text-xs text-zinc-500">
                    Código: {aluno.codigo}
                    {aluno.cpf && ` · CPF: ${aluno.cpf}`}
                  </p>
                </div>

                <BadgeSituacao situacao={aluno.situacao} />
              </button>
            ))}
          </div>
        )}

        {/* Estado vazio */}
        {!isLoading && !isError && alunos.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/8 bg-[#121827] py-20 text-center">
            <GraduationCap size={32} className="mb-3 text-zinc-700" />
            <p className="text-sm font-medium text-zinc-400">
              {filtroAtivo
                ? "Nenhum aluno encontrado para esta busca."
                : "Nenhum aluno cadastrado ainda."}
            </p>
            {filtroAtivo && (
              <button
                type="button"
                onClick={limpar}
                className="mt-3 text-xs text-blue-400 hover:underline"
              >
                Limpar filtro
              </button>
            )}
          </div>
        )}

        {/* Carregar mais */}
        {hasNextPage && !isLoading && (
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => carregarMais()}
              disabled={isFetchingNextPage}
              className="rounded-lg border border-white/10 bg-[#121827] px-4 py-2 text-sm text-zinc-400 transition hover:bg-white/5 disabled:opacity-50"
            >
              {isFetchingNextPage ? "Carregando…" : "Carregar mais"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
