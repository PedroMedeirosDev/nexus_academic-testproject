"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useChamadoMutacoes } from "../hooks/useChamados";
import { useResponsaveis } from "../hooks/useResponsaveis";
import { chamadosService } from "../services/chamadosService";
import type { HistoricoItem } from "../services/chamadosService";

type ChamadoDetalhe = {
  id: number;
  assunto: string;
  descricao: string;
  situacao: string;
  prioridade: string;
  tipo: string;
  setor: string;
  solicitante: string;
  responsavel: string;
  unidade: string;
  historico: HistoricoItem[];
};

const SITUACOES = ["Aberto", "Em andamento", "Resolvido", "Fechado"];
const PRIORIDADES = ["Urgente", "Alta", "Normal", "Baixa"];
const TIPOS = [
  "Sistema",
  "Acesso",
  "Financeiro",
  "Relatório",
  "Infraestrutura",
  "Cadastro",
  "Outro",
];
const SETORES = [
  "Secretaria",
  "TI",
  "Financeiro",
  "Pedagógico",
  "Diretoria",
  "RH",
  "Outro",
];

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

function criaNovo(): ChamadoDetalhe {
  return {
    id: 0,
    assunto: "",
    descricao: "",
    situacao: "Aberto",
    prioridade: "Normal",
    tipo: "Sistema",
    setor: "Secretaria",
    solicitante: "",
    responsavel: "",
    unidade: "",
    historico: [],
  };
}

const selectCls =
  "w-full rounded-lg border border-white/10 bg-[#0b1020] px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500";

