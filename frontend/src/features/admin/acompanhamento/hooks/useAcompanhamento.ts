import { useQuery } from '@tanstack/react-query'
import { acompanhamentoService, type RiscoAluno } from '@/services/acompanhamento.service'

export function useAcompanhamento(params?: { risco?: RiscoAluno; busca?: string }) {
  return useQuery({
    queryKey: ['acompanhamento', params],
    queryFn: () => acompanhamentoService.listar(params),
  })
}

export function useDetalheAluno(id: string | null) {
  return useQuery({
    queryKey: ['acompanhamento-detalhe', id],
    queryFn: () => acompanhamentoService.detalhe(id as string),
    enabled: !!id,
  })
}
