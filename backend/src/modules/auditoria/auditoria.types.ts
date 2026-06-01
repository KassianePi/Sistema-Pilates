import type { TipoAcao } from '@prisma/client'

export interface LogAuditoria {
  id: string
  usuarioId: string
  acao: TipoAcao
  entidade: string
  entidadeId: string
  dadosAntigos: string | null
  dadosNovos: string | null
  enderecoIp: string | null
  userAgent: string | null
  criadoEm: Date
  usuario?: { id: string; nomeCompleto: string; email: string }
}

export interface CreateLogAuditoriaData {
  usuarioId: string
  acao: TipoAcao
  entidade: string
  entidadeId: string
  dadosAntigos?: object | null
  dadosNovos?: object | null
  enderecoIp?: string | null
  userAgent?: string | null
}
