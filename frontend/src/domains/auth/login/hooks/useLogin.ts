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
  const [sucesso, setSucesso] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCarregando(true);
    setErro(null);
    setSucesso(null);

    try {
      const usuario = await servicoLogin.autenticar(email, senha);
      localStorage.setItem("sessao_usuario_id", usuario.id);
      localStorage.setItem("sessao_usuario_nome", usuario.nome);
      localStorage.setItem("sessao_usuario_email", usuario.email);
      setSucesso("Acesso concedido.");
      router.push("/dashboard");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErro(err.message);
      } else {
        setErro("Nao foi possivel conectar ao servidor.");
      }
    } finally {
      setCarregando(false);
    }
  }

  return {
    email,
    setEmail,
    senha,
    setSenha,
    carregando,
    erro,
    sucesso,
    handleSubmit,
  };
}
