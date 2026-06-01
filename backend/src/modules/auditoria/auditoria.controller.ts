import type { FastifyRequest, FastifyReply } from 'fastify'
import { auditoriaService } from './auditoria.service'
import { logWarn } from '../../shared/utils'

export async function listar(request: FastifyRequest, reply: FastifyReply) {
  try {
    const resultado = await auditoriaService.listar(request.query as any)
    return reply.code(200).send({ success: true, data: resultado })
  } catch (error) {
    logWarn('Erro ao listar auditoria', { error: String(error) })
    return reply.code(500).send({ success: false, message: 'Erro ao listar auditoria', code: 'INTERNAL_ERROR' })
  }
}
