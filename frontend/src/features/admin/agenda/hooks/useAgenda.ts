import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { agendaService, type CreateAulaDTO, type UpdateAulaDTO } from '@/services/agenda.service'
import { presencaService, type BatchPresencaDTO } from '@/services/presenca.service'

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
    mutationFn: ({ id, justificativa }: { id: string; justificativa: string }) => agendaService.cancelar(id, justificativa),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] })
      toast.success('Aula cancelada.')
    },
    onError: () => toast.error('Erro ao cancelar aula.'),
  })
}

export function useSuspenderAula() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, justificativa }: { id: string; justificativa: string }) => agendaService.suspender(id, justificativa),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] })
      toast.success('Aula suspensa.')
    },
    onError: () => toast.error('Erro ao suspender aula.'),
  })
}

export function useReagendarAula() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dataHoraInicio, justificativa }: { id: string; dataHoraInicio: string; justificativa: string }) =>
      agendaService.reagendar(id, dataHoraInicio, justificativa),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] })
      toast.success('Aula reagendada.')
    },
    onError: () => toast.error('Erro ao reagendar aula.'),
  })
}

export function useExcluirAula() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, justificativa }: { id: string; justificativa: string }) => agendaService.excluir(id, justificativa),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] })
      toast.success('Aula excluída.')
    },
    onError: () => toast.error('Erro ao excluir aula.'),
  })
}

export function useRegistrarPresencasBatch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: BatchPresencaDTO) => presencaService.registrarBatch(dto),
    onSuccess: (_, { presencas }) => {
      const presentes = presencas.filter((p) => p.status === 'PRESENTE').length
      qc.invalidateQueries({ queryKey: [QUERY_KEY] })
      toast.success(`Presenças salvas: ${presentes} presente(s), ${presencas.length - presentes} ausente(s). Aula marcada como Realizada.`)
    },
    onError: () => toast.error('Erro ao registrar presenças.'),
  })
}
