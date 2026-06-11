import { api } from './api'
import type { Modalidade, ApiResponse } from '@/types/domain.types'

export const modalidadesService = {
  async listar(apenasAtivos?: boolean): Promise<Modalidade[]> {
    const { data } = await api.get<ApiResponse<Modalidade[]>>('/modalidades', {
      params: apenasAtivos ? { apenasAtivos: 'true' } : undefined,
    })
    return data.data
  },

  async criar(dto: { nome: string; descricao?: string | null }): Promise<Modalidade> {
    const { data } = await api.post<ApiResponse<Modalidade>>('/modalidades', dto)
    return data.data
  },

  async atualizar(id: string, dto: { nome?: string; descricao?: string | null; ativo?: boolean }): Promise<Modalidade> {
    const { data } = await api.put<ApiResponse<Modalidade>>(`/modalidades/${id}`, dto)
    return data.data
  },

  async excluir(id: string): Promise<void> {
    await api.delete(`/modalidades/${id}`)
  },
}
