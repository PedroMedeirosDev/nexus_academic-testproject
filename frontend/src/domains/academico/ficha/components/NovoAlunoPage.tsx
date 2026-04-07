"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { alunosService } from "../services/alunosService";

type Form = {
  nome: string;
  codigo: string;
  cpf: string;
  dataNascimento: string;
  situacao: string;
};

const FORM_VAZIO: Form = {
  nome: "",
  codigo: "",
  cpf: "",
  dataNascimento: "",
  situacao: "Ativo",
};

function campo(label: string, children: React.ReactNode, obrigatorio = false) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-zinc-400">
        {label}
        {obrigatorio && <span className="ml-0.5 text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-white/10 bg-[#0b1020] px-3 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 outline-none transition focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30";

export function NovoAlunoPage() {
  const router = useRouter();
  const [form, setForm] = useState<Form>(FORM_VAZIO);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function setF(field: keyof Form, value: string) {
    setErro(null);
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome.trim() || !form.codigo.trim()) return;

    setSalvando(true);
    setErro(null);
    try {
      const aluno = await alunosService.criar({
        nome: form.nome.trim(),
        codigo: form.codigo.trim(),
        cpf: form.cpf.trim(),
        dataNascimento: form.dataNascimento,
        situacao: form.situacao,
      });
      router.replace(`/academico/ficha/${aluno.id}`);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao salvar aluno.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Cabeçalho */}
      <p className="text-sm text-zinc-500">
        Preencha os dados básicos para cadastrar um novo aluno no sistema.
      </p>

      {/* Formulário */}
      <form
        onSubmit={salvar}
        className="space-y-5 rounded-xl border border-white/8 bg-[#121827] p-6 shadow-sm"
      >
        {erro && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {erro}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {campo(
            "Nome completo",
            <input
              type="text"
              value={form.nome}
              onChange={(e) => setF("nome", e.target.value)}
              placeholder="Ex: Ana Paula Ferreira"
              maxLength={150}
              required
              className={inputCls}
            />,
            true,
          )}

          {campo(
            "Código do aluno",
            <input
              type="text"
              value={form.codigo}
              onChange={(e) => setF("codigo", e.target.value)}
              placeholder="Ex: 2502904484"
              maxLength={20}
              required
              className={inputCls}
            />,
            true,
          )}

          {campo(
            "CPF",
            <input
              type="text"
              value={form.cpf}
              onChange={(e) => setF("cpf", e.target.value)}
              placeholder="000.000.000-00"
              maxLength={14}
              className={inputCls}
            />,
          )}

          {campo(
            "Data de nascimento",
            <input
              type="date"
              value={form.dataNascimento}
              onChange={(e) => setF("dataNascimento", e.target.value)}
              className={inputCls}
            />,
          )}

          {campo(
            "Situação",
            <select
              value={form.situacao}
              onChange={(e) => setF("situacao", e.target.value)}
              className={inputCls}
            >
              <option>Ativo</option>
              <option>Inativo</option>
              <option>Trancado</option>
              <option>Formado</option>
              <option>Reserva de Vaga</option>
            </select>,
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-white/8 pt-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg px-4 py-2 text-sm text-zinc-400 transition hover:bg-white/5 hover:text-zinc-200"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={salvando || !form.nome.trim() || !form.codigo.trim()}
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50"
          >
            {salvando ? "Salvando…" : "Salvar Aluno"}
          </button>
        </div>
      </form>
    </div>
  );
}
