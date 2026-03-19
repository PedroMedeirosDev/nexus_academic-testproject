"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Users,
  GraduationCap,
  Wallet,
  Settings,
  ChevronDown,
  ChevronRight,
  Calendar,
  BookOpen,
  ClipboardList,
  ArrowLeft,
} from "lucide-react";
import { useQueryMestre } from "@/shared/hooks/useQueryMestre";
import { alunosService, type Aluno } from "../services/alunosService";

// ─── Types ────────────────────────────────────────────────────────────────────

type SubSecao = { id: string; label: string };
type Secao = {
  id: string;
  label: string;
  icon: React.ReactNode;
  subs: SubSecao[];
};

// ─── Constants ────────────────────────────────────────────────────────────────

const SECOES: Secao[] = [
  {
    id: "perfil",
    label: "Perfil",
    icon: <User size={14} />,
    subs: [
      { id: "dados", label: "Dados" },
      { id: "saude", label: "Saúde" },
      { id: "usuario", label: "Usuário" },
    ],
  },
  {
    id: "contatos",
    label: "Contatos",
    icon: <Users size={14} />,
    subs: [
      { id: "pais", label: "Pais" },
      { id: "familia", label: "Família" },
    ],
  },
  {
    id: "academico",
    label: "Acadêmico",
    icon: <GraduationCap size={14} />,
    subs: [
      { id: "matricula", label: "Matrícula" },
      { id: "disciplinas", label: "Disciplinas" },
      { id: "notas", label: "Notas" },
    ],
  },
  {
    id: "financeiro",
    label: "Financeiro",
    icon: <Wallet size={14} />,
    subs: [
      { id: "tesouraria", label: "Tesouraria" },
      { id: "faturas", label: "Faturas" },
    ],
  },
  {
    id: "sistema",
    label: "Sistema",
    icon: <Settings size={14} />,
    subs: [
      { id: "auditoria", label: "Auditoria" },
      { id: "comunicacao", label: "Comunicação" },
    ],
  },
];

// ─── Sub-componentes ──────────────────────────────────────────────────────────

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

type InfoItemProps = { label: string; value: string };

function InfoItem({ label, value }: InfoItemProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="text-xs text-zinc-500">{label}</span>
      <span className="text-xs font-medium text-zinc-200">{value}</span>
    </div>
  );
}

type SidebarSecaoProps = {
  secao: Secao;
  expandida: boolean;
  subAtiva: string;
  onToggle: () => void;
  onSubClick: (subId: string) => void;
};

