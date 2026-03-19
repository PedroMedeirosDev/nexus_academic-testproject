import { apiClient } from "@/shared/services/apiClient";

export type Chamado = {
  id: number;
  assunto: string;
  descricao: string;
  situacao: "Aberto" | "Em andamento" | "Resolvido" | "Fechado";
  prioridade: "Urgente" | "Alta" | "Normal" | "Baixa";
  tipo: string;
  setor: string;
  solicitante: string;
  responsavel: string;
  dataHora: string;
  unidade: string;
};

export type ChamadoRequest = {
  assunto: string;
  descricao: string;
  situacao: string;
  prioridade: string;
  tipo: string;
  setor: string;
  solicitante: string;
  responsavel: string;
};

export type HistoricoItem = {
  id: number;
  autor: string;
  mensagem: string;
  data: string;
};

export type ListaChamadosResponse = {
  items: Chamado[];
  count: number;
};

export type FiltrosChamados = {
  num?: string;
  assunto?: string;
  solicitante?: string;
  responsavel?: string;
  limit?: number;
  offset?: number;
};

function buildQuery(f: FiltrosChamados): string {
  const p = new URLSearchParams();
  if (f.num) p.set("num", f.num);
  if (f.assunto) p.set("assunto", f.assunto);
  if (f.solicitante) p.set("solicitante", f.solicitante);
  if (f.responsavel) p.set("responsavel", f.responsavel);
  p.set("limit", String(f.limit ?? 20));
  p.set("offset", String(f.offset ?? 0));
  return p.toString();
}

export const chamadosService = {
  listar: (f: FiltrosChamados = {}) =>
    apiClient.get<ListaChamadosResponse>(`/suporte/chamados?${buildQuery(f)}`),

  criar: (req: ChamadoRequest) =>
    apiClient.post<Chamado>("/suporte/chamados", req),

  atualizar: (id: number, req: ChamadoRequest) =>
    apiClient.put<Chamado>(`/suporte/chamados/${id}`, req),

  excluir: (id: number) => apiClient.delete(`/suporte/chamados/${id}`),

  listarHistorico: (idChamado: number) =>
    apiClient.get<{ items: HistoricoItem[]; count: number }>(
      `/suporte/chamados/${idChamado}/historico`,
    ),

  adicionarHistorico: (idChamado: number, autor: string, mensagem: string) =>
    apiClient.post<HistoricoItem>(`/suporte/chamados/${idChamado}/historico`, {
      autor,
      mensagem,
    }),
};
