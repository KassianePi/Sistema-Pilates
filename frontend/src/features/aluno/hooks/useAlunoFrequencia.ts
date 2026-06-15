import { useQuery } from '@tanstack/react-query'
import { presencaService } from '@/services/presenca.service'

export function useAlunoFrequencia() {
  return useQuery({
    queryKey: ['presencas-aluno'],
    queryFn: () => presencaService.listarMinhas({ limit: 100 }),
  })
}
