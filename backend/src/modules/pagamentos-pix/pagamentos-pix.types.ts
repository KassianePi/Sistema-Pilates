import type { StatusCobrancaPix, Prisma } from '@prisma/client'

export type { StatusCobrancaPix }

export interface CobrancaPix {
  id: string
  mensalidadeId: string
  gateway: string
  externalPaymentId: string | null
  externalReference: string
  status: StatusCobrancaPix
  statusDetail: string | null
  valor: Prisma.Decimal
  qrCode: string | null
  qrCodeBase64: string | null
  ticketUrl: string | null
  dataExpiracao: Date | null
  dataAprovacao: Date | null
  criadoEm: Date
  atualizadoEm: Date
  mensalidade?: { id: string; alunoId: string; status: string }
}

export interface CriarCobrancaPixData {
  mensalidadeId: string
  externalReference: string
  valor: number
  qrCode: string | null
  qrCodeBase64: string | null
  ticketUrl: string | null
  dataExpiracao: Date | null
}

export interface WebhookMercadoPago {
  id: string
  cobrancaPixId: string | null
  externalEventId: string
  topico: string
  paymentIdMp: string | null
  payload: Prisma.JsonValue
  processadoComSucesso: boolean
  erro: string | null
  recebidoEm: Date
}

export interface RegistrarWebhookEventoData {
  externalEventId: string
  topico: string
  paymentIdMp: string | null
  payload: Prisma.InputJsonValue
  cobrancaPixId?: string | null
}
