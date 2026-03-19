import { useQuery, type QueryKey } from "@tanstack/react-query";

/**
 * Hook base para dados transacionais (lançamentos, notas, chamados…).
 * Network-first: sempre busca o backend. Só usa cache como fallback em erro de rede
 * (sem response HTTP). Erros 4xx/5xx são propagados normalmente.
 */
export function useQueryTransacional<T>(
  queryKey: QueryKey,
  queryFn: () => Promise<T>,
) {
  const result = useQuery<T>({
    queryKey,
    queryFn,
    staleTime: 0,
    gcTime: Infinity,
    refetchOnWindowFocus: true,
    retry: (failureCount, error) => {
      // Não retentar erros HTTP (4xx/5xx) — apenas erros de rede
      const isNetworkError = !(error as { response?: unknown }).response;
      return isNetworkError && failureCount < 2;
    },
  });

  const isNetworkError =
    result.isError && !(result.error as { response?: unknown }).response;

  return {
    ...result,
    // Bloqueia renderização enquanto busca (sem cache stale para mostrar)
    isLoading: result.isFetching && !result.data,
    // Indica que está mostrando cache antigo por erro de rede
    isUsingCache: isNetworkError && !!result.data,
  };
}
