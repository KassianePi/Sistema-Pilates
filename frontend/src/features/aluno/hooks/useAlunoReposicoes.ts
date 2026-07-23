import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { reposicoesService } from '@/services/reposicoes.service'

export function useMinhasReposicoes() {
  return useQuery({
    queryKey: ['minhas-reposicoes'],
    queryFn: () => reposicoesService.listarMinhas({ limit: 20 }),
  })
}

export function useSolicitarReposicao() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: { aulaOriginalId: string; motivo: string }) => reposicoesService.solicitar(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['minhas-reposicoes'] })
      toast.success('Reposição solicitada! Aguarde o contato do studio.')
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Erro ao solicitar reposição'),
  })
}
