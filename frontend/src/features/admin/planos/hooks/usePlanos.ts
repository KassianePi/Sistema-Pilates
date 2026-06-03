import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { planosService, type CreatePlanoDTO, type UpdatePlanoDTO } from '@/services/planos.service'

const QUERY_KEY = 'planos'

export function usePlanos(params?: { pagina?: number; limite?: number; busca?: string }) {
  return useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: () => planosService.listar(params),
  })
}

export function usePlano(id: string) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => planosService.buscarPorId(id),
    enabled: !!id,
  })
}

export function useCreatePlano() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreatePlanoDTO) => planosService.criar(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] })
      toast.success('Plano criado com sucesso!')
    },
    onError: () => toast.error('Erro ao criar plano.'),
  })
}

export function useUpdatePlano() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdatePlanoDTO }) => planosService.atualizar(id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] })
      toast.success('Plano atualizado com sucesso!')
    },
    onError: () => toast.error('Erro ao atualizar plano.'),
  })
}

export function useDeletePlano() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => planosService.excluir(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] })
      toast.success('Plano removido com sucesso.')
    },
    onError: () => toast.error('Erro ao remover plano.'),
  })
}
