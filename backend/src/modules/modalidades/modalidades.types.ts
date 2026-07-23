import type { Prisma } from '@prisma/client'

export interface Modalidade {
  id: string
  nome: string
  descricao: string | null
  valor: Prisma.Decimal | null
  ativo: boolean
  criadoEm: Date
  atualizadoEm: Date
}
