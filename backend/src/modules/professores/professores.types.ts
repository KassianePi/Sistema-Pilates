import type { StatusProfessor } from '@prisma/client'

export interface Professor {
  id: string
  usuarioId: string
  especialidade: string | null
  bio: string | null
  status: StatusProfessor
  criadoEm: Date
  atualizadoEm: Date
  usuario?: {
    id: string
    nomeCompleto: string
    email: string
    telefone: string | null
    cpf: string
  }
}

export interface CreateProfessorData {
  email: string
  nomeCompleto: string
  cpf: string
  telefone?: string | null
  senhaHash: string
  especialidade?: string | null
  bio?: string | null
}

export interface UpdateProfessorData {
  nomeCompleto?: string
  telefone?: string | null
  especialidade?: string | null
  bio?: string | null
  status?: StatusProfessor
}
