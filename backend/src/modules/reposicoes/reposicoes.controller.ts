import type { FastifyRequest, FastifyReply } from 'fastify'
import { reposicoesService } from './reposicoes.service'
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

async function resolverAlunoId(request: FastifyRequest): Promise<string | null> {
  const aluno = await prisma.aluno.findUnique({ where: { usuarioId: request.usuarioId! } })
  return aluno?.id ?? null
}

// Portal do aluno — solicitar reposição de uma aula perdida
export async function solicitar(request: FastifyRequest, reply: FastifyReply) {
  try {
    const alunoId = await resolverAlunoId(request)
    if (!alunoId) {
      return reply.code(403).send({ success: false, message: 'Perfil de aluno não encontrado', code: 'FORBIDDEN' })
    }
    const reposicao = await reposicoesService.solicitar({ ...(request.body as any), alunoId })
    return reply.code(201).send({ success: true, data: reposicao })
  } catch (error) {
    return handleError(reply, error, 'solicitar reposição')
  }
}

// Portal do aluno — lista as próprias reposições
export async function listarMinhasReposicoes(request: FastifyRequest, reply: FastifyReply) {
  try {
    const alunoId = await resolverAlunoId(request)
    if (!alunoId) {
      return reply.code(403).send({ success: false, message: 'Perfil de aluno não encontrado', code: 'FORBIDDEN' })
    }
    const query = request.query as { page?: string; limit?: string; status?: string }
    const resultado = await reposicoesService.listar({
      alunoId,
      status: query.status as any,
      page: query.page ? parseInt(query.page) : 1,
      limit: query.limit ? parseInt(query.limit) : 20,
    })
    return reply.code(200).send({ success: true, data: resultado })
  } catch (error) {
    return handleError(reply, error, 'listar reposições')
  }
}

export async function listar(request: FastifyRequest, reply: FastifyReply) {
  try {
    const resultado = await reposicoesService.listar(request.query as any)
    return reply.code(200).send({ success: true, data: resultado })
  } catch (error) {
    return handleError(reply, error, 'listar reposições')
  }
}

export async function buscarPorId(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }
    const reposicao = await reposicoesService.buscarPorId(id)
    return reply.code(200).send({ success: true, data: reposicao })
  } catch (error) {
    return handleError(reply, error, 'buscar reposição')
  }
}

export async function agendar(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }
    const reposicao = await reposicoesService.agendar(id, request.body as any)
    return reply.code(200).send({ success: true, data: reposicao })
  } catch (error) {
    return handleError(reply, error, 'agendar reposição')
  }
}

export async function cancelar(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }
    const reposicao = await reposicoesService.cancelar(id)
    return reply.code(200).send({ success: true, data: reposicao })
  } catch (error) {
    return handleError(reply, error, 'cancelar reposição')
  }
}

// Portal do aluno — cancela a própria solicitação enquanto ainda estiver pendente
export async function cancelarMinhaReposicao(request: FastifyRequest, reply: FastifyReply) {
  try {
    const alunoId = await resolverAlunoId(request)
    if (!alunoId) {
      return reply.code(403).send({ success: false, message: 'Perfil de aluno não encontrado', code: 'FORBIDDEN' })
    }
    const { id } = request.params as { id: string }
    const reposicao = await reposicoesService.buscarPorId(id)
    if (reposicao.alunoId !== alunoId) {
      return reply.code(403).send({ success: false, message: 'Sem permissão para esta reposição', code: 'FORBIDDEN' })
    }
    if (reposicao.status !== 'PENDENTE') {
      return reply
        .code(400)
        .send({ success: false, message: 'Só é possível cancelar solicitações pendentes', code: 'BAD_REQUEST' })
    }
    const atualizada = await reposicoesService.cancelar(id)
    return reply.code(200).send({ success: true, data: atualizada })
  } catch (error) {
    return handleError(reply, error, 'cancelar reposição')
  }
}
