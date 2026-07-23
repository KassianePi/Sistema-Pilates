import type { Prisma } from '@prisma/client'

export interface AvaliacaoFoto {
  id: string
  avaliacaoId: string
  arquivo: string
  tipoArquivo: string
  criadoEm: Date
}

export interface AvaliacaoCorporal {
  id: string
  alunoId: string
  registradoPorId: string
  dataAvaliacao: Date
  peso: Prisma.Decimal | null
  altura: Prisma.Decimal | null
  medidas: Prisma.JsonValue | null
  queixaPrincipal: string | null
  historicoMedico: string | null
  observacoesPostura: string | null
  observacoesGerais: string | null
  criadoEm: Date
  atualizadoEm: Date
  fotos?: AvaliacaoFoto[]
}

export interface CreateAvaliacaoData {
  alunoId: string
  registradoPorId: string
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

export interface UpdateAvaliacaoData {
  dataAvaliacao?: string
  peso?: number | null
  altura?: number | null
  medidas?: Record<string, number> | null
  queixaPrincipal?: string | null
  historicoMedico?: string | null
  observacoesPostura?: string | null
  observacoesGerais?: string | null
}
