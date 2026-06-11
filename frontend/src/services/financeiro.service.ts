import { api } from './api'
import type { Mensalidade, Pagamento, ApiResponse, PaginatedResponse, MetodoPagamento } from '@/types/domain.types'

export interface CreateMensalidadeDTO {
  tipo?: 'MENSAL' | 'AVULSO'
  alunoId: string
  planoId?: string
  valor: number
  vencimento: string
}

export interface CreatePagamentoDTO {
  mensalidadeId: string
  caixaId: string
  valor: number
  metodo: MetodoPagamento
  dataPagamento: string
  observacoes?: string
}

export interface CaixaAtivo {
  id: string
  dataAbertura: string
  saldoAbertura: number
  saldoFechamento?: number
  dataFechamento?: string
  status: 'ABERTO' | 'FECHADO'
}

type BackendMensalidadeRaw = Omit<Mensalidade, 'vencimento'> & { dataVencimento: string }
type BackendPagamentoRaw = Omit<Pagamento, 'metodoPagamento'> & { metodo: MetodoPagamento }
type BackendMensalidadesResponse = { mensalidades: BackendMensalidadeRaw[]; total: number; page: number; limit: number; totalPages: number }
type BackendPagamentosResponse = { pagamentos: BackendPagamentoRaw[]; total: number; page: number; limit: number; totalPages: number }

function mapMensalidade(raw: BackendMensalidadeRaw): Mensalidade {
  return { ...raw, vencimento: raw.dataVencimento, valor: Number(raw.valor) } as Mensalidade
}

function mapPagamento(raw: BackendPagamentoRaw): Pagamento {
  return { ...raw, metodoPagamento: raw.metodo, valor: Number(raw.valor) } as Pagamento
}

export const financeiroService = {
  async listarMensalidades(params?: { pagina?: number; limite?: number; alunoId?: string; status?: string }): Promise<PaginatedResponse<Mensalidade>> {
    const { data } = await api.get<ApiResponse<BackendMensalidadesResponse>>('/mensalidades', {
      params: { alunoId: params?.alunoId, status: params?.status, page: params?.pagina, limit: params?.limite },
    })
    const r = data.data
    return { data: r.mensalidades.map(mapMensalidade), total: r.total, pagina: r.page, limite: r.limit, totalPaginas: r.totalPages }
  },

  async criarMensalidade(dto: CreateMensalidadeDTO) {
    const { data } = await api.post<ApiResponse<BackendMensalidadeRaw>>('/mensalidades', {
      tipo: dto.tipo ?? 'MENSAL',
      alunoId: dto.alunoId,
      planoId: dto.planoId ?? null,
      valor: dto.valor,
      mesReferencia: dto.vencimento,
      dataVencimento: dto.vencimento,
    })
    return mapMensalidade(data.data)
  },

  async listarPagamentos(params?: { pagina?: number; limite?: number }): Promise<PaginatedResponse<Pagamento>> {
    const { data } = await api.get<ApiResponse<BackendPagamentosResponse>>('/pagamentos', {
      params: { page: params?.pagina, limit: params?.limite },
    })
    const r = data.data
    return { data: r.pagamentos.map(mapPagamento), total: r.total, pagina: r.page, limite: r.limit, totalPaginas: r.totalPages }
  },

  async registrarPagamento(dto: CreatePagamentoDTO) {
    const { data } = await api.post<ApiResponse<BackendPagamentoRaw>>('/pagamentos', {
      mensalidadeId: dto.mensalidadeId,
      caixaId: dto.caixaId,
      valor: dto.valor,
      metodo: dto.metodo,
      dataPagamento: dto.dataPagamento,
      observacoes: dto.observacoes,
    })
    return mapPagamento(data.data)
  },

  async buscarCaixaAtivo() {
    const { data } = await api.get<ApiResponse<CaixaAtivo | null>>('/caixa/ativo')
    return data.data
  },

  async abrirCaixa(saldoAbertura: number) {
    const { data } = await api.post<ApiResponse<CaixaAtivo>>('/caixa/abrir', { saldoAbertura })
    return data.data
  },

  async fecharCaixa(id: string, saldoFechamento: number = 0) {
    const { data } = await api.patch<ApiResponse<CaixaAtivo>>(`/caixa/${id}/fechar`, { saldoFechamento })
    return data.data
  },

  async listarMinhasMensalidades(params?: { pagina?: number; limite?: number; status?: string }): Promise<PaginatedResponse<Mensalidade>> {
    const { data } = await api.get<ApiResponse<BackendMensalidadesResponse>>('/aluno/mensalidades', {
      params: { status: params?.status, page: params?.pagina, limit: params?.limite },
    })
    const r = data.data
    return { data: r.mensalidades.map(mapMensalidade), total: r.total, pagina: r.page, limite: r.limit, totalPaginas: r.totalPages }
  },

  async notificarPagamento(mensalidadeId: string, observacoes?: string): Promise<void> {
    await api.post('/aluno/notificar-pagamento', { mensalidadeId, observacoes })
  },

  async solicitarAulaAvulsa(dataDesejada?: string, observacoes?: string): Promise<void> {
    await api.post('/aluno/solicitar-avulsa', { dataDesejada, observacoes })
  },

  async enviarComprovante(dto: { mensalidadeId: string; arquivo: string; nomeArquivo: string; tipoArquivo: string }): Promise<void> {
    await api.post('/aluno/comprovantes', dto)
  },

  async listarMeusComprovantes(): Promise<{ id: string; mensalidadeId: string; nomeArquivo: string; tipoArquivo: string; dataEnvio: string; status: string; observacoes?: string | null; mensalidade?: { plano?: { nome: string } | null } }[]> {
    const { data } = await api.get('/aluno/comprovantes')
    return data.data
  },

  async listarComprovantes(params?: { status?: string; page?: number; limit?: number }) {
    const { data } = await api.get('/comprovantes', { params })
    return data.data as { comprovantes: any[]; total: number; page: number; limit: number; totalPages: number }
  },

  async analisarComprovante(id: string, acao: 'APROVADO' | 'REJEITADO', observacoes?: string): Promise<void> {
    await api.patch(`/comprovantes/${id}/analisar`, { acao, observacoes })
  },
}
