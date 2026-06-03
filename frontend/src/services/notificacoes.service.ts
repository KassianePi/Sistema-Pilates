import { api } from './api'
import type { Notificacao, ApiResponse, PaginatedResponse } from '@/types/domain.types'

export const notificacoesService = {
  async listar(params?: { pagina?: number; limite?: number; lida?: boolean }) {
    const { data } = await api.get<ApiResponse<PaginatedResponse<Notificacao>>>('/notificacoes', { params })
    return data.data
  },

  async marcarLida(id: string) {
    const { data } = await api.patch<ApiResponse<Notificacao>>(`/notificacoes/${id}/ler`)
    return data.data
  },

  async arquivar(id: string) {
    const { data } = await api.patch<ApiResponse<Notificacao>>(`/notificacoes/${id}/arquivar`)
    return data.data
  },
}
