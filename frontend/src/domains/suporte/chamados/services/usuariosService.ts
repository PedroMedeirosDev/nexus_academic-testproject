import { apiClient } from "@/shared/services/apiClient";

export type UsuarioStaff = {
  id: string;
  nome: string;
};

export const usuariosService = {
  listarStaff: () => apiClient.get<{ items: UsuarioStaff[] }>("/usuarios"),
};
