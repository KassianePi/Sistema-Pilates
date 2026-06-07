import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { relatoriosService, type GerarRelatorioDTO } from '@/services/relatorios.service'

export function useRelatorios(params?: { professorId?: string; tipo?: string }) {
  return useQuery({
    queryKey: ['relatorios', params],
    queryFn: () => relatoriosService.listar(params),
  })
}

export function useGerarRelatorio() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: GerarRelatorioDTO) => relatoriosService.gerar(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['relatorios'] })
      toast.success('Relatório gerado com sucesso!')
    },
    onError: () => toast.error('Erro ao gerar relatório.'),
  })
}
