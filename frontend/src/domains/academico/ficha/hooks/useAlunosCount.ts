import { useQueryMestre } from "@/shared/hooks/useQueryMestre";
import { alunosService } from "../services/alunosService";

export function useAlunosCount() {
  const query = useQueryMestre(["alunos-count-ativos"], () =>
    alunosService.contarAtivos(),
  );
  return {
    total: query.data?.total ?? null,
    isLoading: query.isLoading,
  };
}
