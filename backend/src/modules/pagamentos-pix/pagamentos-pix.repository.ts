import crypto from 'node:crypto'
import { prisma } from '../../database/prisma.client'
import { AppError } from '../../shared/errors'
import { logError, logInfo, hashPassword } from '../../shared/utils'
import { USUARIO_SISTEMA_ID, USUARIO_SISTEMA_EMAIL } from './pagamentos-pix.constants'
import type {
  CobrancaPix,
  CriarCobrancaPixData,
  StatusCobrancaPix,
  WebhookMercadoPago,
  RegistrarWebhookEventoData,
} from './pagamentos-pix.types'

export class PagamentosPixRepository {
  async criarCobranca(data: CriarCobrancaPixData): Promise<CobrancaPix> {
    try {
      return (await prisma.cobrancaPix.create({
        data: {
          mensalidadeId: data.mensalidadeId,
          externalReference: data.externalReference,
          valor: data.valor,
          qrCode: data.qrCode,
          qrCodeBase64: data.qrCodeBase64,
          ticketUrl: data.ticketUrl,
          dataExpiracao: data.dataExpiracao,
        },
      })) as CobrancaPix
    } catch (error) {
      logError('Erro ao criar cobrança PIX', error as Error, { mensalidadeId: data.mensalidadeId })
      throw AppError.internal('Erro ao criar cobrança PIX')
    }
  }

  async buscarPorId(id: string): Promise<CobrancaPix | null> {
    try {
      return (await prisma.cobrancaPix.findUnique({ where: { id } })) as CobrancaPix | null
    } catch (error) {
      logError('Erro ao buscar cobrança PIX por id', error as Error, { id })
      throw AppError.internal('Erro ao buscar cobrança PIX')
    }
  }

  async buscarPorExternalPaymentId(externalPaymentId: string): Promise<CobrancaPix | null> {
    try {
      return (await prisma.cobrancaPix.findUnique({ where: { externalPaymentId } })) as CobrancaPix | null
    } catch (error) {
      logError('Erro ao buscar cobrança PIX por externalPaymentId', error as Error, { externalPaymentId })
      throw AppError.internal('Erro ao buscar cobrança PIX')
    }
  }

  /** Cobrança ainda válida (PENDENTE e não expirada) para reaproveitar em vez de gerar outra. */
  async buscarPendentePorMensalidade(mensalidadeId: string): Promise<CobrancaPix | null> {
    try {
      return (await prisma.cobrancaPix.findFirst({
        where: {
          mensalidadeId,
          status: 'PENDENTE',
          OR: [{ dataExpiracao: null }, { dataExpiracao: { gt: new Date() } }],
        },
        orderBy: { criadoEm: 'desc' },
      })) as CobrancaPix | null
    } catch (error) {
      logError('Erro ao buscar cobrança PIX pendente', error as Error, { mensalidadeId })
      throw AppError.internal('Erro ao buscar cobrança PIX pendente')
    }
  }

  async atualizarAposCriacao(
    id: string,
    data: {
      externalPaymentId: string
      status: StatusCobrancaPix
      statusDetail: string | null
      qrCode: string | null
      qrCodeBase64: string | null
      ticketUrl: string | null
      dataExpiracao: Date | null
    },
  ): Promise<CobrancaPix> {
    try {
      return (await prisma.cobrancaPix.update({ where: { id }, data })) as CobrancaPix
    } catch (error) {
      logError('Erro ao atualizar cobrança PIX após criação no gateway', error as Error, { id })
      throw AppError.internal('Erro ao atualizar cobrança PIX')
    }
  }

  /** Última cobrança PIX da mensalidade, independente do status (usado para o aluno acompanhar o pagamento). */
  async buscarUltimaPorMensalidade(mensalidadeId: string): Promise<CobrancaPix | null> {
    try {
      return (await prisma.cobrancaPix.findFirst({
        where: { mensalidadeId },
        orderBy: { criadoEm: 'desc' },
      })) as CobrancaPix | null
    } catch (error) {
      logError('Erro ao buscar última cobrança PIX da mensalidade', error as Error, { mensalidadeId })
      throw AppError.internal('Erro ao buscar cobrança PIX')
    }
  }

