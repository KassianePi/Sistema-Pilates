import { api } from './api'
import type { Mensalidade, Pagamento, ApiResponse, PaginatedResponse, MetodoPagamento } from '@/types/domain.types'

export interface CreateMensalidadeDTO {
  alunoId: string
  planoId: string
  valor: number
  vencimento: string
}

export interface CreatePagamentoDTO {
  mensalidadeId: string
  valor: number
  metodoPagamento: MetodoPagamento
  dataPagamento: string
  observacoes?: string
}

export interface CaixaAtivo {
  id: string
  abertura: string
  saldoInicial: number
  saldoFinal?: number
  fechamento?: string
  status: 'ABERTO' | 'FECHADO'
}

export const financeiroService = {
  async listarMensalidades(params?: { pagina?: number; limite?: number; alunoId?: string; status?: string }) {
    const { data } = await api.get<ApiResponse<PaginatedResponse<Mensalidade>>>('/mensalidades', { params })
    return data.data
  },

  async criarMensalidade(dto: CreateMensalidadeDTO) {
    const { data } = await api.post<ApiResponse<Mensalidade>>('/mensalidades', dto)
    return data.data
  },

  async listarPagamentos(params?: { pagina?: number; limite?: number }) {
    const { data } = await api.get<ApiResponse<PaginatedResponse<Pagamento>>>('/pagamentos', { params })
    return data.data
  },

  async registrarPagamento(dto: CreatePagamentoDTO) {
    const { data } = await api.post<ApiResponse<Pagamento>>('/pagamentos', dto)
    return data.data
  },

  async buscarCaixaAtivo() {
    const { data } = await api.get<ApiResponse<CaixaAtivo | null>>('/caixa/ativo')
    return data.data
  },

  async abrirCaixa(saldoInicial: number) {
    const { data } = await api.post<ApiResponse<CaixaAtivo>>('/caixa/abrir', { saldoInicial })
    return data.data
  },

  async fecharCaixa(id: string) {
    const { data } = await api.patch<ApiResponse<CaixaAtivo>>(`/caixa/${id}/fechar`)
    return data.data
  },
}
