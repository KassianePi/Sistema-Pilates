import { api } from './api'
import type { Aluno, ApiResponse, PaginatedResponse } from '@/types/domain.types'

export interface CreateAlunoDTO {
  nomeCompleto: string
  email: string
  cpf: string
  senha: string
  telefone?: string
  planoId?: string
  dataInicio: string
  dataNascimento?: string
  endereco?: string
  cidade?: string
  estado?: string
  cep?: string
  observacoes?: string
}

export interface UpdateAlunoDTO {
  nomeCompleto?: string
  telefone?: string
  planoId?: string
  dataNascimento?: string
  endereco?: string
  cidade?: string
  estado?: string
  cep?: string
  status?: 'ATIVO' | 'INATIVO'
}

type BackendListResponse = { alunos: Aluno[]; total: number; page: number; limit: number; totalPages: number }

export const alunosService = {
  async listar(params?: { pagina?: number; limite?: number; busca?: string; status?: string }): Promise<PaginatedResponse<Aluno>> {
    const { data } = await api.get<ApiResponse<BackendListResponse>>('/alunos', {
      params: { search: params?.busca, status: params?.status, page: params?.pagina, limit: params?.limite },
    })
    const r = data.data
    return { data: r.alunos, total: r.total, pagina: r.page, limite: r.limit, totalPaginas: r.totalPages }
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
