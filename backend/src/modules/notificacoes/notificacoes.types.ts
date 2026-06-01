import type { TipoNotificacao, StatusNotificacao } from '@prisma/client'

export interface Notificacao {
  id: string
  usuarioId: string
  tipo: TipoNotificacao
  titulo: string
  mensagem: string
  status: StatusNotificacao
  dataLeitura: Date | null
  criadoEm: Date
}

export interface CreateNotificacaoData {
  usuarioId: string
  tipo: TipoNotificacao
  titulo: string
  mensagem: string
}
