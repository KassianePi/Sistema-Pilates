import { api } from './api'
import type { Modalidade, ApiResponse } from '@/types/domain.types'

function mapModalidade(raw: Modalidade): Modalidade {
  return { ...raw, valor: raw.valor != null ? Number(raw.valor) : null }
}

export const modalidadesService = {
  async listar(apenasAtivos?: boolean): Promise<Modalidade[]> {
    const { data } = await api.get<ApiResponse<Modalidade[]>>('/modalidades', {
      params: apenasAtivos ? { apenasAtivos: 'true' } : undefined,
    })
    return data.data.map(mapModalidade)
  },

  async criar(dto: { nome: string; descricao?: string | null; valor?: number | null }): Promise<Modalidade> {
    const { data } = await api.post<ApiResponse<Modalidade>>('/modalidades', dto)
    return mapModalidade(data.data)
  },

  async atualizar(
    id: string,
    dto: { nome?: string; descricao?: string | null; valor?: number | null; ativo?: boolean },
  ): Promise<Modalidade> {
    const { data } = await api.put<ApiResponse<Modalidade>>(`/modalidades/${id}`, dto)
    return mapModalidade(data.data)
  },

  async excluir(id: string): Promise<void> {
    await api.delete(`/modalidades/${id}`)
  },
}
