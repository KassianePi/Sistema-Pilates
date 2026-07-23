import type { FastifyRequest, FastifyReply } from 'fastify'
import { mensalidadesAutomaticasService } from './mensalidades-automaticas.service'
import { logWarn } from '../../shared/utils'

export async function gerarMensalidadesManualmente(request: FastifyRequest, reply: FastifyReply) {
  try {
    const query = request.query as { dryRun?: string }
    const dryRun = query.dryRun === 'true'
    const resumo = await mensalidadesAutomaticasService.executarGeracao('MANUAL', {
      executadoPorId: request.usuarioId!,
      dryRun,
    })
    return reply.code(200).send({ success: true, data: resumo })
  } catch (error) {
    logWarn('Erro ao executar geração automática de mensalidades manualmente', { error: String(error) })
    return reply
      .code(500)
      .send({ success: false, message: 'Erro ao executar geração automática de mensalidades', code: 'INTERNAL_ERROR' })
  }
}

export async function buscarStatusExecucaoAtual(_request: FastifyRequest, reply: FastifyReply) {
  try {
    const status = await mensalidadesAutomaticasService.buscarStatusExecucaoAtual()
    return reply.code(200).send({ success: true, data: status })
  } catch (error) {
    logWarn('Erro ao buscar status da geração automática de mensalidades', { error: String(error) })
    return reply
      .code(500)
      .send({ success: false, message: 'Erro ao buscar status da execução', code: 'INTERNAL_ERROR' })
  }
}
