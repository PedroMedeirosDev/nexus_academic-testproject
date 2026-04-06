import { useQueryMestre } from "@/shared/hooks/useQueryMestre";
import { unidadesService } from "../services/unidadesService";

export function useUnidades() {
  const { data, isLoading } = useQueryMestre(["unidades"], () =>
    unidadesService.listar().then((r) => r.items),
  );
  return { unidades: data ?? [], isLoading };
}
