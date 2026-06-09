import { api } from './api'
import type { ApiResponse, Presenca } from '@/types/domain.types'

export interface BatchPresencaDTO {
  aulaId: string
  presencas: Array<{ alunoId: string; status: 'PRESENTE' | 'AUSENTE' | 'JUSTIFICADO' }>
}

export const presencaService = {
  async registrarBatch(dto: BatchPresencaDTO): Promise<{ registros: number; aulaStatus: string }> {
    const { data } = await api.post<ApiResponse<{ registros: number; aulaStatus: string }>>('/presencas/batch', dto)
    return data.data
  },

  async listar(params?: { aulaId?: string; alunoId?: string; status?: string; page?: number; limit?: number }) {
    const { data } = await api.get<ApiResponse<{ presencas: Presenca[]; total: number; page: number; limit: number; totalPages: number }>>('/presencas', { params })
    return data.data
  },
}
