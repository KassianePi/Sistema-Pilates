import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { financeiroService, type CreateMensalidadeDTO, type CreatePagamentoDTO } from '@/services/financeiro.service'

export function useCaixaAtivo() {
  return useQuery({
    queryKey: ['caixa-ativo'],
    queryFn: () => financeiroService.buscarCaixaAtivo(),
    refetchInterval: 30_000,
  })
}

export function useAbrirCaixa() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (saldoInicial: number) => financeiroService.abrirCaixa(saldoInicial),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['caixa-ativo'] })
      toast.success('Caixa aberto!')
    },
    onError: () => toast.error('Erro ao abrir caixa.'),
  })
}

export function useFecharCaixa() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => financeiroService.fecharCaixa(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['caixa-ativo'] })
      toast.success('Caixa fechado.')
    },
    onError: () => toast.error('Erro ao fechar caixa.'),
  })
}

export function useMensalidades(params?: { pagina?: number; limite?: number; alunoId?: string; status?: string }) {
  return useQuery({
    queryKey: ['mensalidades', params],
    queryFn: () => financeiroService.listarMensalidades(params),
  })
}

export function useCreateMensalidade() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateMensalidadeDTO) => financeiroService.criarMensalidade(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mensalidades'] })
      toast.success('Mensalidade criada!')
    },
    onError: () => toast.error('Erro ao criar mensalidade.'),
  })
}

export function usePagamentos(params?: { pagina?: number; limite?: number }) {
  return useQuery({
    queryKey: ['pagamentos', params],
    queryFn: () => financeiroService.listarPagamentos(params),
  })
}

export function useRegistrarPagamento() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreatePagamentoDTO) => financeiroService.registrarPagamento(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pagamentos'] })
      qc.invalidateQueries({ queryKey: ['mensalidades'] })
      toast.success('Pagamento registrado!')
    },
    onError: () => toast.error('Erro ao registrar pagamento.'),
  })
}
