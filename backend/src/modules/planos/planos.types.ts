import type { TipoPlano, Prisma } from '@prisma/client'

export interface Plano {
  id: string
  nome: string
  descricao: string | null
  tipo: TipoPlano
  aulas: number
  preco: Prisma.Decimal
  ativo: boolean
  criadoEm: Date
  atualizadoEm: Date
}

export interface CreatePlanoData {
  nome: string
  descricao?: string | null
  tipo: TipoPlano
  aulas: number
  preco: number
  ativo?: boolean
}

export interface UpdatePlanoData {
  nome?: string
  descricao?: string | null
  tipo?: TipoPlano
  aulas?: number
  preco?: number
  ativo?: boolean
}
