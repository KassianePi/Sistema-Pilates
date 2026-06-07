import { api } from './api'
import type { LogAuditoria, ApiResponse, PaginatedResponse } from '@/types/domain.types'

type BackendListResponse = { logs: LogAuditoria[]; total: number; page: number; limit: number; totalPages: number }

export const auditoriaService = {
  async listar(params?: { pagina?: number; limite?: number; acao?: string; entidade?: string }): Promise<PaginatedResponse<LogAuditoria>> {
    const { data } = await api.get<ApiResponse<BackendListResponse>>('/auditoria', {
      params: { acao: params?.acao, entidade: params?.entidade, page: params?.pagina, limit: params?.limite },
    })
    const r = data.data
    return { data: r.logs, total: r.total, pagina: r.page, limite: r.limit, totalPaginas: r.totalPages }
  },
}
