import { api } from './api'
import type { ApiResponse, AvaliacaoCorporal } from '@/types/domain.types'

export interface ListaAvaliacoesResponse {
  avaliacoes: AvaliacaoCorporal[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface CriarAvaliacaoDTO {
  alunoId: string
  dataAvaliacao: string
  peso?: number | null
  altura?: number | null
  medidas?: Record<string, number> | null
  queixaPrincipal?: string | null
  historicoMedico?: string | null
  observacoesPostura?: string | null
  observacoesGerais?: string | null
  fotos?: Array<{ arquivo: string; tipoArquivo: string }>
}

export type AtualizarAvaliacaoDTO = Omit<CriarAvaliacaoDTO, 'alunoId' | 'fotos'>

export const avaliacoesService = {
  async listar(params: { alunoId?: string; page?: number; limit?: number }): Promise<ListaAvaliacoesResponse> {
    const { data } = await api.get<ApiResponse<ListaAvaliacoesResponse>>('/avaliacoes', { params })
    return data.data
  },

  async listarMinhas(params?: { page?: number; limit?: number }): Promise<ListaAvaliacoesResponse> {
    const { data } = await api.get<ApiResponse<ListaAvaliacoesResponse>>('/aluno/avaliacoes', { params })
    return data.data
  },

  async criar(dto: CriarAvaliacaoDTO): Promise<AvaliacaoCorporal> {
    const { data } = await api.post<ApiResponse<AvaliacaoCorporal>>('/avaliacoes', dto)
    return data.data
  },

  async atualizar(id: string, dto: AtualizarAvaliacaoDTO): Promise<AvaliacaoCorporal> {
    const { data } = await api.put<ApiResponse<AvaliacaoCorporal>>(`/avaliacoes/${id}`, dto)
    return data.data
  },

  async excluir(id: string): Promise<void> {
    await api.delete(`/avaliacoes/${id}`)
  },
}