function SidebarSecao({
  secao,
  expandida,
  subAtiva,
  onToggle,
  onSubClick,
}: SidebarSecaoProps) {
  const temSubAtiva = secao.subs.some((s) => s.id === subAtiva);

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
          temSubAtiva
            ? "bg-blue-600/20 text-blue-300"
            : "text-zinc-300 hover:bg-white/5 hover:text-zinc-100"
        }`}
      >
        <span className="flex items-center gap-2.5">
          {secao.icon}
          {secao.label}
        </span>
        {expandida ? (
          <ChevronDown size={12} className="shrink-0 text-zinc-500" />
        ) : (
          <ChevronRight size={12} className="shrink-0 text-zinc-500" />
        )}
      </button>

      {expandida && (
        <div className="ml-3 mt-0.5 border-l border-white/8 pl-3">
          {secao.subs.map((sub) => (
            <button
              key={sub.id}
              type="button"
              onClick={() => onSubClick(sub.id)}
              className={`mb-0.5 flex w-full items-center rounded-md px-2.5 py-1.5 text-xs transition-colors ${
                subAtiva === sub.id
                  ? "bg-blue-600/15 font-semibold text-blue-300"
                  : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
              }`}
            >
              {sub.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Conteúdo: Acadêmico / Matrícula ─────────────────────────────────────────

function ConteudoMatricula() {
  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <h2 className="text-xl font-semibold text-zinc-100">
          Histórico Acadêmico e Matrículas
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Situação atual e histórico de vínculos acadêmicos da aluna.
        </p>
      </div>

      {/* Matrícula Atual */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <h3 className="text-sm font-semibold text-zinc-300">
            Matrícula Atual
          </h3>
          <span className="h-px flex-1 bg-white/8" />
          <span className="text-xs text-zinc-600">2026</span>
        </div>

        <div className="rounded-xl border border-white/8 bg-[#121827] p-5 shadow-sm">
          {/* Destaque curso */}
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600/20">
              <GraduationCap size={18} className="text-blue-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-zinc-100">
                Educação Infantil
              </p>
              <p className="text-xs text-zinc-500">Grade: 2026-EI</p>
            </div>
            <div className="ml-auto shrink-0">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Ativo
              </span>
            </div>
          </div>

          <div className="mb-4 border-t border-white/6" />

          {/* Grid de dados */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                Período
              </p>
              <p className="mt-1 text-sm font-medium text-zinc-200">
                1º Período
              </p>
              <p className="text-xs text-zinc-500">1PEIA</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                Turno
              </p>
              <p className="mt-1 text-sm font-medium text-zinc-200">Tarde</p>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                Data da Matrícula
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-zinc-200">
                <Calendar size={12} className="shrink-0 text-zinc-500" />
                13/10/2025
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Nova Matrícula */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <h3 className="text-sm font-semibold text-zinc-300">
            Nova Matrícula
          </h3>
          <span className="h-px flex-1 bg-white/8" />
        </div>

        <div className="rounded-xl border border-white/8 bg-[#121827] p-5 shadow-sm">
          <p className="mb-5 text-xs text-zinc-500">
            Preencha os dados abaixo para realizar uma nova matrícula para o
            próximo período.
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-400">Curso</label>
              <select
                defaultValue=""
                className="w-full rounded-lg border border-white/10 bg-[#0b1020] px-3 py-2.5 text-sm text-zinc-300 outline-none transition focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30"
              >
                <option value="" disabled>
                  Selecione…
                </option>
                <option>Educação Infantil</option>
                <option>Ensino Fundamental I</option>
                <option>Ensino Fundamental II</option>
                <option>Ensino Médio</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-400">
                Grade Curricular
              </label>
              <select
                defaultValue=""
                className="w-full rounded-lg border border-white/10 bg-[#0b1020] px-3 py-2.5 text-sm text-zinc-300 outline-none transition focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30"
              >
                <option value="" disabled>
                  Selecione…
                </option>
                <option>2026-EI</option>
                <option>2026-EFI</option>
                <option>2026-EFII</option>
                <option>2026-EM</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-400">Turno</label>
              <select
                defaultValue=""
                className="w-full rounded-lg border border-white/10 bg-[#0b1020] px-3 py-2.5 text-sm text-zinc-300 outline-none transition focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30"
              >
                <option value="" disabled>
                  Selecione…
                </option>
                <option>Manhã</option>
                <option>Tarde</option>
                <option>Noite</option>
                <option>Integral</option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              className="rounded-lg px-4 py-2 text-sm text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-200"
            >
              Limpar
            </button>
            <button
              type="button"
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
            >
              Matricular
            </button>
          </div>
        </div>
      </section>

      {/* Histórico de matrículas */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <h3 className="text-sm font-semibold text-zinc-300">Histórico</h3>
          <span className="h-px flex-1 bg-white/8" />
        </div>

        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/8 bg-[#121827] py-16 text-center shadow-sm">
          <ClipboardList size={28} className="mb-2 text-zinc-700" />
          <p className="text-sm text-zinc-500">
            Sem histórico de matrículas anteriores.
          </p>
        </div>
      </section>
    </div>
  );
}

// ─── Placeholder genérico para seções em construção ──────────────────────────

function EmConstrucao({ label }: { label: string }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-zinc-100">{label}</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Esta seção está em desenvolvimento.
        </p>
      </div>
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/8 bg-[#121827] py-24 text-center shadow-sm">
        <BookOpen size={32} className="mb-3 text-zinc-700" />
        <p className="text-sm text-zinc-500">Conteúdo em construção</p>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function FichaAcademicaPage({ id }: { id: number }) {
  const router = useRouter();
  const [secaoAtiva, setSecaoAtiva] = useState("academico");
  const [subAtiva, setSubAtiva] = useState("matricula");
  const [expandidas, setExpandidas] = useState<string[]>(["academico"]);

  const {
    data: aluno,
    isLoading: carregandoAluno,
    isError: erroAluno,
  } = useQueryMestre(["aluno", id], () => alunosService.obter(id));

  function toggleSecao(id: string) {
    setExpandidas((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  }

  function selecionarSub(secaoId: string, subId: string) {
    setSecaoAtiva(secaoId);
    setSubAtiva(subId);
    if (!expandidas.includes(secaoId)) {
      setExpandidas((prev) => [...prev, secaoId]);
    }
  }

  const subAtivaLabel =
    SECOES.flatMap((s) => s.subs).find((s) => s.id === subAtiva)?.label ?? "";

  function renderConteudo() {
    if (secaoAtiva === "academico" && subAtiva === "matricula") {
      return <ConteudoMatricula />;
    }
    return <EmConstrucao label={subAtivaLabel} />;
  }

  // Seletor móvel: mostra a sub-seção ativa como select compacto
  const opcoesMovel = SECOES.flatMap((s) =>
    s.subs.map((sub) => ({
      value: `${s.id}__${sub.id}`,
      label: `${s.label} › ${sub.label}`,
    })),
  );

  // Loading e erro antes do layout completo
  if (carregandoAluno) {
    return (
      <div className="flex items-center justify-center py-32 text-zinc-500">
        Carregando ficha…
      </div>
    );
  }
  if (erroAluno || !aluno) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200"
        >
          <ArrowLeft size={14} /> Voltar
        </button>
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {erroAluno
            ? "Erro ao carregar a ficha do aluno."
            : "Aluno não encontrado."}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-5 lg:gap-6">
      {/* ── Sidebar (desktop) ──────────────────────────────────────────── */}
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="sticky top-6 space-y-4">
          {/* Card do aluno */}
          <div className="rounded-xl border border-white/8 bg-[#121827] p-5 text-center shadow-sm">
            {/* Voltar */}
            <button
              type="button"
              onClick={() => router.push("/academico/ficha")}
              className="mb-3 flex w-full items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300"
            >
              <ArrowLeft size={12} /> Todos os alunos
            </button>
            {/* Avatar */}
            <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full border-2 border-blue-500/30 bg-linear-to-br from-blue-600/40 to-indigo-700/40 text-2xl font-bold text-blue-200 select-none">
              {aluno.nome.charAt(0).toUpperCase()}
            </div>
            <p className="text-sm font-semibold leading-snug text-zinc-100">
              {aluno.nome}
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
              ID: {aluno.id} | Código: {aluno.codigo}
            </p>
            <div className="mt-3 flex justify-center">
              <BadgeSituacao situacao={aluno.situacao} />
            </div>

            <div className="mt-4 border-t border-white/8 pt-3 text-left">
              <InfoItem label="Unidade" value="Nexus" />
              <InfoItem
                label="Ano Letivo"
                value={String(new Date().getFullYear())}
              />
              {aluno.cpf && <InfoItem label="CPF" value={aluno.cpf} />}
            </div>
          </div>

          {/* Menu de navegação */}
          <div className="rounded-xl border border-white/8 bg-[#121827] p-3 shadow-sm">
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
              Seções
            </p>
            <nav className="space-y-0.5">
              {SECOES.map((secao) => (
                <SidebarSecao
                  key={secao.id}
                  secao={secao}
                  expandida={expandidas.includes(secao.id)}
                  subAtiva={secao.id === secaoAtiva ? subAtiva : ""}
                  onToggle={() => toggleSecao(secao.id)}
                  onSubClick={(subId) => selecionarSub(secao.id, subId)}
                />
              ))}
            </nav>
          </div>
        </div>
      </aside>

      {/* ── Conteúdo principal ──────────────────────────────────────────── */}
      <div className="min-w-0 flex-1">
        {/* Seletor móvel (visível apenas em telas < lg) */}
        <div className="mb-4 lg:hidden">
          <select
            value={`${secaoAtiva}__${subAtiva}`}
            onChange={(e) => {
              const [sec, sub] = e.target.value.split("__");
              selecionarSub(sec, sub);
            }}
            className="w-full rounded-lg border border-white/10 bg-[#121827] px-3 py-2.5 text-sm text-zinc-300 outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30"
          >
            {opcoesMovel.map((op) => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </select>
        </div>

        {renderConteudo()}
      </div>
    </div>
  );
}
