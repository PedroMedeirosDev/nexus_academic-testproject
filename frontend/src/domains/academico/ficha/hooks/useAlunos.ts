import { useInfiniteQuery } from "@tanstack/react-query";
import { alunosService, type FiltrosAlunos } from "../services/alunosService";

const LIMIT = 20;

export function useAlunos(filtros: FiltrosAlunos = {}) {
  const result = useInfiniteQuery({
    queryKey: ["alunos", filtros],
    queryFn: ({ pageParam = 0 }) =>
      alunosService.listar({ ...filtros, limit: LIMIT, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((acc, p) => acc + p.items.length, 0);
      return loaded < lastPage.count ? loaded : undefined;
    },
  });

  return {
    alunos: result.data?.pages.flatMap((p) => p.items) ?? [],
    count: result.data?.pages[0]?.count ?? 0,
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.error,
    isFetchingNextPage: result.isFetchingNextPage,
    hasNextPage: result.hasNextPage ?? false,
    carregarMais: result.fetchNextPage,
  };
}
