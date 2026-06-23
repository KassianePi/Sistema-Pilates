import type { FastifyRequest, FastifyReply } from 'fastify'
import { presencaService } from './presenca.service'
import { ValidationError } from '../../shared/errors'
import { logWarn } from '../../shared/utils'
import { prisma } from '../../database/prisma.client'

export async function registrar(request: FastifyRequest, reply: FastifyReply) {
  try {
    const presenca = await presencaService.registrar(request.body as any)
    return reply.code(201).send({ success: true, data: presenca })
  } catch (error: any) {
    if (error instanceof ValidationError)
      return reply.code(400).send({ success: false, message: error.message, code: error.code })
    if (error instanceof Error && error.name === 'ZodError') {
      const validationError = ValidationError.fromZod(error)
      return reply.code(400).send({ success: false, message: validationError.message, code: validationError.code })
    }
    if (error?.statusCode === 409)
      return reply.code(409).send({ success: false, message: error.message, code: 'CONFLICT' })
    if (error?.statusCode === 400)
      return reply.code(400).send({ success: false, message: error.message, code: 'BAD_REQUEST' })
    logWarn('Erro ao registrar presença', { error: String(error) })
    return reply.code(500).send({ success: false, message: 'Erro ao registrar presença', code: 'INTERNAL_ERROR' })
  }
}

export async function listar(request: FastifyRequest, reply: FastifyReply) {
  try {
    const resultado = await presencaService.listar(request.query as any)
    return reply.code(200).send({ success: true, data: resultado })
  } catch (error) {
    logWarn('Erro ao listar presenças', { error: String(error) })
    return reply.code(500).send({ success: false, message: 'Erro ao listar presenças', code: 'INTERNAL_ERROR' })
  }
}

export async function buscarPorId(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }
    const presenca = await presencaService.buscarPorId(id)
    return reply.code(200).send({ success: true, data: presenca })
  } catch (error: any) {
    if (error?.statusCode === 404)
      return reply.code(404).send({ success: false, message: error.message, code: 'NOT_FOUND' })
    logWarn('Erro ao buscar presença', { error: String(error) })
    return reply.code(500).send({ success: false, message: 'Erro ao buscar presença', code: 'INTERNAL_ERROR' })
  }
}

export async function atualizar(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }
    const presenca = await presencaService.atualizar(id, request.body as any)
    return reply.code(200).send({ success: true, data: presenca })
  } catch (error: any) {
    if (error instanceof ValidationError)
      return reply.code(400).send({ success: false, message: error.message, code: error.code })
    if (error instanceof Error && error.name === 'ZodError') {
      const validationError = ValidationError.fromZod(error)
      return reply.code(400).send({ success: false, message: validationError.message, code: validationError.code })
    }
    if (error?.statusCode === 404)
      return reply.code(404).send({ success: false, message: error.message, code: 'NOT_FOUND' })
    logWarn('Erro ao atualizar presença', { error: String(error) })
    return reply.code(500).send({ success: false, message: 'Erro ao atualizar presença', code: 'INTERNAL_ERROR' })
  }
}

// Endpoint do portal do aluno — retorna apenas as presenças do aluno logado
export async function listarMinhasPresencas(request: FastifyRequest, reply: FastifyReply) {
  try {
    const usuarioId = request.usuarioId!
    const aluno = await prisma.aluno.findUnique({ where: { usuarioId } })
    if (!aluno) {
      return reply.code(403).send({ success: false, message: 'Perfil de aluno não encontrado', code: 'FORBIDDEN' })
    }
    const query = request.query as { page?: string; limit?: string; status?: string }
    const resultado = await presencaService.listar({
      alunoId: aluno.id,
      status: query.status,
      page: query.page ? parseInt(query.page) : 1,
      limit: query.limit ? parseInt(query.limit) : 50,
    })
    return reply.code(200).send({ success: true, data: resultado })
  } catch (error) {
    logWarn('Erro ao listar presenças do aluno', { error: String(error) })
    return reply.code(500).send({ success: false, message: 'Erro ao listar presenças', code: 'INTERNAL_ERROR' })
  }
}

// Registro em lote de presenças + marca aula como REALIZADA
export async function registrarBatch(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { aulaId, presencas } = request.body as {
      aulaId: string
      presencas: Array<{ alunoId: string; status: 'PRESENTE' | 'AUSENTE' | 'JUSTIFICADO' }>
    }
    const resultado = await presencaService.registrarBatch(aulaId, presencas)
    return reply.code(200).send({ success: true, data: resultado })
  } catch (error: any) {
    if (error?.statusCode === 404)
      return reply.code(404).send({ success: false, message: error.message, code: 'NOT_FOUND' })
    if (error?.statusCode === 400)
      return reply.code(400).send({ success: false, message: error.message, code: 'BAD_REQUEST' })
    logWarn('Erro ao registrar presenças em lote', { error: String(error) })
    return reply.code(500).send({ success: false, message: 'Erro ao registrar presenças', code: 'INTERNAL_ERROR' })
  }
}
