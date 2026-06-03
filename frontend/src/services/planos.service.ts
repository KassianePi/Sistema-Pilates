import { api } from './api'
import type { Plano, ApiResponse, PaginatedResponse } from '@/types/domain.types'

export interface CreatePlanoDTO {
  nome: string
  descricao?: string
  valor: number
  duracaoMeses: number
  aulasSemanais: number
}

export type UpdatePlanoDTO = Partial<CreatePlanoDTO>

export const planosService = {
  async listar(params?: { pagina?: number; limite?: number; busca?: string }) {
    const { data } = await api.get<ApiResponse<PaginatedResponse<Plano>>>('/planos', { params })
    return data.data
  },

  async buscarPorId(id: string) {
    const { data } = await api.get<ApiResponse<Plano>>(`/planos/${id}`)
    return data.data
  },

  async criar(dto: CreatePlanoDTO) {
    const { data } = await api.post<ApiResponse<Plano>>('/planos', dto)
    return data.data
  },

  async atualizar(id: string, dto: UpdatePlanoDTO) {
    const { data } = await api.put<ApiResponse<Plano>>(`/planos/${id}`, dto)
    return data.data
  },

  async excluir(id: string) {
    await api.delete(`/planos/${id}`)
  },
}
