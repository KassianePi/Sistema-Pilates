import type { StatusAula, TipoAula, ModalidadeAula } from '@prisma/client'

export interface Aula {
  id: string
  professorId: string
  dataHoraInicio: Date
  duracao: number
  capacidade: number
  sala: string
  tipo: TipoAula
  modalidade: ModalidadeAula
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
  dataHoraInicio: Date
  duracao: number
  capacidade: number
  sala: string
  tipo: TipoAula
  modalidade: ModalidadeAula
  observacoes?: string | null
}

export interface UpdateAulaData {
  professorId?: string
  dataHoraInicio?: Date
  duracao?: number
  capacidade?: number
  sala?: string
  tipo?: TipoAula
  modalidade?: ModalidadeAula
  observacoes?: string | null
  status?: StatusAula
}
