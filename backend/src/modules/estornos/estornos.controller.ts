import type { FastifyRequest, FastifyReply } from 'fastify'
import { estornosService } from './estornos.service'
import { prisma } from '../../database/prisma.client'

export async function solicitarEstorno(request: FastifyRequest, reply: FastifyReply) {
  const alunoId = request.usuarioId!
  const body = request.body as { mensalidadeId: string; motivo?: string | null }
  const estorno = await estornosService.solicitar(alunoId, body)
  return reply.status(201).send({ success: true, data: estorno })
}

export async function listarEstornos(request: FastifyRequest, reply: FastifyReply) {
  const query = request.query as { alunoId?: string; status?: string; page?: string; limit?: string }
  const result = await estornosService.listar({
    alunoId: query.alunoId,
    status: query.status,
    page: query.page ? parseInt(query.page) : undefined,
    limit: query.limit ? parseInt(query.limit) : undefined,
  })
  return reply.send({ success: true, ...result })
}

export async function buscarEstorno(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  const estorno = await estornosService.buscarPorId(id)
  return reply.send({ success: true, data: estorno })
}

export async function aprovarEstorno(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  const estorno = await estornosService.aprovar(id, request.usuarioId!)
  return reply.send({ success: true, data: estorno })
}

export async function negarEstorno(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  const estorno = await estornosService.negar(id, request.usuarioId!)
  return reply.send({ success: true, data: estorno })
}

export async function processarEstorno(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  const estorno = await estornosService.marcarProcessado(id, request.usuarioId!)
  return reply.send({ success: true, data: estorno })
}

export async function listarMeusEstornos(request: FastifyRequest, reply: FastifyReply) {
  const usuarioId = request.usuarioId!
  const aluno = await prisma.aluno.findUnique({ where: { usuarioId } })
  if (!aluno) {
    return reply.code(403).send({ success: false, message: 'Perfil de aluno não encontrado', code: 'FORBIDDEN' })
  }
  const query = request.query as { page?: string; limit?: string }
  const result = await estornosService.listar({
    alunoId: aluno.id,
    page: query.page ? parseInt(query.page) : 1,
    limit: query.limit ? parseInt(query.limit) : 20,
  })
  return reply.send({ success: true, ...result })
}
