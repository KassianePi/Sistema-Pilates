import type { FastifyRequest, FastifyReply } from 'fastify'
import { avaliacoesService } from './avaliacoes.service'
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
    const avaliacao = await avaliacoesService.criar({ ...(request.body as any), registradoPorId: request.usuarioId! })
    return reply.code(201).send({ success: true, data: avaliacao })
  } catch (error) {
    return handleError(reply, error, 'criar avaliação')
  }
}

export async function listar(request: FastifyRequest, reply: FastifyReply) {
  try {
    const resultado = await avaliacoesService.listar(request.query as any)
    return reply.code(200).send({ success: true, data: resultado })
  } catch (error) {
    return handleError(reply, error, 'listar avaliações')
  }
}

export async function buscarPorId(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }
    const avaliacao = await avaliacoesService.buscarPorId(id)
    return reply.code(200).send({ success: true, data: avaliacao })
  } catch (error) {
    return handleError(reply, error, 'buscar avaliação')
  }
}

export async function atualizar(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }
    const avaliacao = await avaliacoesService.atualizar(id, request.body as any)
    return reply.code(200).send({ success: true, data: avaliacao })
  } catch (error) {
    return handleError(reply, error, 'atualizar avaliação')
  }
}

export async function excluir(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }
    await avaliacoesService.excluir(id)
    return reply.code(200).send({ success: true, data: { message: 'Avaliação excluída com sucesso' } })
  } catch (error) {
    return handleError(reply, error, 'excluir avaliação')
  }
}

// Endpoint do portal do aluno — retorna apenas as avaliações do aluno logado
export async function listarMinhasAvaliacoes(request: FastifyRequest, reply: FastifyReply) {
  try {
    const usuarioId = request.usuarioId!
    const aluno = await prisma.aluno.findUnique({ where: { usuarioId } })
    if (!aluno) {
      return reply.code(403).send({ success: false, message: 'Perfil de aluno não encontrado', code: 'FORBIDDEN' })
    }
    const query = request.query as { page?: string; limit?: string }
    const resultado = await avaliacoesService.listar({
      alunoId: aluno.id,
      page: query.page ? parseInt(query.page) : 1,
      limit: query.limit ? parseInt(query.limit) : 20,
    })
    return reply.code(200).send({ success: true, data: resultado })
  } catch (error) {
    return handleError(reply, error, 'listar avaliações do aluno')
  }
}
