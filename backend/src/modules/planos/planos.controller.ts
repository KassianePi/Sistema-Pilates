import type { FastifyRequest, FastifyReply } from 'fastify'
import { planosService } from './planos.service'
import { ValidationError } from '../../shared/errors'
import { logWarn } from '../../shared/utils'

export async function criar(request: FastifyRequest, reply: FastifyReply) {
  try {
    const body = request.body as any
    const plano = await planosService.criar(body)
    return reply.code(201).send({ success: true, data: plano })
  } catch (error) {
    if (error instanceof ValidationError) {
      return reply.code(400).send({ success: false, message: error.message, code: error.code })
    }
    logWarn('Erro ao criar plano', { error: String(error) })
    return reply.code(500).send({ success: false, message: 'Erro ao criar plano', code: 'INTERNAL_ERROR' })
  }
}

export async function listar(request: FastifyRequest, reply: FastifyReply) {
  try {
    const query = request.query as any
    const resultado = await planosService.listar(query)
    return reply.code(200).send({ success: true, data: resultado })
  } catch (error) {
    logWarn('Erro ao listar planos', { error: String(error) })
    return reply.code(500).send({ success: false, message: 'Erro ao listar planos', code: 'INTERNAL_ERROR' })
  }
}

export async function buscarPorId(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }
    const plano = await planosService.buscarPorId(id)
    return reply.code(200).send({ success: true, data: plano })
  } catch (error: any) {
    if (error?.statusCode === 404) {
      return reply.code(404).send({ success: false, message: error.message, code: 'NOT_FOUND' })
    }
    logWarn('Erro ao buscar plano', { error: String(error) })
    return reply.code(500).send({ success: false, message: 'Erro ao buscar plano', code: 'INTERNAL_ERROR' })
  }
}

export async function atualizar(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }
    const body = request.body as any
    const plano = await planosService.atualizar(id, body)
    return reply.code(200).send({ success: true, data: plano })
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return reply.code(400).send({ success: false, message: error.message, code: error.code })
    }
    if (error?.statusCode === 404) {
      return reply.code(404).send({ success: false, message: error.message, code: 'NOT_FOUND' })
    }
    logWarn('Erro ao atualizar plano', { error: String(error) })
    return reply.code(500).send({ success: false, message: 'Erro ao atualizar plano', code: 'INTERNAL_ERROR' })
  }
}

export async function excluir(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }
    await planosService.excluir(id)
    return reply.code(200).send({ success: true, data: {} })
  } catch (error: any) {
    if (error?.statusCode === 404) {
      return reply.code(404).send({ success: false, message: error.message, code: 'NOT_FOUND' })
    }
    if (error?.statusCode === 400) {
      return reply.code(400).send({ success: false, message: error.message, code: 'BAD_REQUEST' })
    }
    logWarn('Erro ao excluir plano', { error: String(error) })
    return reply.code(500).send({ success: false, message: 'Erro ao excluir plano', code: 'INTERNAL_ERROR' })
  }
}
