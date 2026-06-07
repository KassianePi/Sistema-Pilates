import { api } from './api'
import type { ApiResponse, UserRole } from '@/types/domain.types'

export interface UsuarioSistema {
  id: string
  nome: string
  email: string
  telefone?: string | null
  funcao: UserRole
  status: 'ATIVO' | 'INATIVO'
  cpf: string
  criadoEm: string
}

export interface CreateUsuarioDTO {
  nome: string
  email: string
  cpf: string
  telefone?: string
  senha: string
  senhaConfirmacao: string
  funcao: Exclude<UserRole, 'ALUNO'>
}

export interface UpdateUsuarioDTO {
  nomeCompleto?: string
  telefone?: string | null
}

type BackendUsuario = {
  id: string
  nomeCompleto: string
  email: string
  telefone: string | null
  funcao: string
  status: string
  cpf: string
  criadoEm: string
}

type ListarResponse = {
  usuarios: BackendUsuario[]
  total: number
  page: number
  limit: number
  totalPages: number
}

function mapUsuario(raw: BackendUsuario): UsuarioSistema {
  return {
    id: raw.id,
    nome: raw.nomeCompleto,
    email: raw.email,
    telefone: raw.telefone,
    funcao: raw.funcao as UserRole,
    status: raw.status as 'ATIVO' | 'INATIVO',
    cpf: raw.cpf,
    criadoEm: raw.criadoEm,
  }
}

export const usuariosService = {
  async listar(params?: { page?: number; limit?: number; funcao?: string }): Promise<{ data: UsuarioSistema[]; total: number; totalPages: number }> {
    const { data } = await api.get<ApiResponse<ListarResponse>>('/usuarios', { params })
    const r = data.data
    return { data: r.usuarios.map(mapUsuario), total: r.total, totalPages: r.totalPages }
  },

  async criar(dto: CreateUsuarioDTO): Promise<void> {
    await api.post('/auth/register', {
      email: dto.email,
      nome: dto.nome,
      cpf: dto.cpf,
      telefone: dto.telefone,
      senha: dto.senha,
      senhaConfirmacao: dto.senhaConfirmacao,
      funcao: dto.funcao,
    })
  },

  async atualizar(id: string, dto: UpdateUsuarioDTO): Promise<UsuarioSistema> {
    const { data } = await api.put<ApiResponse<BackendUsuario>>(`/usuarios/${id}`, dto)
    return mapUsuario(data.data)
  },

  async alterarStatus(id: string, ativo: boolean): Promise<void> {
    await api.patch(`/usuarios/${id}/status`, { ativo })
  },
}
