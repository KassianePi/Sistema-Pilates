import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { notificacoesService } from '@/services/notificacoes.service'

const QUERY_KEY = ['notificacoes-aluno']

export function useNotificacoes() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => notificacoesService.listar({ limite: 100 }),
    refetchInterval: 60_000,
  })
}

export function useMarcarLida() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => notificacoesService.marcarLida(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
    onError: () => toast.error('Erro ao marcar notificação.'),
  })
}

export function useArquivarNotificacao() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => notificacoesService.arquivar(id),
    onSuccess: () => {
      toast.success('Notificação arquivada.')
      qc.invalidateQueries({ queryKey: QUERY_KEY })
    },
    onError: () => toast.error('Erro ao arquivar notificação.'),
  })
}

/**
 * Marca todas como lidas via loop client-side sobre as não-lidas.
 * MELHORIA FUTURA (backend): PATCH /api/v1/notificacoes/marcar-todas — não implementar agora.
 */
export function useMarcarTodasLidas() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map((id) => notificacoesService.marcarLida(id)))
    },
    onSuccess: () => {
      toast.success('Todas as notificações foram marcadas como lidas.')
      qc.invalidateQueries({ queryKey: QUERY_KEY })
    },
    onError: () => toast.error('Erro ao marcar notificações.'),
  })
}
