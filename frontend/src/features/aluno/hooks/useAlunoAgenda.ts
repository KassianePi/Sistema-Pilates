import { useQuery } from '@tanstack/react-query'
import { agendaService } from '@/services/agenda.service'

export type EscopoAgenda = 'minhas' | 'gerais' | 'historico'

export function useAlunoAgenda(escopo: EscopoAgenda) {
  return useQuery({
    queryKey: ['aulas-aluno', escopo],
    queryFn: () => agendaService.listarAulasAluno({ escopo, limit: 100 }),
  })
}
