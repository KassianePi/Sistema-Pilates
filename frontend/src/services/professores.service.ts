import { api } from './api'
import type { Professor, ApiResponse, PaginatedResponse } from '@/types/domain.types'

export interface CreateProfessorDTO {
  nomeCompleto: string
  email: string
  cpf: string
  senha: string
  telefone?: string
  especialidade?: string
  bio?: string
}

export interface UpdateProfessorDTO {
  nomeCompleto?: string
  telefone?: string
  especialidade?: string
  bio?: string
  status?: 'ATIVO' | 'INATIVO'
}

type BackendListResponse = { professores: Professor[]; total: number; page: number; limit: number; totalPages: number }

export const professoresService = {
  async listar(params?: { pagina?: number; limite?: number; busca?: string }): Promise<PaginatedResponse<Professor>> {
    const { data } = await api.get<ApiResponse<BackendListResponse>>('/professores', {
      params: { search: params?.busca, page: params?.pagina, limit: params?.limite },
    })
    const r = data.data
    return { data: r.professores, total: r.total, pagina: r.page, limite: r.limit, totalPaginas: r.totalPages }
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
