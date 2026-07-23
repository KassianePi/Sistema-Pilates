import { api } from './api'
import type { ApiResponse, EvolucaoAula } from '@/types/domain.types'

export interface ListaEvolucoesResponse {
  evolucoes: EvolucaoAula[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export const evolucoesService = {
  async listar(params: { alunoId?: string; aulaId?: string; page?: number; limit?: number }) {
    const { data } = await api.get<ApiResponse<ListaEvolucoesResponse>>('/evolucoes', { params })
    return data.data
  },

  async listarMinhas(params?: { page?: number; limit?: number }) {
    const { data } = await api.get<ApiResponse<ListaEvolucoesResponse>>('/aluno/evolucoes', { params })
    return data.data
  },

  async criar(dto: { alunoId: string; aulaId: string; observacao: string }): Promise<EvolucaoAula> {
    const { data } = await api.post<ApiResponse<EvolucaoAula>>('/evolucoes', dto)
    return data.data
  },
}
