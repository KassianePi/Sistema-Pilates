import type { FastifyRequest, FastifyReply } from 'fastify'
import { modalidadesService } from './modalidades.service'
import { AppError } from '../../shared/errors'
import { logWarn } from '../../shared/utils'

function handleError(reply: FastifyReply, error: unknown) {
  if (error instanceof AppError) {
    return reply.code(error.statusCode).send({ success: false, message: error.message, code: error.code })
  }
  logWarn('Erro inesperado em modalidades', { error: String(error) })
  return reply.code(500).send({ success: false, message: 'Erro interno', code: 'INTERNAL_ERROR' })
}

export async function listarModalidades(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { apenasAtivos } = request.query as { apenasAtivos?: string }
    const modalidades = await modalidadesService.listar(apenasAtivos === 'true')
    return reply.code(200).send({ success: true, data: modalidades })
  } catch (error) {
    return handleError(reply, error)
  }
}

export async function buscarModalidade(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }
    const m = await modalidadesService.buscarPorId(id)
    return reply.code(200).send({ success: true, data: m })
  } catch (error) {
    return handleError(reply, error)
  }
}

export async function criarModalidade(request: FastifyRequest, reply: FastifyReply) {
  try {
    const m = await modalidadesService.criar(request.body as any)
    return reply.code(201).send({ success: true, data: m })
  } catch (error) {
    return handleError(reply, error)
  }
}

export async function atualizarModalidade(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }
    const m = await modalidadesService.atualizar(id, request.body as any)
    return reply.code(200).send({ success: true, data: m })
  } catch (error) {
    return handleError(reply, error)
  }
}

export async function excluirModalidade(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }
    await modalidadesService.excluir(id)
    return reply.code(200).send({ success: true, data: { message: 'Modalidade excluída com sucesso' } })
  } catch (error) {
    return handleError(reply, error)
  }
}
