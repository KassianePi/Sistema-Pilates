import type { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { professoresService } from './professores.service'
import { ValidationError, AppError } from '../../shared/errors'
import { logWarn } from '../../shared/utils'

export async function criar(request: FastifyRequest, reply: FastifyReply) {
  try {
    const professor = await professoresService.criar(request.body as any)
    return reply.code(201).send({ success: true, data: professor })
  } catch (error: any) {
    if (error instanceof ValidationError)
      return reply.code(400).send({ success: false, message: error.message, code: error.code })
    if (error instanceof Error && error.name === 'ZodError') {
      const validationError = ValidationError.fromZod(error)
      return reply.code(400).send({ success: false, message: validationError.message, code: validationError.code })
    }
    logWarn('Erro ao criar professor', { error: String(error) })
    return reply.code(500).send({ success: false, message: 'Erro ao criar professor', code: 'INTERNAL_ERROR' })
  }
}

export async function listar(request: FastifyRequest, reply: FastifyReply) {
  try {
    const resultado = await professoresService.listar(request.query as any)
    return reply.code(200).send({ success: true, data: resultado })
  } catch (error) {
    logWarn('Erro ao listar professores', { error: String(error) })
    return reply.code(500).send({ success: false, message: 'Erro ao listar professores', code: 'INTERNAL_ERROR' })
  }
}

export async function buscarPorId(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }
    const professor = await professoresService.buscarPorId(id)
    return reply.code(200).send({ success: true, data: professor })
  } catch (error: any) {
    if (error?.statusCode === 404)
      return reply.code(404).send({ success: false, message: error.message, code: 'NOT_FOUND' })
    logWarn('Erro ao buscar professor', { error: String(error) })
    return reply.code(500).send({ success: false, message: 'Erro ao buscar professor', code: 'INTERNAL_ERROR' })
  }
}

export async function atualizar(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }
    const professor = await professoresService.atualizar(id, request.body as any)
    return reply.code(200).send({ success: true, data: professor })
  } catch (error: any) {
    if (error instanceof ValidationError)
      return reply.code(400).send({ success: false, message: error.message, code: error.code })
    if (error instanceof Error && error.name === 'ZodError') {
      const validationError = ValidationError.fromZod(error)
      return reply.code(400).send({ success: false, message: validationError.message, code: validationError.code })
    }
    if (error?.statusCode === 404)
      return reply.code(404).send({ success: false, message: error.message, code: 'NOT_FOUND' })
    logWarn('Erro ao atualizar professor', { error: String(error) })
    return reply.code(500).send({ success: false, message: 'Erro ao atualizar professor', code: 'INTERNAL_ERROR' })
  }
}

export async function excluir(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }
    await professoresService.excluir(id)
    return reply.code(200).send({ success: true, data: {} })
  } catch (error: any) {
    if (error?.statusCode === 404)
      return reply.code(404).send({ success: false, message: error.message, code: 'NOT_FOUND' })
    if (error?.statusCode === 400)
      return reply.code(400).send({ success: false, message: error.message, code: 'BAD_REQUEST' })
    logWarn('Erro ao excluir professor', { error: String(error) })
    return reply.code(500).send({ success: false, message: 'Erro ao excluir professor', code: 'INTERNAL_ERROR' })
  }
}

export async function alterarStatus(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }
    const { ativo } = z.object({ ativo: z.boolean() }).parse(request.body)
    const professor = await professoresService.alterarStatus(id, ativo)
    return reply.code(200).send({ success: true, data: professor })
  } catch (error: any) {
    if (error instanceof AppError)
      return reply.code(error.statusCode || 400).send({ success: false, message: error.message, code: error.code })
    if (error instanceof Error && error.name === 'ZodError') {
      const validationError = ValidationError.fromZod(error)
      return reply.code(400).send({ success: false, message: validationError.message, code: validationError.code })
    }
    logWarn('Erro ao alterar status do professor', { error: String(error) })
    return reply.code(500).send({ success: false, message: 'Erro ao alterar status', code: 'INTERNAL_ERROR' })
  }
}
