"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useChamadosDashboard } from "../hooks/useChamadosDashboard";

const DIAS_SEMANA = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

// Placeholder — futuramente virá do backend com os eventos do aluno autenticado
const eventosHoje: { hora: string; titulo: string }[] = [];

export function DashboardPage() {
  const router = useRouter();
  const hoje = useMemo(() => new Date(), []);
  const diaSemana = DIAS_SEMANA[hoje.getDay()];
  const diaMes = hoje.getDate();
  const mes = MESES[hoje.getMonth()];
  const ano = hoje.getFullYear();

  const { chamados, isLoading: carregandoChamados } = useChamadosDashboard();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-400">
          {diaSemana}, {diaMes} de {mes} de {ano}
        </p>
      </div>

      {/* Cards de métricas */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-white/10 bg-[#151b2d] p-5">
          <p className="text-sm text-zinc-400">Alunos Ativos</p>
          <p className="mt-1 text-4xl font-bold leading-none text-zinc-600">
            —
          </p>
          <p className="mt-3 text-sm text-zinc-600">em breve</p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-[#151b2d] p-5">
          <p className="text-sm text-zinc-400">Chamados Abertos</p>
          <p className="mt-1 text-4xl font-bold leading-none">
            {carregandoChamados ? (
              <span className="inline-block h-9 w-10 animate-pulse rounded bg-white/10" />
            ) : (
              chamados.filter((c) => c.situacao === "Aberto").length
            )}
          </p>
          <p className="mt-3 text-sm text-zinc-500">últimos registros</p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-[#151b2d] p-5">
          <p className="text-sm text-zinc-400">Mensalidades Pendentes</p>
          <p className="mt-1 text-4xl font-bold leading-none text-zinc-600">
            —
          </p>
          <p className="mt-3 text-sm text-zinc-600">em breve</p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-[#151b2d] p-5">
          <p className="text-sm text-zinc-400">Avisos Ativos</p>
          <p className="mt-1 text-4xl font-bold leading-none text-zinc-600">
            —
          </p>
          <p className="mt-3 text-sm text-zinc-600">em breve</p>
        </article>
      </section>

      {/* Conteúdo principal */}
      <section className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        {/* Chamados Recentes */}
        <article className="overflow-hidden rounded-2xl border border-white/10 bg-[#151b2d]">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <h2 className="text-xl font-semibold">Chamados Recentes</h2>
            <button
              type="button"
              onClick={() => router.push("/suporte/chamados")}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              Ver todos
            </button>
          </div>
          <div className="overflow-x-auto">
            {carregandoChamados ? (
              <div className="space-y-px">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-4 px-4 py-3 animate-pulse">
                    <div className="h-3 w-12 rounded bg-white/8" />
                    <div className="h-3 flex-1 rounded bg-white/8" />
                    <div className="h-3 w-20 rounded bg-white/8" />
                  </div>
                ))}
              </div>
            ) : chamados.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-zinc-500">
                Nenhum chamado registrado.
              </p>
            ) : (
              <table className="w-full min-w-180 text-left text-sm">
                <thead className="bg-white/5 text-zinc-400">
                  <tr>
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Assunto</th>
                    <th className="px-4 py-3">Solicitante</th>
                    <th className="px-4 py-3">Unidade</th>
                    <th className="px-4 py-3">Prioridade</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {chamados.map((row) => (
                    <tr
                      key={row.id}
                      className="border-t border-white/5 text-zinc-200 cursor-pointer hover:bg-white/5"
                      onDoubleClick={() =>
                        router.push(`/suporte/chamados/${row.id}`)
                      }
                    >
                      <td className="px-4 py-3 text-zinc-400">{row.id}</td>
                      <td className="px-4 py-3 font-medium">{row.assunto}</td>
                      <td className="px-4 py-3 text-zinc-400">
                        {row.solicitante}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded bg-blue-600 px-2 py-1 text-xs font-semibold">
                          {row.unidade}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded px-2 py-0.5 text-xs font-semibold ${
                            row.prioridade === "Urgente"
                              ? "bg-red-500/20 text-red-300"
                              : row.prioridade === "Alta"
                                ? "bg-orange-500/20 text-orange-300"
                                : row.prioridade === "Normal"
                                  ? "bg-blue-500/20 text-blue-300"
                                  : "bg-zinc-500/20 text-zinc-400"
                          }`}
                        >
                          {row.prioridade}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded px-2 py-0.5 text-xs font-semibold ${
                            row.situacao === "Aberto"
                              ? "bg-red-500/20 text-red-300"
                              : row.situacao === "Em andamento"
                                ? "bg-amber-500/20 text-amber-300"
                                : "bg-emerald-500/20 text-emerald-300"
                          }`}
                        >
                          {row.situacao}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </article>

        {/* Coluna direita: Calendário + Ações Rápidas */}
        <div className="flex flex-col gap-4">
          {/* Widget de Calendário — duplo clique abre o calendário */}
          <article
            className="cursor-pointer rounded-2xl border border-white/10 bg-[#151b2d] p-5 transition hover:border-blue-500/30"
            onDoubleClick={() => router.push("/calendario")}
            title="Duplo clique para abrir o calendário"
          >
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center justify-center rounded-xl bg-blue-600/20 px-4 py-3 text-center">
                <span className="text-5xl font-black leading-none text-blue-300">
                  {diaMes}
                </span>
                <span className="mt-1 text-xs uppercase tracking-wider text-blue-400">
                  {diaSemana.split("-")[0]}
                </span>
              </div>
              <div>
                <p className="text-base font-semibold capitalize">
                  {mes} de {ano}
                </p>
                {eventosHoje.length > 0 ? (
                  <p className="mt-0.5 text-xs text-zinc-400">
                    {eventosHoje.length} evento
                    {eventosHoje.length > 1 ? "s" : ""} hoje
                  </p>
                ) : (
                  <p className="mt-0.5 text-xs text-zinc-400">
                    Nenhum evento hoje
                  </p>
                )}
              </div>
            </div>

            {eventosHoje.length > 0 && (
              <ul className="mt-4 space-y-2 border-t border-white/10 pt-4">
                {eventosHoje.map((ev) => (
                  <li
                    key={ev.hora}
                    className="flex cursor-pointer items-center gap-2 text-sm transition hover:bg-white/5 rounded px-1 -mx-1"
                    onDoubleClick={() => router.push("/calendario")}
                    title="Duplo clique para editar"
                  >
                    <span className="min-w-11 rounded bg-blue-500/20 px-1.5 py-0.5 text-center text-xs font-medium text-blue-300">
                      {ev.hora}
                    </span>
                    <span className="text-zinc-300">{ev.titulo}</span>
                  </li>
                ))}
              </ul>
            )}
          </article>

          {/* Ações Rápidas */}
          <article className="rounded-2xl border border-white/10 bg-[#151b2d] p-5">
            <h2 className="text-xl font-semibold">Ações Rápidas</h2>
            <div className="mt-4 space-y-3">
              <button
                type="button"
                onClick={() => router.push("/suporte/chamados/novo")}
                className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left hover:bg-white/10"
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-blue-500/20 text-blue-300">
                  +
                </span>
                <span className="font-medium">Novo Chamado</span>
              </button>
              <button
                type="button"
                onClick={() => router.push("/academico/ficha/novo")}
                className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left hover:bg-white/10"
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-emerald-500/20 text-emerald-300">
                  ⍟
                </span>
                <span className="font-medium">Cadastrar Aluno</span>
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left hover:bg-white/10"
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-amber-500/20 text-amber-300">
                  ≡
                </span>
                <span className="font-medium">Emitir Relatório</span>
              </button>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
