import { api } from './api'

export interface MeuPerfil {
  id: string
  nome: string
  email: string
  telefone: string | null
  funcao: string
  cpf: string
  // Professor
  professorId?: string | null
  especialidade?: string | null
  bio?: string | null
  // Aluno
  alunoId?: string | null
  plano?: string | null
  aulasPlano?: number | null
  dataInicio?: string | null
  statusMatricula?: string | null
  modalidade?: string | null
  categoria?: string | null
  professorPrincipal?: string | null
}

export interface AtualizarPerfilData {
  nomeCompleto?: string
  telefone?: string | null
  bio?: string | null
  especialidade?: string | null
}

export const meService = {
  async getMeuPerfil(): Promise<MeuPerfil> {
    const { data } = await api.get('/me')
    return data.data
  },

  async atualizarMeuPerfil(dados: AtualizarPerfilData): Promise<MeuPerfil> {
    const { data } = await api.put('/me', dados)
    return data.data
  },
}
