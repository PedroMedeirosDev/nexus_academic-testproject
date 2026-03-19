import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  chamadosService,
  type ChamadoRequest,
  type FiltrosChamados,
} from "../services/chamadosService";

const LIMIT = 20;

export function useChamados(
  filtros: Omit<FiltrosChamados, "limit" | "offset">,
) {
  const queryClient = useQueryClient();

  const infiniteQuery = useInfiniteQuery({
    queryKey: ["chamados", filtros],
    queryFn: ({ pageParam = 0 }) =>
      chamadosService.listar({ ...filtros, limit: LIMIT, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((acc, p) => acc + p.items.length, 0);
      return loaded < lastPage.count ? loaded : undefined;
    },
    staleTime: 0,
    gcTime: Infinity,
  });

  const items = infiniteQuery.data?.pages.flatMap((p) => p.items) ?? [];
  const count = infiniteQuery.data?.pages[0]?.count ?? 0;

  const excluir = useMutation({
    mutationFn: (id: number) => chamadosService.excluir(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["chamados"] }),
  });

  return {
    items,
    count,
    isLoading: infiniteQuery.isLoading,
    isError: infiniteQuery.isError,
    error: infiniteQuery.error,
    isFetchingNextPage: infiniteQuery.isFetchingNextPage,
    hasNextPage: infiniteQuery.hasNextPage ?? false,
    carregarMais: infiniteQuery.fetchNextPage,
    excluir: excluir.mutate,
    excluindo: excluir.isPending,
  };
}

export function useChamadoMutacoes() {
  const queryClient = useQueryClient();

  const invalidar = () =>
    queryClient.invalidateQueries({ queryKey: ["chamados"] });

  const criar = useMutation({
    mutationFn: (req: ChamadoRequest) => chamadosService.criar(req),
    onSuccess: invalidar,
  });

  const atualizar = useMutation({
    mutationFn: ({ id, req }: { id: number; req: ChamadoRequest }) =>
      chamadosService.atualizar(id, req),
    onSuccess: invalidar,
  });

  return { criar, atualizar };
}