export function ChamadoFormPage({ id }: { id: number | null }) {
  const router = useRouter();
  const isNovo = id === null || id === 0;

  const { criar, atualizar } = useChamadoMutacoes();
  const { responsaveis, isLoading: carregandoResp } = useResponsaveis();

  const [form, setForm] = useState<ChamadoDetalhe>(criaNovo());
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [carregando, setCarregando] = useState(!isNovo);
  const [erroCarga, setErroCarga] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  // Carrega chamado existente e seu histórico
  useEffect(() => {
    if (isNovo) return;
    setCarregando(true);
    setErroCarga(null);
    Promise.all([
      chamadosService.listar({ num: String(id), limit: 1, offset: 0 }),
      chamadosService.listarHistorico(id),
    ])
      .then(([lista, hist]) => {
        const base = lista.items.find((c) => c.id === id);
        if (!base) {
          setErroCarga("Chamado não encontrado.");
          return;
        }
        setForm({
          id: base.id,
          assunto: base.assunto,
          descricao: base.descricao,
          situacao: base.situacao,
          prioridade: base.prioridade,
          tipo: base.tipo,
          setor: base.setor,
          solicitante: base.solicitante,
          responsavel: base.responsavel,
          unidade: base.unidade,
          historico: [],
        });
        setHistorico(hist.items);
      })
      .catch((e: Error) => setErroCarga(e.message))
      .finally(() => setCarregando(false));
  }, [id, isNovo]);

  function set(field: keyof ChamadoDetalhe, value: string) {
    setErro(null);
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function salvar() {
    if (!form.assunto.trim()) {
      setErro("O campo Assunto é obrigatório.");
      return;
    }
    if (!form.solicitante.trim()) {
      setErro("O campo Solicitante é obrigatório.");
      return;
    }
    setSalvando(true);
    setErro(null);
    try {
      const req = {
        assunto: form.assunto,
        descricao: form.descricao,
        situacao: form.situacao,
        prioridade: form.prioridade,
        tipo: form.tipo,
        setor: form.setor,
        solicitante: form.solicitante,
        responsavel: form.responsavel,
      };
      if (isNovo) {
        await criar.mutateAsync(req);
      } else {
        await atualizar.mutateAsync({ id: form.id, req });
      }
      router.push("/suporte/chamados");
    } catch (e: unknown) {
      setErro((e as Error).message ?? "Erro ao salvar chamado.");
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return <div className="py-20 text-center text-zinc-500">Carregando…</div>;
  }

  if (erroCarga) {
    return (
      <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
        {erroCarga}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold">
            {isNovo ? "Novo Chamado" : `Chamado #${form.id}`}
          </h1>
          {!isNovo && (
            <>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${situacaoCor[form.situacao] ?? ""}`}
              >
                {form.situacao}
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${prioridadeCor[form.prioridade] ?? ""}`}
              >
                {form.prioridade}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isNovo && (
            <button
              type="button"
              className="rounded-lg border border-white/10 px-3 py-2 text-xs text-zinc-300 hover:bg-white/5"
            >
              ↓ JSON
            </button>
          )}
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-white/10 px-3 py-2 text-xs text-zinc-300 hover:bg-white/5"
          >
            ← Voltar
          </button>
          <button
            type="button"
            onClick={salvar}
            disabled={salvando}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {salvando ? "Salvando…" : "Salvar Alterações"}
          </button>
        </div>
      </div>

      {erro && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {erro}
        </div>
      )}

      {/* Informações (só em edição) */}
      {!isNovo && (
        <section className="rounded-2xl border border-white/10 bg-[#151b2d] p-5">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-500">
            Informações
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-zinc-500">Nº Solicitação</p>
              <p className="mt-1 font-semibold text-zinc-100">{form.id}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Unidade</p>
              <p className="mt-1 font-semibold text-zinc-100">{form.unidade}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Solicitante</p>
              <p className="mt-1 font-semibold text-zinc-100">
                {form.solicitante}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Detalhes */}
      <section className="rounded-2xl border border-white/10 bg-[#151b2d] p-5">
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Detalhes
        </p>

        {isNovo && (
          <div className="mb-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-zinc-400">
                Unidade
              </label>
              <input
                type="text"
                maxLength={100}
                value={form.unidade}
                onChange={(e) => set("unidade", e.target.value)}
                className={selectCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">
                Solicitante
              </label>
              <input
                type="text"
                maxLength={255}
                value={form.solicitante}
                onChange={(e) => set("solicitante", e.target.value)}
                className={selectCls}
              />
            </div>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-zinc-400">Situação</label>
            <select
              value={form.situacao}
              onChange={(e) => set("situacao", e.target.value)}
              className={selectCls}
            >
              {SITUACOES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-400">
              Prioridade
            </label>
            <select
              value={form.prioridade}
              onChange={(e) => set("prioridade", e.target.value)}
              className={selectCls}
            >
              {PRIORIDADES.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-400">Tipo</label>
            <select
              value={form.tipo}
              onChange={(e) => set("tipo", e.target.value)}
              className={selectCls}
            >
              {TIPOS.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-400">Setor</label>
            <select
              value={form.setor}
              onChange={(e) => set("setor", e.target.value)}
              className={selectCls}
            >
              {SETORES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs text-zinc-400">
              Responsável
            </label>
            <select
              value={form.responsavel}
              onChange={(e) => set("responsavel", e.target.value)}
              disabled={carregandoResp}
              className={selectCls}
            >
              <option value="">— Sem responsável —</option>
              {responsaveis.map((r) => (
                <option key={r.id} value={r.nome}>
                  {r.nome}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs text-zinc-400">
              Assunto *
            </label>
            <input
              type="text"
              maxLength={500}
              value={form.assunto}
              onChange={(e) => set("assunto", e.target.value)}
              className={selectCls}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs text-zinc-400">
              Descrição
            </label>
            <textarea
              rows={4}
              maxLength={2000}
              value={form.descricao}
              onChange={(e) => set("descricao", e.target.value)}
              placeholder="Descreva o problema ou solicitação com mais detalhes…"
              className={`${selectCls} resize-none`}
            />
          </div>
        </div>
      </section>

      {/* Histórico */}
      {!isNovo && historico.length > 0 && (
        <section className="rounded-2xl border border-white/10 bg-[#151b2d] p-5">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-500">
            Histórico
          </p>
          <ul className="space-y-4">
            {historico.map((h, i) => (
              <li
                key={h.id}
                className={`${i > 0 ? "border-t border-white/5 pt-4" : ""}`}
              >
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-semibold text-zinc-200">
                    {h.autor}
                  </span>
                  <span className="text-xs text-zinc-500">{h.data}</span>
                </div>
                <p className="mt-1 text-sm text-zinc-400">{h.mensagem}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
