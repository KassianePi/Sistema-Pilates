import { api } from './api'
import type { Aluno, ApiResponse, PaginatedResponse } from '@/types/domain.types'

export interface CreateAlunoDTO {
  nome: string
  email: string
  senha: string
  telefone?: string
  planoId?: string
  dataNascimento?: string
  endereco?: string
  cidade?: string
  estado?: string
  cep?: string
}

export interface UpdateAlunoDTO {
  nome?: string
  telefone?: string
  planoId?: string
  dataNascimento?: string
  endereco?: string
  cidade?: string
  estado?: string
  cep?: string
  status?: 'ATIVO' | 'INATIVO'
}

export const alunosService = {
  async listar(params?: { pagina?: number; limite?: number; busca?: string; status?: string }) {
    const { data } = await api.get<ApiResponse<PaginatedResponse<Aluno>>>('/alunos', { params })
    return data.data
  },

  async buscarPorId(id: string) {
    const { data } = await api.get<ApiResponse<Aluno>>(`/alunos/${id}`)
    return data.data
  },

  async criar(dto: CreateAlunoDTO) {
    const { data } = await api.post<ApiResponse<Aluno>>('/alunos', dto)
    return data.data
  },

  async atualizar(id: string, dto: UpdateAlunoDTO) {
    const { data } = await api.put<ApiResponse<Aluno>>(`/alunos/${id}`, dto)
    return data.data
  },

  async excluir(id: string) {
    await api.delete(`/alunos/${id}`)
  },
}
