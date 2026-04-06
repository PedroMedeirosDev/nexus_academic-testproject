import { supabase } from "@/shared/lib/supabaseClient";
import type { Session } from "@supabase/supabase-js";

const regrasErro: Array<{ fragmento: string; mensagem: string }> = [
  {
    fragmento: "Invalid login credentials",
    mensagem: "E-mail ou senha incorretos.",
  },
  { fragmento: "invalid_credentials", mensagem: "E-mail ou senha incorretos." },
  {
    fragmento: "Invalid email or password",
    mensagem: "E-mail ou senha incorretos.",
  },
  { fragmento: "User not found", mensagem: "Usuário não encontrado." },
  {
    fragmento: "Email not confirmed",
    mensagem: "E-mail não confirmado. Verifique sua caixa de entrada.",
  },
  {
    fragmento: "Too many requests",
    mensagem: "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
  },
  {
    fragmento: "rate limit",
    mensagem: "Limite de tentativas excedido. Tente novamente mais tarde.",
  },
  {
    fragmento: "Database error",
    mensagem: "Erro interno do servidor. Contate o suporte.",
  },
  {
    fragmento: "unexpected_failure",
    mensagem: "Erro interno do servidor. Contate o suporte.",
  },
  {
    fragmento: "Internal Server Error",
    mensagem: "Erro interno do servidor. Contate o suporte.",
  },
];

function traduzirErro(mensagem: string): string {
  console.error("[Auth] Erro Supabase:", mensagem);
  const regra = regrasErro.find((r) =>
    mensagem.toLowerCase().includes(r.fragmento.toLowerCase()),
  );
  return regra?.mensagem ?? `Erro ao autenticar: ${mensagem}`;
}

async function autenticar(email: string, senha: string): Promise<Session> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: senha,
  });
  if (error) throw new Error(traduzirErro(error.message));
  return data.session!;
}

export const servicoLogin = { autenticar };
