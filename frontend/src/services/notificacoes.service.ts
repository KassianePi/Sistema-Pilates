import { api } from './api'
import type { Notificacao, TipoNotificacao, ApiResponse } from '@/types/domain.types'

interface BackendNotificacao {
  id: string
  usuarioId: string
  tipo: TipoNotificacao
  titulo: string
  mensagem: string
  status: 'NAO_LIDA' | 'LIDA' | 'ARQUIVADA'
  dataLeitura: string | null
  criadoEm: string
}

interface BackendListResponse {
  notificacoes: BackendNotificacao[]
  total: number
  naoLidas: number
  page: number
  limit: number
  totalPages: number
}

export interface NotificacoesResult {
  data: Notificacao[]
  naoLidas: number
  total: number
  pagina: number
  limite: number
  totalPaginas: number
}

function mapNotificacao(raw: BackendNotificacao): Notificacao {
  return {
    id: raw.id,
    usuarioId: raw.usuarioId,
    tipo: raw.tipo,
    titulo: raw.titulo,
    mensagem: raw.mensagem,
    lida: raw.status !== 'NAO_LIDA',
    arquivada: raw.status === 'ARQUIVADA',
    createdAt: raw.criadoEm,
  }
}

export const notificacoesService = {
  async listar(params?: { pagina?: number; limite?: number; status?: 'NAO_LIDA' | 'LIDA' | 'ARQUIVADA' }): Promise<NotificacoesResult> {
    const { data } = await api.get<ApiResponse<BackendListResponse>>('/notificacoes', {
      params: { page: params?.pagina, limit: params?.limite, status: params?.status },
    })
    const r = data.data
    return {
      data: r.notificacoes.map(mapNotificacao),
      naoLidas: r.naoLidas,
      total: r.total,
      pagina: r.page,
      limite: r.limit,
      totalPaginas: r.totalPages,
    }
  },

  async marcarLida(id: string) {
    const { data } = await api.patch<ApiResponse<BackendNotificacao>>(`/notificacoes/${id}/ler`)
    return mapNotificacao(data.data)
  },

  async arquivar(id: string) {
    const { data } = await api.patch<ApiResponse<BackendNotificacao>>(`/notificacoes/${id}/arquivar`)
    return mapNotificacao(data.data)
  },
}
