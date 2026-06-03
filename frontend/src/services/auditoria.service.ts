import { api } from './api'
import type { LogAuditoria, ApiResponse, PaginatedResponse } from '@/types/domain.types'

export const auditoriaService = {
  async listar(params?: { pagina?: number; limite?: number; acao?: string; entidade?: string }) {
    const { data } = await api.get<ApiResponse<PaginatedResponse<LogAuditoria>>>('/auditoria', { params })
    return data.data
  },
}
