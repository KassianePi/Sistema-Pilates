import type { FastifyRequest, FastifyReply } from 'fastify'
import { notificacoesService } from './notificacoes.service'
import { logWarn } from '../../shared/utils'

export async function listar(request: FastifyRequest, reply: FastifyReply) {
  try {
    const usuarioId = request.usuarioId as string
    const resultado = await notificacoesService.listar(usuarioId, request.query as any)
    return reply.code(200).send({ success: true, data: resultado })
  } catch (error) {
    logWarn('Erro ao listar notificações', { error: String(error) })
    return reply.code(500).send({ success: false, message: 'Erro ao listar notificações', code: 'INTERNAL_ERROR' })
  }
}

export async function marcarComoLida(request: FastifyRequest, reply: FastifyReply) {
  try {
    const usuarioId = request.usuarioId as string
    const { id } = request.params as { id: string }
    const notificacao = await notificacoesService.marcarComoLida(id, usuarioId)
    return reply.code(200).send({ success: true, data: notificacao })
  } catch (error: any) {
    if (error?.statusCode === 404) return reply.code(404).send({ success: false, message: error.message, code: 'NOT_FOUND' })
    logWarn('Erro ao marcar notificação', { error: String(error) })
    return reply.code(500).send({ success: false, message: 'Erro ao atualizar notificação', code: 'INTERNAL_ERROR' })
  }
}

export async function arquivar(request: FastifyRequest, reply: FastifyReply) {
  try {
    const usuarioId = request.usuarioId as string
    const { id } = request.params as { id: string }
    const notificacao = await notificacoesService.arquivar(id, usuarioId)
    return reply.code(200).send({ success: true, data: notificacao })
  } catch (error: any) {
    if (error?.statusCode === 404) return reply.code(404).send({ success: false, message: error.message, code: 'NOT_FOUND' })
    logWarn('Erro ao arquivar notificação', { error: String(error) })
    return reply.code(500).send({ success: false, message: 'Erro ao arquivar notificação', code: 'INTERNAL_ERROR' })
  }
}
