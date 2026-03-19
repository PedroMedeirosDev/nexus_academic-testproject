import { apiClient } from "@/shared/services/apiClient";

export type Evento = {
  id: string;
  titulo: string;
  descricao: string;
  data: string; // YYYY-MM-DD
  horaInicio: string; // HH:MM ou ""
  horaFim: string; // HH:MM ou ""
  diaInteiro: boolean;
};

export type EventoRequest = {
  titulo: string;
  descricao: string;
  data: string;
  horaInicio: string;
  horaFim: string;
  diaInteiro: boolean;
};

export type ListaEventosResponse = {
  items: Evento[];
  count: number;
};

export const calendarioService = {
  listar: (mes: number, ano: number) =>
    apiClient.get<ListaEventosResponse>(
      `/calendario/eventos?mes=${mes}&ano=${ano}`,
    ),

  criar: (req: EventoRequest) =>
    apiClient.post<Evento>("/calendario/eventos", req),

  atualizar: (id: string, req: EventoRequest) =>
    apiClient.put<Evento>(`/calendario/eventos/${id}`, req),

  excluir: (id: string) => apiClient.delete(`/calendario/eventos/${id}`),
};
