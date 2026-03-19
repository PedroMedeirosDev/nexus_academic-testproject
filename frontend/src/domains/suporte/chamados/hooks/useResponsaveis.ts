import { useQueryMestre } from "@/shared/hooks/useQueryMestre";
import { usuariosService } from "../services/usuariosService";

export function useResponsaveis() {
  const { data, isLoading } = useQueryMestre(["responsaveis"], () =>
    usuariosService.listarStaff().then((r) => r.items),
  );
  return { responsaveis: data ?? [], isLoading };
}
