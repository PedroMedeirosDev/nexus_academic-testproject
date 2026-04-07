"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/shared/lib/supabaseClient";
import { useChamadoMutacoes } from "../hooks/useChamados";
import { useResponsaveis } from "../hooks/useResponsaveis";
import { useUnidades } from "../hooks/useUnidades";
import { chamadosService } from "../services/chamadosService";
import { anexosService } from "../services/comentariosService";
import { ComentariosSection } from "./ComentariosSection";
import { UploadArea } from "./UploadArea";
import { useToast } from "@/shared/components/ToastProvider";
type ChamadoForm = {
  id: number;
  unidadeId: number;
  assunto: string;
  descricao: string;
  situacao: string;
  prioridade: string;
  tipo: string;
  setor: string;
  solicitante: string;
  responsavel: string;
  unidade: string;
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

function criaNovo(): ChamadoForm {
  return {
    id: 0,
    unidadeId: 0,
    assunto: "",
    descricao: "",
    situacao: "Aberto",
    prioridade: "Normal",
    tipo: "Sistema",
    setor: "Secretaria",
    solicitante: "",
    responsavel: "",
    unidade: "",
  };
}

const selectCls =
  "w-full rounded-lg border border-white/10 bg-[#0b1020] px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500";

function fieldCls(erros: string[], campo: string) {
  return erros.includes(campo)
    ? "w-full rounded-lg border border-red-500 bg-red-500/10 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-red-500"
    : selectCls;
}

export function ChamadoFormPage({ id }: { id: number | null }) {
  const router = useRouter();
  const toast = useToast();
  const isNovo = id === null || id === 0;

  const { criar, atualizar } = useChamadoMutacoes();
  const { responsaveis, isLoading: carregandoResp } = useResponsaveis();
  const { unidades, isLoading: carregandoUnidades } = useUnidades();

  const [form, setForm] = useState<ChamadoForm>(criaNovo());
  const [carregando, setCarregando] = useState(!isNovo);
  const [erroCarga, setErroCarga] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [camposComErro, setCamposComErro] = useState<string[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [arquivosNovos, setArquivosNovos] = useState<File[]>([]);
  const [progressos, setProgressos] = useState<Record<number, number>>({});

  useEffect(() => {
    if (!isNovo) return;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const nome =
          user.user_metadata?.nome ??
          user.user_metadata?.full_name ??
          user.email ??
          "";
        setForm((f) => ({ ...f, solicitante: nome }));
      }
    });
  }, [isNovo]);

  useEffect(() => {
    if (isNovo) return;
    setCarregando(true);
    setErroCarga(null);
    chamadosService
      .obter(id!)
      .then((base) => {
        setForm({
          id: base.id,
          unidadeId: 0,
          assunto: base.assunto,
          descricao: base.descricao,
          situacao: base.situacao,
          prioridade: base.prioridade,
          tipo: base.tipo,
          setor: base.setor,
          solicitante: base.solicitante,
          responsavel: base.responsavel,
          unidade: base.unidade,
        });
      })
      .catch((e: Error) => setErroCarga(e.message))
      .finally(() => setCarregando(false));
  }, [id, isNovo]);

  function set(field: keyof ChamadoForm, value: string | number) {
    setErro(null);
    setCamposComErro((prev) => prev.filter((c) => c !== field));
    setForm((f) => ({ ...f, [field]: value }));
  }

  function falhar(campo: string, msg: string) {
    setErro(msg);
    setCamposComErro([campo]);
  }

  async function salvar() {
    if (!form.assunto.trim()) {
      falhar("assunto", "O campo Assunto é obrigatório.");
      return;
    }
    if (!form.solicitante.trim()) {
      falhar("solicitante", "O campo Solicitante é obrigatório.");
      return;
    }
    if (isNovo && form.unidadeId <= 0) {
      falhar("unidadeId", "Selecione uma Unidade.");
      return;
    }
    if (!form.responsavel.trim()) {
      falhar("responsavel", "O campo Responsável é obrigatório.");
      return;
    }
    if (!form.descricao.trim()) {
      falhar("descricao", "O campo Descrição é obrigatório.");
      return;
    }
    setSalvando(true);
    setErro(null);
    try {
      const req = {
        unidade_id: form.unidadeId,
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
        const criado = await criar.mutateAsync(req);
        if (arquivosNovos.length > 0) {
          for (let i = 0; i < arquivosNovos.length; i++) {
            await anexosService.upload(
              criado.id,
              null,
              arquivosNovos[i],
              (pct) => setProgressos((prev) => ({ ...prev, [i]: pct })),
            );
          }
        }
        toast.success("Chamado criado com sucesso!");
        router.replace(`/suporte/chamados/${criado.id}`);
      } else {
        await atualizar.mutateAsync({ id: form.id, req });
        toast.success("Chamado atualizado com sucesso!");
        router.push("/suporte/chamados");
      }
    } catch (e: unknown) {
      const msg = (e as Error).message ?? "Erro ao salvar chamado.";
      setErro(msg);
      toast.error(msg);
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
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
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

      <section className="rounded-2xl border border-white/10 bg-[#151b2d] p-5">
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Detalhes
        </p>

        {isNovo && (
          <div className="mb-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-zinc-400">
                Unidade *
              </label>
              <select
                value={form.unidadeId}
                onChange={(e) => set("unidadeId", Number(e.target.value))}
                disabled={carregandoUnidades}
                className={fieldCls(camposComErro, "unidadeId")}
              >
                <option value={0}>— Selecione a unidade —</option>
                {unidades.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nome} ({u.sigla})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">
                Solicitante
              </label>
              <p className="rounded-lg border border-white/10 bg-[#0b1020] px-3 py-2 text-sm text-zinc-300">
                {form.solicitante || (
                  <span className="text-zinc-600">Carregando…</span>
                )}
              </p>
            </div>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {!isNovo && (
            <div>
              <label className="mb-1 block text-xs text-zinc-400">
                Situação
              </label>
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
          )}
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
              Responsável *
            </label>
            <select
              value={form.responsavel}
              onChange={(e) => set("responsavel", e.target.value)}
              disabled={carregandoResp}
              className={fieldCls(camposComErro, "responsavel")}
            >
              <option value="">— Selecione o responsável —</option>
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
              className={fieldCls(camposComErro, "assunto")}
            />
          </div>
          <div className="sm:col-span-2">
            <div className="mb-1 flex items-center justify-between">
              <label className="text-xs text-zinc-400">Descrição *</label>
              <span className="text-xs text-zinc-600">
                {form.descricao.length}/2000
              </span>
            </div>
            <textarea
              rows={4}
              maxLength={2000}
              value={form.descricao}
              onChange={(e) => set("descricao", e.target.value)}
              placeholder="Descreva o problema ou solicitação com mais detalhes…"
              className={`${fieldCls(camposComErro, "descricao")} resize-none`}
            />
          </div>

          {isNovo && (
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-zinc-400">Anexos</label>
              {arquivosNovos.length > 0 && (
                <ul className="mb-2 space-y-1">
                  {arquivosNovos.map((f, i) => {
                    const pct = progressos[i];
                    const emProgresso =
                      salvando && pct !== undefined && pct < 100;
                    const concluido = salvando && pct === 100;
                    return (
                      <li
                        key={i}
                        className="overflow-hidden rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-300"
                      >
                        <div className="flex items-center justify-between">
                          <span className="truncate">{f.name}</span>
                          {!salvando && (
                            <button
                              type="button"
                              onClick={() =>
                                setArquivosNovos((prev) =>
                                  prev.filter((_, j) => j !== i),
                                )
                              }
                              className="ml-2 text-zinc-500 hover:text-red-400"
                            >
                              ✕
                            </button>
                          )}
                          {concluido && (
                            <span className="ml-2 text-emerald-400">✓</span>
                          )}
                          {emProgresso && (
                            <span className="ml-2 text-zinc-400">{pct}%</span>
                          )}
                        </div>
                        {salvando && pct !== undefined && (
                          <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/10">
                            <div
                              className={`h-full rounded-full transition-all duration-200 ${concluido ? "bg-emerald-500" : "bg-blue-500"}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
              <UploadArea
                onArquivos={(files) =>
                  setArquivosNovos((prev) => [...prev, ...files])
                }
                carregando={salvando}
              />
            </div>
          )}
        </div>
      </section>

      {!isNovo && <ComentariosSection chamadoId={form.id} />}
    </div>
  );
}
