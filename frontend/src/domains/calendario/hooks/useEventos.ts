import { useQueryTransacional } from "@/shared/hooks/useQueryTransacional";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  calendarioService,
  type EventoRequest,
} from "../services/calendarioService";

export function useEventos(mes: number, ano: number) {
  const qc = useQueryClient();
  const key = ["eventos", mes, ano];

  const query = useQueryTransacional(key, () =>
    calendarioService.listar(mes, ano).then((r) => r.items),
  );

  const invalidar = () => qc.invalidateQueries({ queryKey: key });

  const criar = useMutation({
    mutationFn: (req: EventoRequest) => calendarioService.criar(req),
    onSuccess: invalidar,
  });

  const atualizar = useMutation({
    mutationFn: ({ id, req }: { id: string; req: EventoRequest }) =>
      calendarioService.atualizar(id, req),
    onSuccess: invalidar,
  });

  const excluir = useMutation({
    mutationFn: (id: string) => calendarioService.excluir(id),
    onSuccess: invalidar,
  });

  return {
    eventos: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isUsingCache: query.isUsingCache,
    criar: criar.mutate,
    criarAsync: criar.mutateAsync,
    atualizar: atualizar.mutate,
    atualizarAsync: atualizar.mutateAsync,
    excluir: excluir.mutate,
    salvando: criar.isPending || atualizar.isPending,
    excluindo: excluir.isPending,
  };
}
