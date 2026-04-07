"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useChamados } from "../hooks/useChamados";
import { useToast } from "@/shared/components/ToastProvider";
import type { Chamado } from "../services/chamadosService";

const prioridadeCor: Record<string, string> = {
  Urgente: "border border-red-500/40 bg-red-500/20 text-red-300",
  Alta: "border border-orange-500/40 bg-orange-500/20 text-orange-300",
  Normal: "border border-blue-500/40 bg-blue-500/20 text-blue-300",
  Baixa: "border border-zinc-500/40 bg-zinc-500/20 text-zinc-300",
};

const situacaoCor: Record<string, string> = {
  Aberto: "border border-red-500/40 bg-red-500/20 text-red-300",
  "Em andamento": "border border-blue-500/40 bg-blue-500/20 text-blue-300",
  Resolvido: "border border-emerald-500/40 bg-emerald-500/20 text-emerald-300",
  Fechado: "border border-zinc-500/40 bg-zinc-500/20 text-zinc-400",
};

const IcoPencil = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const IcoTrash = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

export function ChamadosPage() {
  const router = useRouter();
  const toast = useToast();
  const [filtros, setFiltros] = useState({
    num: "",
    assunto: "",
    solicitante: "",
    responsavel: "",
  });
  const [filtrosAtivos, setFiltrosAtivos] = useState({ ...filtros });

  const {
    items,
    count,
    isLoading,
    isError,
    error,
    isFetchingNextPage,
    hasNextPage,
    carregarMais,
    excluir,
    excluindo,
  } = useChamados(filtrosAtivos);

  const [excluirId, setExcluirId] = useState<number | null>(null);

  function procurar() {
    setFiltrosAtivos({ ...filtros });
  }
  function limpar() {
    const v = { num: "", assunto: "", solicitante: "", responsavel: "" };
    setFiltros(v);
    setFiltrosAtivos(v);
  }

  const inputCls =
    "w-full rounded-lg border border-white/10 bg-[#0b1020] px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500";

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => router.push("/suporte/chamados/novo")}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
        >
          + Nova Solicitação
        </button>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#151b2d] p-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Nº Solicitação", key: "num", max: 20 },
            { label: "Assunto", key: "assunto", max: 500 },
            { label: "Solicitante", key: "solicitante", max: 255 },
            { label: "Responsável", key: "responsavel", max: 255 },
          ].map(({ label, key, max }) => (
            <div key={key}>
              <label className="mb-1 block text-xs text-zinc-400">
                {label}
              </label>
              <input
                type="text"
                placeholder={label}
                maxLength={max}
                value={filtros[key as keyof typeof filtros]}
                onChange={(e) =>
                  setFiltros((f) => ({ ...f, [key]: e.target.value }))
                }
                onKeyDown={(e) => e.key === "Enter" && procurar()}
                className={inputCls}
              />
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={procurar}
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-500"
          >
            Procurar
          </button>
          <button
            type="button"
            onClick={limpar}
            className="rounded-lg border border-white/10 px-5 py-2 text-sm font-semibold text-zinc-300 hover:bg-white/5"
          >
            Limpar
          </button>
        </div>
      </div>

      {isError && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          Erro ao carregar chamados:{" "}
          {(error as Error)?.message ?? "tente novamente"}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#151b2d]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-left text-sm">
            <thead className="border-b border-white/10 text-xs font-semibold text-zinc-400">
              <tr>
                {[
                  "Nº",
                  "Prioridade",
                  "Situação",
                  "Assunto",
                  "Solicitante",
                  "Responsável",
                  "Data/Hora",
                  "Unid.",
                  "Ações",
                ].map((h) => (
                  <th key={h} className="px-4 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`skel-${i}`} className="border-t border-white/5">
                    <td className="px-4 py-3">
                      <div className="h-4 w-8 animate-pulse rounded bg-white/10" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-5 w-16 animate-pulse rounded-full bg-white/10" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-5 w-20 animate-pulse rounded-full bg-white/10" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-52 animate-pulse rounded bg-white/10" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-24 animate-pulse rounded bg-white/10" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-24 animate-pulse rounded bg-white/10" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-28 animate-pulse rounded bg-white/10" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-5 w-12 animate-pulse rounded bg-white/10" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-6 w-14 animate-pulse rounded bg-white/10" />
                    </td>
                  </tr>
                ))}
              {!isLoading && items.length === 0 && !isError && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-10 text-center text-zinc-500"
                  >
                    Nenhum chamado encontrado.
                  </td>
                </tr>
              )}
              {items.map((c: Chamado) => (
                <>
                  <tr
                    key={c.id}
                    className="border-t border-white/5 hover:bg-white/5"
                  >
                    <td className="px-4 py-3 font-semibold text-zinc-200">
                      {c.id}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${prioridadeCor[c.prioridade] ?? ""}`}
                      >
                        {c.prioridade}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${situacaoCor[c.situacao] ?? ""}`}
                      >
                        {c.situacao}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-200">{c.assunto}</td>
                    <td className="px-4 py-3 text-zinc-400">{c.solicitante}</td>
                    <td className="px-4 py-3 text-zinc-400">
                      {c.responsavel || "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-400">{c.dataHora}</td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-blue-600 px-2 py-0.5 text-xs font-semibold">
                        {c.unidade}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          title="Editar"
                          onClick={() =>
                            router.push(`/suporte/chamados/${c.id}`)
                          }
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-white/10 hover:text-zinc-100"
                        >
                          <IcoPencil />
                        </button>
                        <button
                          type="button"
                          title="Excluir"
                          disabled={excluindo}
                          onClick={() => setExcluirId(c.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-red-500/20 hover:text-red-400 disabled:opacity-40"
                        >
                          <IcoTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr
                    key={`${c.id}-det`}
                    className="border-t border-white/[0.03] bg-white/[0.015]"
                  >
                    <td colSpan={9} className="px-4 py-1.5 text-xs">
                      <span className="font-medium text-zinc-400">Tipo</span>{" "}
                      <span className="text-zinc-300">{c.tipo}</span>
                      <span className="mx-4 text-zinc-700">|</span>
                      <span className="font-medium text-zinc-400">
                        Departamento
                      </span>{" "}
                      <span className="text-zinc-300">{c.setor}</span>
                    </td>
                  </tr>
                </>
              ))}
            </tbody>
          </table>
        </div>

        {hasNextPage && (
          <div className="border-t border-white/10 p-4 text-center">
            <button
              type="button"
              onClick={() => carregarMais()}
              disabled={isFetchingNextPage}
              className="rounded-lg border border-white/10 px-5 py-2 text-sm text-zinc-300 hover:bg-white/5 disabled:opacity-50"
            >
              {isFetchingNextPage
                ? "Carregando…"
                : `Carregar mais (${count - items.length} restantes)`}
            </button>
          </div>
        )}
      </div>
      {excluirId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#151b2d] p-6 shadow-xl">
            <h3 className="mb-2 text-base font-semibold text-zinc-100">
              Confirmar exclusão
            </h3>
            <p className="mb-6 text-sm text-zinc-400">
              Tem certeza que deseja excluir o chamado{" "}
              <span className="font-semibold text-zinc-200">#{excluirId}</span>?
              Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setExcluirId(null)}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={excluindo}
                onClick={() =>
                  excluir(excluirId, {
                    onSuccess: () => {
                      toast.success("Chamado excluído.");
                      setExcluirId(null);
                    },
                    onError: () => {
                      toast.error("Erro ao excluir chamado.");
                      setExcluirId(null);
                    },
                  })
                }
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50"
              >
                {excluindo ? "Excluindo…" : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
