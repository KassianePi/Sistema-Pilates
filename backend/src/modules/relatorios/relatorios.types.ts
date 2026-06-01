import type { TipoRelatorio } from '@prisma/client'

export interface Relatorio {
  id: string
  professorId: string
  tipo: TipoRelatorio
  titulo: string
  descricao: string | null
  dataPeriodoInicio: Date
  dataPeriodoFim: Date
  conteudo: string
  criadoEm: Date
  atualizadoEm: Date
  professor?: { id: string; usuario: { nomeCompleto: string } }
}

export interface CreateRelatorioData {
  professorId: string
  tipo: TipoRelatorio
  titulo: string
  descricao?: string | null
  dataPeriodoInicio: Date
  dataPeriodoFim: Date
  conteudo: string
}
