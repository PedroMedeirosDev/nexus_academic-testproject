import { useQueryTransacional } from "@/shared/hooks/useQueryTransacional";
import { chamadosService } from "@/domains/suporte/chamados/services/chamadosService";

export function useChamadosDashboard() {
  const recentes = useQueryTransacional(["chamados-dashboard-recentes"], () =>
    chamadosService.listar({ limit: 5, offset: 0 }).then((r) => r.items),
  );

  const totalAbertos = useQueryTransacional(["chamados-count-abertos"], () =>
    chamadosService
      .listar({ situacao: "Aberto", limit: 1, offset: 0 })
      .then((r) => r.count),
  );

  return {
    chamados: recentes.data ?? [],
    totalAbertos: totalAbertos.data ?? null,
    isLoading: recentes.isLoading,
    isError: recentes.isError,
  };
}
