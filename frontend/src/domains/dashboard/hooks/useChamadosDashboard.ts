import { useQueryTransacional } from "@/shared/hooks/useQueryTransacional";
import { chamadosService } from "@/domains/suporte/chamados/services/chamadosService";

export function useChamadosDashboard() {
  const query = useQueryTransacional(["chamados-dashboard"], () =>
    chamadosService.listar({ limit: 5, offset: 0 }).then((r) => r.items),
  );
  return {
    chamados: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
