import type { StatusAluno } from '@prisma/client'

export interface Aluno {
  id: string
  usuarioId: string
  planoId: string | null
  dataInicio: Date
  dataNascimento: Date | null
  ultimoAcesso: Date | null
  endereco: string | null
  cidade: string | null
  estado: string | null
  cep: string | null
  observacoes: string | null
  status: StatusAluno
  criadoEm: Date
  atualizadoEm: Date
  usuario?: {
    id: string
    nomeCompleto: string
    email: string
    telefone: string | null
    cpf: string
  }
  planoAtual?: {
    id: string
    nome: string
    tipo: string
    aulas: number
    preco: string
  } | null
}

export interface CreateAlunoData {
  email: string
  nomeCompleto: string
  cpf: string
  telefone?: string | null
  senhaHash: string
  planoId?: string | null
  dataInicio: Date
  dataNascimento?: Date | null
  endereco?: string | null
  cidade?: string | null
  estado?: string | null
  cep?: string | null
  observacoes?: string | null
}

export interface UpdateAlunoData {
  nomeCompleto?: string
  email?: string
  senhaHash?: string
  telefone?: string | null
  planoId?: string | null
  dataNascimento?: Date | null
  endereco?: string | null
  cidade?: string | null
  estado?: string | null
  cep?: string | null
  observacoes?: string | null
  status?: StatusAluno
}
