import { apiClient } from "@/shared/services/apiClient";

export type Aluno = {
  id: number;
  nome: string;
  codigo: string;
  cpf: string;
  dataNascimento: string; // "YYYY-MM-DD" ou ""
  situacao: "Ativo" | "Inativo" | "Trancado" | "Formado";
  fotoUrl: string;
};

export type AlunoRequest = {
  nome: string;
  codigo: string;
  cpf: string;
  dataNascimento: string;
  situacao: string;
};

export type ListaAlunosResponse = {
  items: Aluno[];
  count: number;
};

export type FiltrosAlunos = {
  nome?: string;
  codigo?: string;
  situacao?: string;
  limit?: number;
  offset?: number;
};

function buildQuery(f: FiltrosAlunos): string {
  const p = new URLSearchParams();
  if (f.nome) p.set("nome", f.nome);
  if (f.codigo) p.set("codigo", f.codigo);
  if (f.situacao) p.set("situacao", f.situacao);
  p.set("limit", String(f.limit ?? 20));
  p.set("offset", String(f.offset ?? 0));
  return p.toString();
}

export const alunosService = {
  listar: (f: FiltrosAlunos = {}) =>
    apiClient.get<ListaAlunosResponse>(`/alunos?${buildQuery(f)}`),

  contarAtivos: () =>
    apiClient.get<{ total: number }>("/alunos/count?situacao=Ativo"),

  obter: (id: number) => apiClient.get<Aluno>(`/alunos/${id}`),

  criar: (req: AlunoRequest) => apiClient.post<Aluno>("/alunos", req),

  atualizarFoto: (id: number, fotoUrl: string) =>
    apiClient.patch<{ fotoUrl: string }>(`/alunos/${id}/foto`, { fotoUrl }),
};
