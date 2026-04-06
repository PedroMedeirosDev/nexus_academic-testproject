import { supabase } from "@/shared/lib/supabaseClient";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

type Opcoes = Omit<RequestInit, "body"> & { body?: unknown };

async function request<T>(path: string, opcoes: Opcoes = {}): Promise<T> {
  const { body, ...rest } = opcoes;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const res = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : undefined),
      ...(rest.headers as Record<string, string> | undefined),
    } as HeadersInit,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw Object.assign(
      new Error(
        (data as { mensagem?: string }).mensagem ?? `Erro ${res.status}`,
      ),
      { status: res.status, response: res },
    );
  }
  return data as T;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PUT", body }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PATCH", body }),
  delete: (path: string) => request<void>(path, { method: "DELETE" }),
};
