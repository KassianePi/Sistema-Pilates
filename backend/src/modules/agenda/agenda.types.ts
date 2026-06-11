import type { StatusAula, TipoAula, CategoriaAula } from '@prisma/client'

export interface ModalidadeInfo {
  id: string
  nome: string
  descricao: string | null
  ativo: boolean
}

export interface Aula {
  id: string
  professorId: string
  modalidadeId: string | null
  dataHoraInicio: Date
  duracao: number
  capacidade: number
  sala: string
  tipo: TipoAula
  categoria: CategoriaAula
  modalidade: ModalidadeInfo | null
  observacoes: string | null
  status: StatusAula
  criadoEm: Date
  atualizadoEm: Date
  professor?: {
    id: string
    usuario: { nomeCompleto: string; email: string }
  }
  _count?: { presencas: number }
}

export interface CreateAulaData {
  professorId: string
  modalidadeId?: string | null
  dataHoraInicio: Date
  duracao: number
  capacidade: number
  sala: string
  tipo: TipoAula
  categoria?: CategoriaAula
  observacoes?: string | null
}

export interface UpdateAulaData {
  professorId?: string
  modalidadeId?: string | null
  dataHoraInicio?: Date
  duracao?: number
  capacidade?: number
  sala?: string
  tipo?: TipoAula
  categoria?: CategoriaAula
  observacoes?: string | null
  status?: StatusAula
}
