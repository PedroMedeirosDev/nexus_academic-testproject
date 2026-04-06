"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { servicoLogin } from "../services/loginService";

export function useLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCarregando(true);
    setErro(null);

    try {
      await servicoLogin.autenticar(email, senha);
      router.push("/dashboard");
    } catch (err: unknown) {
      setErro(
        err instanceof Error
          ? err.message
          : "Não foi possível conectar ao servidor. Tente novamente.",
      );
    } finally {
      setCarregando(false);
    }
  }

  return { email, setEmail, senha, setSenha, carregando, erro, handleSubmit };
}
