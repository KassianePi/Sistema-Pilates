import { api } from './api'
import type { ApiResponse, Reposicao, StatusReposicao } from '@/types/domain.types'

export interface ListaReposicoesResponse {
  reposicoes: Reposicao[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export const reposicoesService = {
  async solicitar(dto: { aulaOriginalId: string; motivo: string }): Promise<Reposicao> {
    const { data } = await api.post<ApiResponse<Reposicao>>('/aluno/reposicoes', dto)
    return data.data
  },

  async listarMinhas(params?: { status?: StatusReposicao; page?: number; limit?: number }) {
    const { data } = await api.get<ApiResponse<ListaReposicoesResponse>>('/aluno/reposicoes', { params })
    return data.data
  },

  async cancelarMinha(id: string): Promise<Reposicao> {
    const { data } = await api.patch<ApiResponse<Reposicao>>(`/aluno/reposicoes/${id}/cancelar`)
    return data.data
  },

  async listar(params?: { status?: StatusReposicao; alunoId?: string; page?: number; limit?: number }) {
    const { data } = await api.get<ApiResponse<ListaReposicoesResponse>>('/reposicoes', { params })
    return data.data
  },

  async agendar(id: string, aulaReposicaoId: string): Promise<Reposicao> {
    const { data } = await api.patch<ApiResponse<Reposicao>>(`/reposicoes/${id}/agendar`, { aulaReposicaoId })
    return data.data
  },

  async cancelar(id: string): Promise<Reposicao> {
    const { data } = await api.patch<ApiResponse<Reposicao>>(`/reposicoes/${id}/cancelar`)
    return data.data
  },
}
