"use client";

import { useState, useMemo } from "react";
import { useEventos } from "../hooks/useEventos";
import type { Evento } from "../services/calendarioService";

const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];
const DIAS_ABREV = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const DIAS_MINI = ["D", "S", "T", "Q", "Q", "S", "S"];

type Visao = "mes" | "ano";

function toStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Retorna 42 células Date (6 linhas × 7 colunas) para o mês fornecido. */
function buildGrid(ano: number, mes: number): Date[] {
  const primeiroDia = new Date(ano, mes, 1).getDay();
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();
  const cells: Date[] = [];
  for (let i = 0; i < primeiroDia; i++)
    cells.push(new Date(ano, mes, i - primeiroDia + 1));
  for (let i = 1; i <= diasNoMes; i++) cells.push(new Date(ano, mes, i));
  let next = 1;
  while (cells.length < 42) cells.push(new Date(ano, mes + 1, next++));
  return cells;
}

function novoEventoBase(data: string): Evento {
  return {
    id: "",
    titulo: "",
    descricao: "",
    data,
    horaInicio: "08:00",
    horaFim: "09:00",
    diaInteiro: false,
  };
}

const IcoPencil = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
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
    width="14"
    height="14"
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

const inputCls =
  "w-full rounded-lg border border-white/10 bg-[#0b1020] px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500";

// ─── Mini-calendário (visão anual) ──────────────────────────────────────────
function MiniMes({
  ano,
  mes,
  eventosDatas,
  hoje,
  onMes,
}: {
  ano: number;
  mes: number;
  eventosDatas: Set<string>;
  hoje: string;
  onMes: () => void;
}) {
  const grid = useMemo(() => buildGrid(ano, mes), [ano, mes]);
  return (
    <button
      type="button"
      onClick={onMes}
      className="w-full rounded-xl border border-white/10 bg-[#151b2d] p-3 text-left transition hover:border-blue-500/40 hover:bg-blue-900/10"
    >
      <p className="mb-2 text-center text-xs font-semibold capitalize text-zinc-300">
        {MESES[mes]}
      </p>
      <div className="grid grid-cols-7">
        {DIAS_MINI.map((d, i) => (
          <div key={i} className="py-0.5 text-center text-[9px] text-zinc-600">
            {d}
          </div>
        ))}
        {grid.map((cell, i) => {
          const str = toStr(cell);
          const isCur = cell.getMonth() === mes;
          const hasEv = isCur && eventosDatas.has(str);
          const isHoje = str === hoje;
          return (
            <div
              key={i}
              className={[
                "relative flex aspect-square items-center justify-center rounded-sm text-xs leading-none",
                !isCur
                  ? "text-zinc-700"
                  : isHoje
                    ? "rounded bg-blue-600 font-bold text-white"
                    : "text-zinc-400",
              ].join(" ")}
            >
              {cell.getDate()}
              {hasEv && !isHoje && (
                <span className="absolute bottom-0 left-1/2 h-0.75 w-0.75 -translate-x-1/2 rounded-full bg-blue-400" />
              )}
            </div>
          );
        })}
      </div>
    </button>
  );
}

