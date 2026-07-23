import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { reposicoesService } from '@/services/reposicoes.service'
import type { StatusReposicao } from '@/types/domain.types'

const QUERY_KEY = 'reposicoes-admin'

export function useReposicoesAdmin(status?: StatusReposicao) {
  return useQuery({
    queryKey: [QUERY_KEY, status],
    queryFn: () => reposicoesService.listar({ status, limit: 50 }),
  })
}

export function useAgendarReposicao() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, aulaReposicaoId }: { id: string; aulaReposicaoId: string }) =>
      reposicoesService.agendar(id, aulaReposicaoId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] })
      qc.invalidateQueries({ queryKey: ['aulas'] })
      toast.success('Reposição agendada! O aluno foi notificado.')
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Erro ao agendar reposição'),
  })
}

export function useCancelarReposicaoAdmin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => reposicoesService.cancelar(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] })
      toast.success('Solicitação de reposição cancelada.')
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Erro ao cancelar reposição'),
  })
}
