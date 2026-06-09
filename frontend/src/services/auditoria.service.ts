import { api } from './api'
import type { LogAuditoria, PaginatedResponse } from '@/types/domain.types'

export interface AuditoriaFiltros {
  pagina?: number
  limite?: number
  acao?: string
  entidade?: string
  usuarioId?: string
  dataInicio?: string
  dataFim?: string
}

export const auditoriaService = {
  async listar(params?: AuditoriaFiltros): Promise<PaginatedResponse<LogAuditoria>> {
    const { data } = await api.get('/auditoria', {
      params: {
        acao: params?.acao || undefined,
        entidade: params?.entidade || undefined,
        usuarioId: params?.usuarioId || undefined,
        dataInicio: params?.dataInicio || undefined,
        dataFim: params?.dataFim || undefined,
        page: params?.pagina,
        limit: params?.limite,
      },
    })
    const r = data.data
    return { data: r.logs, total: r.total, pagina: r.page, limite: r.limit, totalPaginas: r.totalPages }
  },

  async exportarCsv(params?: Omit<AuditoriaFiltros, 'pagina' | 'limite'>): Promise<void> {
    const { data } = await api.get('/auditoria/exportar', {
      params: {
        acao: params?.acao || undefined,
        entidade: params?.entidade || undefined,
        usuarioId: params?.usuarioId || undefined,
        dataInicio: params?.dataInicio || undefined,
        dataFim: params?.dataFim || undefined,
      },
      responseType: 'blob',
    })
    const url = URL.createObjectURL(data)
    const a = document.createElement('a')
    a.href = url
    a.download = `auditoria_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  },
}
