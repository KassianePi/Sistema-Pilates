import type { StatusMensalidade } from '@prisma/client'
export interface UpdateMensalidadeDTO {
  dataVencimento?: string
  valor?: number
  desconto?: number
  status?: StatusMensalidade
  observacoes?: string | null
}
