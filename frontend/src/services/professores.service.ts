import { api } from './api'
import type { Professor, ApiResponse, PaginatedResponse } from '@/types/domain.types'

export interface CreateProfessorDTO {
  nome: string
  email: string
  senha: string
  telefone?: string
  especialidade?: string
  bio?: string
}

export interface UpdateProfessorDTO {
  nome?: string
  telefone?: string
  especialidade?: string
  bio?: string
  status?: 'ATIVO' | 'INATIVO'
}

export const professoresService = {
  async listar(params?: { pagina?: number; limite?: number; busca?: string }) {
    const { data } = await api.get<ApiResponse<PaginatedResponse<Professor>>>('/professores', { params })
    return data.data
  },

  async buscarPorId(id: string) {
    const { data } = await api.get<ApiResponse<Professor>>(`/professores/${id}`)
    return data.data
  },

  async criar(dto: CreateProfessorDTO) {
    const { data } = await api.post<ApiResponse<Professor>>('/professores', dto)
    return data.data
  },

  async atualizar(id: string, dto: UpdateProfessorDTO) {
    const { data } = await api.put<ApiResponse<Professor>>(`/professores/${id}`, dto)
    return data.data
  },

  async excluir(id: string) {
    await api.delete(`/professores/${id}`)
  },
}
