import type { FastifyRequest, FastifyReply } from 'fastify'
import { presencaService } from './presenca.service'
import { ValidationError } from '../../shared/errors'
import { logWarn } from '../../shared/utils'

export async function registrar(request: FastifyRequest, reply: FastifyReply) {
  try {
    const presenca = await presencaService.registrar(request.body as any)
    return reply.code(201).send({ success: true, data: presenca })
  } catch (error: any) {
    if (error instanceof ValidationError) return reply.code(400).send({ success: false, message: error.message, code: error.code })
    if (error?.statusCode === 409) return reply.code(409).send({ success: false, message: error.message, code: 'CONFLICT' })
    if (error?.statusCode === 400) return reply.code(400).send({ success: false, message: error.message, code: 'BAD_REQUEST' })
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
    if (error?.statusCode === 404) return reply.code(404).send({ success: false, message: error.message, code: 'NOT_FOUND' })
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
    if (error instanceof ValidationError) return reply.code(400).send({ success: false, message: error.message, code: error.code })
    if (error?.statusCode === 404) return reply.code(404).send({ success: false, message: error.message, code: 'NOT_FOUND' })
    logWarn('Erro ao atualizar presença', { error: String(error) })
    return reply.code(500).send({ success: false, message: 'Erro ao atualizar presença', code: 'INTERNAL_ERROR' })
  }
}
