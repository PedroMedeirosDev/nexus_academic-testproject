import { apiClient } from "@/shared/services/apiClient";

export type Unidade = {
  id: number;
  nome: string;
  sigla: string;
};

export const unidadesService = {
  listar: () => apiClient.get<{ items: Unidade[] }>("/unidades"),
};
