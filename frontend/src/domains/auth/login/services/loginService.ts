const URL_API = process.env.NEXT_PUBLIC_API_URL;

interface RespostaLogin {
  id: string;
  nome: string;
  email: string;
}

async function autenticar(
  email: string,
  senha: string,
): Promise<RespostaLogin> {
  if (!URL_API) {
    throw new Error("NEXT_PUBLIC_API_URL nao configurada.");
  }

  const res = await fetch(`${URL_API}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, senha }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.mensagem ?? "credenciais invalidas");
  }

  return data as RespostaLogin;
}

export const servicoLogin = { autenticar };
