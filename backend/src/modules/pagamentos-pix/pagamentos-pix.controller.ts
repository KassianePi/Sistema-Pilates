import type { FastifyRequest, FastifyReply } from 'fastify'
import { pagamentosPixService } from './pagamentos-pix.service'
import { AppError, ValidationError } from '../../shared/errors'
import { logWarn } from '../../shared/utils'
import { prisma } from '../../database/prisma.client'

function handleError(reply: FastifyReply, error: unknown, acao: string) {
  if (error instanceof ValidationError) {
    return reply.code(400).send({ success: false, message: error.message, code: error.code })
  }
  if (error instanceof AppError) {
    return reply.code(error.statusCode).send({ success: false, message: error.message, code: error.code })
  }
  logWarn(`Erro ao ${acao}`, { error: String(error) })
  return reply.code(500).send({ success: false, message: `Erro ao ${acao}`, code: 'INTERNAL_ERROR' })
}

async function resolverAlunoId(request: FastifyRequest): Promise<string | null> {
  const aluno = await prisma.aluno.findUnique({ where: { usuarioId: request.usuarioId! } })
  return aluno?.id ?? null
}

export async function solicitarCobranca(request: FastifyRequest, reply: FastifyReply) {
  try {
    const alunoId = await resolverAlunoId(request)
    if (!alunoId) {
      return reply.code(403).send({ success: false, message: 'Perfil de aluno não encontrado', code: 'FORBIDDEN' })
    }
    const { mensalidadeId } = request.params as { mensalidadeId: string }
    const cobranca = await pagamentosPixService.solicitarCobranca(alunoId, mensalidadeId)
    return reply.code(201).send({ success: true, data: cobranca })
  } catch (error) {
    return handleError(reply, error, 'gerar cobrança PIX')
  }
}

export async function consultarCobranca(request: FastifyRequest, reply: FastifyReply) {
  try {
    const alunoId = await resolverAlunoId(request)
    if (!alunoId) {
      return reply.code(403).send({ success: false, message: 'Perfil de aluno não encontrado', code: 'FORBIDDEN' })
    }
    const { mensalidadeId } = request.params as { mensalidadeId: string }
    const cobranca = await pagamentosPixService.consultarCobranca(alunoId, mensalidadeId)
    return reply.code(200).send({ success: true, data: cobranca })
  } catch (error) {
    return handleError(reply, error, 'consultar cobrança PIX')
  }
}

export async function sincronizarCobranca(request: FastifyRequest, reply: FastifyReply) {
  try {
    const alunoId = await resolverAlunoId(request)
    if (!alunoId) {
      return reply.code(403).send({ success: false, message: 'Perfil de aluno não encontrado', code: 'FORBIDDEN' })
    }
    const { mensalidadeId } = request.params as { mensalidadeId: string }
    const cobranca = await pagamentosPixService.sincronizarCobranca(alunoId, mensalidadeId)
    return reply.code(200).send({ success: true, data: cobranca })
  } catch (error) {
    return handleError(reply, error, 'sincronizar cobrança PIX')
  }
}

export async function receberWebhookMercadoPago(request: FastifyRequest, reply: FastifyReply) {
  try {
    await pagamentosPixService.processarWebhook({
      headers: request.headers as Record<string, string | string[] | undefined>,
      query: request.query as Record<string, string | string[] | undefined>,
      body: request.body,
    })
    return reply.code(200).send({ success: true })
  } catch (error) {
    if (error instanceof Error && error.name === 'InvalidWebhookSignatureError') {
      logWarn('Webhook Mercado Pago rejeitado: assinatura inválida', { reason: error.message })
      return reply.code(401).send({ success: false, message: 'Assinatura inválida', code: 'INVALID_SIGNATURE' })
    }
    logWarn('Erro ao processar webhook do Mercado Pago', { error: String(error) })
    return reply.code(500).send({ success: false, message: 'Erro ao processar webhook', code: 'INTERNAL_ERROR' })
  }
}
