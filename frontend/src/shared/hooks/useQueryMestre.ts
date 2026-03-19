import { useQuery, type QueryKey } from "@tanstack/react-query";

/**
 * Hook base para dados mestres (templates, alunos, turmas, responsáveis…).
 * Serve o cache imediatamente e revalida em background a cada 30 s.
 */
export function useQueryMestre<T>(
  queryKey: QueryKey,
  queryFn: () => Promise<T>,
) {
  return useQuery<T>({
    queryKey,
    queryFn,
    staleTime: 30_000,
    gcTime: Infinity,
    refetchOnWindowFocus: true,
  });
}