// ─── Grade mensal ────────────────────────────────────────────────────────────
function GradeMes({
  ano,
  mes,
  grid,
  eventosPorData,
  diaSel,
  hoje,
  onDia,
  onDblDia,
}: {
  ano: number;
  mes: number;
  grid: Date[];
  eventosPorData: Map<string, Evento[]>;
  diaSel: string | null;
  hoje: string;
  onDia: (s: string) => void;
  onDblDia: (s: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#151b2d]">
      {/* Cabeçalho dias da semana */}
      <div className="grid grid-cols-7 border-b border-white/10 bg-white/5">
        {DIAS_ABREV.map((d) => (
          <div
            key={d}
            className="py-2 text-center text-xs font-medium uppercase text-zinc-500"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Células */}
      <div className="grid grid-cols-7 divide-x divide-y divide-white/6">
        {grid.map((cell, i) => {
          const str = toStr(cell);
          const isCur = cell.getMonth() === mes;
          const isHoje = str === hoje;
          const isSel = str === diaSel;
          const evs = isCur ? (eventosPorData.get(str) ?? []) : [];

          return (
            <div
              key={i}
              onClick={() => isCur && onDia(str)}
              onDoubleClick={() => isCur && onDblDia(str)}
              title={
                isCur
                  ? "Clique para selecionar · Duplo clique para novo evento"
                  : undefined
              }
              className={[
                "min-h-16 p-1.5 transition sm:min-h-24 sm:p-2",
                !isCur
                  ? "bg-white/2 text-zinc-700"
                  : "cursor-pointer hover:bg-white/5",
                isSel
                  ? "bg-blue-600/10 ring-1 ring-inset ring-blue-500/40"
                  : "",
              ].join(" ")}
            >
              <span
                className={[
                  "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium leading-none",
                  isHoje
                    ? "bg-blue-600 font-bold text-white"
                    : isCur
                      ? "text-zinc-200"
                      : "text-zinc-700",
                ].join(" ")}
              >
                {cell.getDate()}
              </span>

              {/* Mobile: pontos indicadores */}
              {evs.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-0.5 sm:hidden">
                  {evs.slice(0, 4).map((ev) => (
                    <span
                      key={ev.id}
                      className="h-1.5 w-1.5 rounded-full bg-blue-400"
                    />
                  ))}
                  {evs.length > 4 && (
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400 opacity-40" />
                  )}
                </div>
              )}

              {/* Desktop: chips de evento */}
              {evs.length > 0 && (
                <div className="mt-1 hidden space-y-px sm:block">
                  {evs.slice(0, 2).map((ev) => (
                    <div
                      key={ev.id}
                      className="truncate rounded bg-blue-600/25 px-1 py-px text-[10px] leading-4 text-blue-300"
                    >
                      {ev.titulo}
                    </div>
                  ))}
                  {evs.length > 2 && (
                    <div className="px-1 text-[10px] text-zinc-500">
                      +{evs.length - 2} mais
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Dica de uso */}
      <div className="border-t border-white/6 px-4 py-1.5 text-[11px] text-zinc-600">
        Clique para selecionar o dia · Duplo clique para criar novo evento
      </div>
    </div>
  );
}

export function CalendarioPage() {
  const hoje = useMemo(() => new Date(), []);
  const hojeStr = useMemo(() => toStr(hoje), [hoje]);

  const [mes, setMes] = useState(hoje.getMonth());
  const [ano, setAno] = useState(hoje.getFullYear());
  const [visao, setVisao] = useState<Visao>("mes");
  const [diaSel, setDiaSel] = useState<string | null>(null);
  const {
    eventos,
    criarAsync,
    atualizarAsync,
    excluir: excluirEvento,
    salvando,
  } = useEventos(mes, ano);
  const [formAberto, setFormAberto] = useState(false);
  const [form, setForm] = useState<Evento>(novoEventoBase(hojeStr));

  const isNovo = !form.id;

  const eventosPorData = useMemo(() => {
    const map = new Map<string, Evento[]>();
    for (const ev of eventos) {
      const arr = map.get(ev.data) ?? [];
      arr.push(ev);
      map.set(ev.data, arr);
    }
    return map;
  }, [eventos]);

  const grid = useMemo(() => buildGrid(ano, mes), [ano, mes]);
  const eventosDatasSet = useMemo(
    () => new Set(eventos.map((e) => e.data)),
    [eventos],
  );

  const eventosExibidos = useMemo(() => {
    const list = diaSel
      ? (eventosPorData.get(diaSel) ?? [])
      : eventos.filter((e) => {
          const d = new Date(e.data + "T00:00:00");
          return d.getMonth() === mes && d.getFullYear() === ano;
        });
    return [...list].sort(
      (a, b) =>
        a.data.localeCompare(b.data) ||
        a.horaInicio.localeCompare(b.horaInicio),
    );
  }, [eventos, eventosPorData, diaSel, mes, ano]);

  function irAnterior() {
    setDiaSel(null);
    if (visao === "ano") {
      setAno((a) => a - 1);
    } else {
      if (mes === 0) {
        setMes(11);
        setAno((a) => a - 1);
      } else setMes((m) => m - 1);
    }
  }

  function irProximo() {
    setDiaSel(null);
    if (visao === "ano") {
      setAno((a) => a + 1);
    } else {
      if (mes === 11) {
        setMes(0);
        setAno((a) => a + 1);
      } else setMes((m) => m + 1);
    }
  }

  function selecionarDia(ds: string) {
    setDiaSel((prev) => (prev === ds ? null : ds));
  }

  function abrirNovoNoDia(ds: string) {
    setForm(novoEventoBase(ds));
    setFormAberto(true);
  }

  function abrirNovo() {
    setForm(novoEventoBase(diaSel ?? hojeStr));
    setFormAberto(true);
  }

  function abrirEdicao(ev: Evento) {
    setForm({ ...ev });
    setFormAberto(true);
  }

  function cancelar() {
    setFormAberto(false);
  }

  async function salvar() {
    if (!form.titulo.trim() || !form.data) return;
    const req = {
      titulo: form.titulo,
      descricao: form.descricao,
      data: form.data,
      horaInicio: form.horaInicio,
      horaFim: form.horaFim,
      diaInteiro: form.diaInteiro,
    };
    try {
      if (isNovo) {
        await criarAsync(req);
      } else {
        await atualizarAsync({ id: form.id, req });
      }
      setFormAberto(false);
    } catch {
      // erro tratado pelo hook (React Query)
    }
  }

  function excluir(id: string) {
    excluirEvento(id);
  }

  function setF(field: keyof Evento, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  const labelDiaSel = diaSel
    ? (() => {
        const d = new Date(diaSel + "T00:00:00");
        return `${d.getDate()} de ${MESES[d.getMonth()].toLowerCase()} de ${d.getFullYear()}`;
      })()
    : null;

  const contagemLabel = labelDiaSel
    ? `${eventosExibidos.length} evento${eventosExibidos.length !== 1 ? "s" : ""} em ${labelDiaSel}`
    : `${eventosExibidos.length} evento${eventosExibidos.length !== 1 ? "s" : ""} em ${MESES[mes].toLowerCase()} de ${ano}`;
  return (
    <div className="space-y-6">
      {/* Cabeçalho da página */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-zinc-400">Gerencie eventos e compromissos</p>
        <button
          type="button"
          onClick={abrirNovo}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
        >
          + Novo Evento
        </button>
      </div>

      {/* Navegação + alternância de visão */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={irAnterior}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-zinc-300 hover:bg-white/5"
          >
            ‹ Anterior
          </button>
          <span className="min-w-40 text-center text-lg font-semibold capitalize">
            {visao === "mes" ? `${MESES[mes]} ${ano}` : String(ano)}
          </span>
          <button
            type="button"
            onClick={irProximo}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-zinc-300 hover:bg-white/5"
          >
            Próximo ›
          </button>
        </div>

        {/* Toggle Mês / Ano */}
        <div className="flex overflow-hidden rounded-lg border border-white/10">
          <button
            type="button"
            onClick={() => setVisao("mes")}
            className={`px-4 py-1.5 text-sm font-medium transition ${
              visao === "mes"
                ? "bg-blue-600 text-white"
                : "text-zinc-400 hover:bg-white/5"
            }`}
          >
            Mês
          </button>
          <button
            type="button"
            onClick={() => setVisao("ano")}
            className={`px-4 py-1.5 text-sm font-medium transition ${
              visao === "ano"
                ? "bg-blue-600 text-white"
                : "text-zinc-400 hover:bg-white/5"
            }`}
          >
            Ano
          </button>
        </div>
      </div>

      {/* Formulário inline */}
      {formAberto && (
        <div className="rounded-2xl border border-blue-500/30 bg-[#151b2d] p-5">
          <h2 className="mb-4 text-base font-semibold">
            {isNovo ? "Novo Evento" : "Editar Evento"}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-zinc-400">
                Título *
              </label>
              <input
                autoFocus
                type="text"
                maxLength={255}
                value={form.titulo}
                onChange={(e) => setF("titulo", e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Data *</label>
              <input
                type="date"
                value={form.data}
                onChange={(e) => setF("data", e.target.value)}
                className={inputCls}
              />
            </div>
            <div className="flex items-center gap-2 pt-5">
              <input
                id="diaInteiro"
                type="checkbox"
                checked={form.diaInteiro}
                onChange={(e) => setF("diaInteiro", e.target.checked)}
                className="h-4 w-4 rounded accent-blue-500"
              />
              <label htmlFor="diaInteiro" className="text-sm text-zinc-300">
                Dia inteiro
              </label>
            </div>
            {!form.diaInteiro && (
              <>
                <div>
                  <label className="mb-1 block text-xs text-zinc-400">
                    Hora início
                  </label>
                  <input
                    type="time"
                    value={form.horaInicio}
                    onChange={(e) => setF("horaInicio", e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-zinc-400">
                    Hora fim
                  </label>
                  <input
                    type="time"
                    value={form.horaFim}
                    onChange={(e) => setF("horaFim", e.target.value)}
                    className={inputCls}
                  />
                </div>
              </>
            )}
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-zinc-400">
                Descrição
              </label>
              <textarea
                rows={3}
                maxLength={1000}
                value={form.descricao}
                onChange={(e) => setF("descricao", e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={salvar}
              disabled={salvando || !form.titulo.trim() || !form.data}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
            >
              {salvando ? "Salvando…" : "Salvar"}
            </button>
            <button
              type="button"
              onClick={cancelar}
              className="rounded-lg border border-white/10 px-5 py-2 text-sm font-semibold text-zinc-300 hover:bg-white/5"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Grade visual do calendário */}
      {visao === "mes" ? (
        <GradeMes
          ano={ano}
          mes={mes}
          grid={grid}
          eventosPorData={eventosPorData}
          diaSel={diaSel}
          hoje={hojeStr}
          onDia={selecionarDia}
          onDblDia={abrirNovoNoDia}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 12 }, (_, i) => (
            <MiniMes
              key={i}
              ano={ano}
              mes={i}
              eventosDatas={eventosDatasSet}
              hoje={hojeStr}
              onMes={() => {
                setMes(i);
                setVisao("mes");
                setDiaSel(null);
              }}
            />
          ))}
        </div>
      )}

      {/* Lista de eventos */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#151b2d]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-5 py-4">
          <h2 className="font-semibold">{contagemLabel}</h2>
          {diaSel && (
            <button
              type="button"
              onClick={() => setDiaSel(null)}
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              Ver mês inteiro
            </button>
          )}
        </div>

        {eventosExibidos.length === 0 ? (
          <div className="py-14 text-center text-zinc-500">
            {diaSel ? "Nenhum evento neste dia." : "Nenhum evento neste mês."}
          </div>
        ) : (
          <ul>
            {eventosExibidos.map((ev, i) => {
              const d = new Date(ev.data + "T00:00:00");
              return (
                <li
                  key={ev.id}
                  onDoubleClick={() => abrirEdicao(ev)}
                  title="Duplo clique para editar"
                  className={`flex cursor-pointer items-start gap-4 px-5 py-4 transition hover:bg-white/5 ${
                    i > 0 ? "border-t border-white/5" : ""
                  }`}
                >
                  {/* Bloco de data */}
                  <div className="flex w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-blue-600/20 py-2 text-center">
                    <span className="text-2xl font-black leading-none text-blue-300">
                      {d.getDate()}
                    </span>
                    <span className="text-[10px] uppercase text-blue-400">
                      {DIAS_ABREV[d.getDay()]}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <p className="font-medium text-zinc-100">{ev.titulo}</p>
                    <p className="mt-0.5 text-xs text-zinc-400">
                      {ev.diaInteiro
                        ? "Dia inteiro"
                        : `${ev.horaInicio}${ev.horaFim ? ` – ${ev.horaFim}` : ""}`}
                    </p>
                    {ev.descricao && (
                      <p className="mt-1 text-sm text-zinc-400">
                        {ev.descricao}
                      </p>
                    )}
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-2 pt-0.5">
                    <button
                      type="button"
                      title="Editar"
                      onClick={(e) => {
                        e.stopPropagation();
                        abrirEdicao(ev);
                      }}
                      className="text-zinc-400 hover:text-zinc-100"
                    >
                      <IcoPencil />
                    </button>
                    <button
                      type="button"
                      title="Excluir"
                      onClick={(e) => {
                        e.stopPropagation();
                        excluir(ev.id);
                      }}
                      className="text-zinc-400 hover:text-red-400"
                    >
                      <IcoTrash />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {eventosExibidos.length > 0 && (
          <div className="border-t border-white/6 px-5 py-2 text-[11px] text-zinc-600">
            Duplo clique em um evento para editar
          </div>
        )}
      </div>
    </div>
  );
}
