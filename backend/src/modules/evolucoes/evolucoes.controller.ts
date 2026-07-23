import type { FastifyRequest, FastifyReply } from 'fastify'
import { evolucoesService } from './evolucoes.service'
import { AppError, ValidationError } from '../../shared/errors'
import { logWarn } from '../../shared/utils'
import { prisma } from '../../database/prisma.client'

function handleError(reply: FastifyReply, error: unknown, acao: string) {
  if (error instanceof ValidationError) {
    return reply.code(400).send({ success: false, message: error.message, code: error.code })
  }
  if (error instanceof Error && error.name === 'ZodError') {
    const validationError = ValidationError.fromZod(error)
    return reply.code(400).send({ success: false, message: validationError.message, code: validationError.code })
  }
  if (error instanceof AppError) {
    return reply.code(error.statusCode).send({ success: false, message: error.message, code: error.code })
  }
  logWarn(`Erro ao ${acao}`, { error: String(error) })
  return reply.code(500).send({ success: false, message: `Erro ao ${acao}`, code: 'INTERNAL_ERROR' })
}

export async function criar(request: FastifyRequest, reply: FastifyReply) {
  try {
    const evolucao = await evolucoesService.criar({ ...(request.body as any), registradoPorId: request.usuarioId! })
    return reply.code(201).send({ success: true, data: evolucao })
  } catch (error) {
    return handleError(reply, error, 'registrar evolução')
  }
}

export async function listar(request: FastifyRequest, reply: FastifyReply) {
  try {
    const resultado = await evolucoesService.listar(request.query as any)
    return reply.code(200).send({ success: true, data: resultado })
  } catch (error) {
    return handleError(reply, error, 'listar evoluções')
  }
}

export async function buscarPorId(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }
    const evolucao = await evolucoesService.buscarPorId(id)
    return reply.code(200).send({ success: true, data: evolucao })
  } catch (error) {
    return handleError(reply, error, 'buscar evolução')
  }
}

export async function atualizar(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }
    const evolucao = await evolucoesService.atualizar(id, request.body as any)
    return reply.code(200).send({ success: true, data: evolucao })
  } catch (error) {
    return handleError(reply, error, 'atualizar evolução')
  }
}

export async function excluir(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }
    await evolucoesService.excluir(id)
    return reply.code(200).send({ success: true, data: { message: 'Evolução excluída com sucesso' } })
  } catch (error) {
    return handleError(reply, error, 'excluir evolução')
  }
}

// Endpoint do portal do aluno — retorna apenas as evoluções do aluno logado
export async function listarMinhasEvolucoes(request: FastifyRequest, reply: FastifyReply) {
  try {
    const usuarioId = request.usuarioId!
    const aluno = await prisma.aluno.findUnique({ where: { usuarioId } })
    if (!aluno) {
      return reply.code(403).send({ success: false, message: 'Perfil de aluno não encontrado', code: 'FORBIDDEN' })
    }
    const query = request.query as { page?: string; limit?: string }
    const resultado = await evolucoesService.listar({
      alunoId: aluno.id,
      page: query.page ? parseInt(query.page) : 1,
      limit: query.limit ? parseInt(query.limit) : 20,
    })
    return reply.code(200).send({ success: true, data: resultado })
  } catch (error) {
    return handleError(reply, error, 'listar evoluções do aluno')
  }
}
