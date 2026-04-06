"use client";

import Image from "next/image";
import { useState } from "react";
import { useLogin } from "../hooks/useLogin";

export function LoginPage() {
  const { email, setEmail, senha, setSenha, carregando, erro, handleSubmit } =
    useLogin();
  const [mostrarSenha, setMostrarSenha] = useState(false);

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/10 blur-[120px]" />
      </div>

      <div className="relative w-full max-w-md rounded-2xl border border-white/[0.07] bg-white/[0.04] p-8 shadow-2xl shadow-black/60 backdrop-blur-xl">
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <Image
              src="/LogoNexus.svg"
              alt="Logo da empresa"
              width={72}
              height={72}
              priority
              className="h-auto w-[72px]"
            />
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-medium uppercase tracking-widest text-violet-400">
            Nexus Acadêmico
          </span>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-white">
            Bem-vindo de volta
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Acesse sua conta para continuar
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <div className="group">
            <label
              htmlFor="email"
              className="mb-1.5 block text-xs font-medium text-zinc-400"
            >
              E-mail
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              maxLength={255}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@instituicao.edu.br"
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.05] px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-all duration-200 focus:border-violet-500/70 focus:bg-white/[0.07] focus:ring-2 focus:ring-violet-500/20 hover:border-white/[0.14]"
            />
          </div>

          <div className="group">
            <label
              htmlFor="password"
              className="mb-1.5 block text-xs font-medium text-zinc-400"
            >
              Senha
            </label>
            <div className="relative">
              <input
                id="password"
                type={mostrarSenha ? "text" : "password"}
                autoComplete="current-password"
                required
                maxLength={128}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.05] px-4 py-3 pr-11 text-sm text-white placeholder-zinc-600 outline-none transition-all duration-200 focus:border-violet-500/70 focus:bg-white/[0.07] focus:ring-2 focus:ring-violet-500/20 hover:border-white/[0.14]"
              />
              <button
                type="button"
                onClick={() => setMostrarSenha((v) => !v)}
                aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors hover:text-zinc-300"
              >
                {mostrarSenha ? (
                  // olho fechado
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  // olho aberto
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {erro && (
            <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-xs text-red-400">
              {erro}
            </p>
          )}

          <button
            type="submit"
            disabled={carregando}
            className="relative mt-2 w-full overflow-hidden rounded-lg bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-900/40 outline-none transition-all duration-200 hover:bg-violet-500 hover:shadow-violet-700/50 focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {carregando ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
                Verificando...
              </span>
            ) : (
              "Entrar"
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-zinc-600">
          Problemas de acesso?{" "}
          <a
            href="#"
            className="text-zinc-400 underline-offset-2 transition-colors hover:text-violet-400 hover:underline"
          >
            Contate o suporte
          </a>
        </p>
      </div>
    </main>
  );
}
