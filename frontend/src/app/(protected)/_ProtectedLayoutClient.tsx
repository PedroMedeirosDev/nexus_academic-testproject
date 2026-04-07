"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/shared/lib/supabaseClient";

type SubItem = { label: string; href: string };
type MenuItem =
  | { label: string; href: string; subitems?: never }
  | { label: string; href?: never; subitems: SubItem[] };

const DEMO = process.env.NEXT_PUBLIC_DEMO === "true";

const MENU_COMPLETO: MenuItem[] = [
  { label: "Início", href: "/dashboard" },
  {
    label: "Acadêmico",
    subitems: [{ label: "Ficha Acadêmica", href: "/academico/ficha" }],
  },
  {
    label: "Financeiro",
    subitems: [{ label: "Ficha Financeira", href: "/financeiro/ficha" }],
  },
  {
    label: "Suporte",
    subitems: [{ label: "Gestão de Chamados", href: "/suporte/chamados" }],
  },
];

// Em modo demo, oculta Acadêmico e Financeiro
const ROTAS_DEMO_BLOQUEADAS = ["/academico", "/financeiro"];

const MENU = DEMO
  ? MENU_COMPLETO.filter(
      (item) =>
        !ROTAS_DEMO_BLOQUEADAS.some((r) =>
          item.subitems
            ? item.subitems.some((s) => s.href.startsWith(r))
            : item.href?.startsWith(r),
        ),
    )
  : MENU_COMPLETO;

const TITULOS: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/academico/ficha": "Ficha Acadêmica",
  "/academico/ficha/novo": "Novo Aluno",
  "/financeiro/ficha": "Ficha Financeira",
  "/suporte/chamados": "Gestão de Chamados",
  "/suporte/chamados/novo": "Novo Chamado",
  "/perfil": "Meu Perfil",
  "/calendario": "Calendário",
};

export default function ProtectedLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [menuAberto, setMenuAberto] = useState(false);
  const [expandidos, setExpandidos] = useState<string[]>([]);
  const [sessao, setSessao] = useState<Session | null>(null);
  const [carregandoSessao, setCarregandoSessao] = useState(true);

  function toggleSubmenu(label: string) {
    setExpandidos((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label],
    );
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSessao(session);
      setCarregandoSessao(false);
      if (!session) router.replace("/login");
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessao(session);
      if (!session) router.replace("/login");
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function handleClickFora(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuAberto(false);
      }
    }
    document.addEventListener("mousedown", handleClickFora);
    return () => document.removeEventListener("mousedown", handleClickFora);
  }, []);

  async function sair() {
    await supabase.auth.signOut();
    setMenuAberto(false);
    router.push("/login");
  }

  function irParaPerfil() {
    setMenuAberto(false);
    router.push("/perfil");
  }

  function irParaCalendario() {
    setMenuAberto(false);
    router.push("/calendario");
  }

  const nomeUsuario =
    sessao?.user?.user_metadata?.nome ?? sessao?.user?.email ?? "Usuário";

  if (carregandoSessao) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-primary-950 text-zinc-500">
        Carregando…
      </div>
    );
  }

  const tituloPagina =
    TITULOS[pathname] ??
    (/^\/suporte\/chamados\/\d+$/.test(pathname)
      ? "Editar Chamado"
      : /^\/academico\/ficha\/\d+$/.test(pathname)
        ? "Ficha Acadêmica"
        : "Nexus");

  return (
    <div className="min-h-screen bg-primary-950 text-zinc-100">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden w-65 shrink-0 border-r border-white/10 bg-primary-900 lg:block">
          {/* Logo */}
          <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/LogoNexus.svg" alt="Nexus" className="h-8 w-8" />
            <p className="text-lg font-semibold tracking-tight">Nexus</p>
          </div>

          <nav className="h-[calc(100vh-65px)] overflow-y-auto py-3">
            {MENU.map((item) => {
              if (!item.subitems) {
                const ativo = pathname === item.href;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`flex w-full items-center px-5 py-2.5 text-sm transition ${
                      ativo
                        ? "bg-primary-600/20 text-primary-300"
                        : "text-zinc-300 hover:bg-white/5"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              }

              const temAtivo = item.subitems.some((s) =>
                pathname.startsWith(s.href),
              );
              const expandido = expandidos.includes(item.label);

              return (
                <div key={item.label}>
                  <button
                    type="button"
                    onClick={() => toggleSubmenu(item.label)}
                    className={`flex w-full items-center justify-between px-5 py-2.5 text-sm transition ${
                      temAtivo
                        ? "bg-primary-600/20 text-primary-300"
                        : "text-zinc-300 hover:bg-white/5"
                    }`}
                  >
                    <span>{item.label}</span>
                    <span
                      className={`text-xs text-zinc-500 transition-transform duration-200 ${expandido ? "rotate-90" : ""}`}
                    >
                      ›
                    </span>
                  </button>

                  {expandido && (
                    <div className="bg-white/3">
                      {item.subitems.map((sub) => (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          className={`flex w-full items-center px-9 py-2 text-sm transition ${
                            pathname === sub.href
                              ? "text-primary-400"
                              : "text-zinc-400 hover:text-zinc-200"
                          }`}
                        >
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </aside>

        {/* Conteúdo */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 border-b border-white/10 bg-primary-900/95 backdrop-blur">
            <div className="flex h-16 items-center justify-between px-4 sm:px-6">
              <p className="text-base font-semibold sm:text-lg">
                {tituloPagina}
              </p>

              <div ref={menuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setMenuAberto((prev) => !prev)}
                  className="flex items-center gap-2 rounded-full border border-primary-700/50 bg-primary-900/60 px-3 py-1.5 text-sm text-zinc-100"
                >
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-primary-700/50 bg-primary-950">
                    {nomeUsuario.charAt(0).toUpperCase()}
                  </span>
                  <span>Olá, {nomeUsuario}</span>
                  <span className="text-zinc-400">▾</span>
                </button>

                {menuAberto && (
                  <div className="absolute right-0 mt-2 w-52 rounded-xl border border-primary-800/30 bg-primary-950 p-1 shadow-2xl shadow-black/40">
                    <button
                      type="button"
                      onClick={irParaPerfil}
                      className="w-full rounded-lg px-3 py-2 text-left text-sm text-zinc-200 hover:bg-white/10"
                    >
                      Meu Perfil
                    </button>
                    <button
                      type="button"
                      onClick={irParaCalendario}
                      className="w-full rounded-lg px-3 py-2 text-left text-sm text-zinc-200 hover:bg-white/10"
                    >
                      Editar Calendário
                    </button>
                    <div className="my-1 border-t border-white/10" />
                    <button
                      type="button"
                      onClick={sair}
                      className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-300 hover:bg-red-500/10"
                    >
                      Sair
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          <main className="min-w-0 flex-1 p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
