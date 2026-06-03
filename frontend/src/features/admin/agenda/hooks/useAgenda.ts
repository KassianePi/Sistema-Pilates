import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { agendaService, type CreateAulaDTO, type UpdateAulaDTO } from '@/services/agenda.service'

const QUERY_KEY = 'aulas'

export function useAulas(params?: { pagina?: number; limite?: number; data?: string; professorId?: string; status?: string }) {
  return useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: () => agendaService.listar(params),
  })
}

export function useCreateAula() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateAulaDTO) => agendaService.criar(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] })
      toast.success('Aula agendada com sucesso!')
    },
    onError: () => toast.error('Erro ao agendar aula.'),
  })
}

export function useUpdateAula() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateAulaDTO }) => agendaService.atualizar(id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] })
      toast.success('Aula atualizada com sucesso!')
    },
    onError: () => toast.error('Erro ao atualizar aula.'),
  })
}

export function useCancelarAula() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, motivo }: { id: string; motivo?: string }) => agendaService.cancelar(id, motivo),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] })
      toast.success('Aula cancelada.')
    },
    onError: () => toast.error('Erro ao cancelar aula.'),
  })
}