  /** PENDENTE cuja data de expiração já passou — candidatas a EXPIRADO (ver `processarCobrancasExpiradas`). */
  async buscarPendentesExpiradas(limite = 200): Promise<CobrancaPix[]> {
    try {
      return (await prisma.cobrancaPix.findMany({
        where: { status: 'PENDENTE', dataExpiracao: { lt: new Date() } },
        take: limite,
      })) as CobrancaPix[]
    } catch (error) {
      logError('Erro ao buscar cobranças PIX expiradas', error as Error)
      throw AppError.internal('Erro ao buscar cobranças PIX expiradas')
    }
  }

  async atualizarStatus(
    id: string,
    data: { status: StatusCobrancaPix; statusDetail?: string | null; dataAprovacao?: Date | null },
  ): Promise<CobrancaPix> {
    try {
      return (await prisma.cobrancaPix.update({ where: { id }, data })) as CobrancaPix
    } catch (error) {
      logError('Erro ao atualizar status da cobrança PIX', error as Error, { id })
      throw AppError.internal('Erro ao atualizar cobrança PIX')
    }
  }

  async existeEventoProcessado(externalEventId: string): Promise<boolean> {
    try {
      const evento = await prisma.webhookMercadoPago.findUnique({ where: { externalEventId } })
      return !!evento?.processadoComSucesso
    } catch (error) {
      logError('Erro ao verificar evento de webhook', error as Error, { externalEventId })
      throw AppError.internal('Erro ao verificar evento de webhook')
    }
  }

  async registrarEventoWebhook(data: RegistrarWebhookEventoData): Promise<WebhookMercadoPago> {
    try {
      return (await prisma.webhookMercadoPago.upsert({
        where: { externalEventId: data.externalEventId },
        create: {
          externalEventId: data.externalEventId,
          topico: data.topico,
          paymentIdMp: data.paymentIdMp,
          payload: data.payload,
          cobrancaPixId: data.cobrancaPixId ?? null,
        },
        update: {},
      })) as WebhookMercadoPago
    } catch (error) {
      logError('Erro ao registrar evento de webhook', error as Error, { externalEventId: data.externalEventId })
      throw AppError.internal('Erro ao registrar evento de webhook')
    }
  }

  async marcarEventoProcessado(externalEventId: string, sucesso: boolean, erro?: string): Promise<void> {
    try {
      await prisma.webhookMercadoPago.update({
        where: { externalEventId },
        data: { processadoComSucesso: sucesso, erro: erro ?? null },
      })
    } catch (error) {
      logError('Erro ao marcar evento de webhook como processado', error as Error, { externalEventId })
      throw AppError.internal('Erro ao atualizar evento de webhook')
    }
  }
}

export const pagamentosPixRepository = new PagamentosPixRepository()

/** Usuário fixo (INATIVO, sem CPF real) usado como autor de Pagamentos criados automaticamente pelo gateway. */
export async function seedUsuarioSistema(): Promise<void> {
  const existente = await prisma.usuario.findUnique({ where: { id: USUARIO_SISTEMA_ID } })
  if (existente) return

  const senhaAleatoria = crypto.randomBytes(32).toString('hex')
  await prisma.usuario.create({
    data: {
      id: USUARIO_SISTEMA_ID,
      email: USUARIO_SISTEMA_EMAIL,
      senhaHash: await hashPassword(senhaAleatoria),
      nomeCompleto: 'Sistema (Mercado Pago)',
      cpf: '00000000000',
      funcao: 'ADMIN',
      status: 'INATIVO',
    },
  })
  logInfo('Usuário Sistema (Mercado Pago) criado')
}
