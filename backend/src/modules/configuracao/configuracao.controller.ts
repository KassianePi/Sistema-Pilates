import type { FastifyRequest, FastifyReply } from 'fastify'
import { configuracaoService } from './configuracao.service'

export async function buscarConfiguracao(_request: FastifyRequest, reply: FastifyReply) {
  const config = await configuracaoService.buscar()
  return reply.send({ success: true, data: config ?? {} })
}

export async function salvarConfiguracao(request: FastifyRequest, reply: FastifyReply) {
  const body = request.body as Record<string, unknown>
  const config = await configuracaoService.salvar(body as any, request.usuarioId!)
  return reply.send({ success: true, data: config })
}
