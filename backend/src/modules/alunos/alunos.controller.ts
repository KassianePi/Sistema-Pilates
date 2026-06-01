import type { FastifyRequest, FastifyReply } from 'fastify'
import { alunosService } from './alunos.service'
import { ValidationError } from '../../shared/errors'
import { logWarn } from '../../shared/utils'

export async function criar(request: FastifyRequest, reply: FastifyReply) {
  try {
    const aluno = await alunosService.criar(request.body as any)
    return reply.code(201).send({ success: true, data: aluno })
  } catch (error: any) {
    if (error instanceof ValidationError) return reply.code(400).send({ success: false, message: error.message, code: error.code })
    logWarn('Erro ao criar aluno', { error: String(error) })
    return reply.code(500).send({ success: false, message: 'Erro ao criar aluno', code: 'INTERNAL_ERROR' })
  }
}

export async function listar(request: FastifyRequest, reply: FastifyReply) {
  try {
    const resultado = await alunosService.listar(request.query as any)
    return reply.code(200).send({ success: true, data: resultado })
  } catch (error) {
    logWarn('Erro ao listar alunos', { error: String(error) })
    return reply.code(500).send({ success: false, message: 'Erro ao listar alunos', code: 'INTERNAL_ERROR' })
  }
}

export async function buscarPorId(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }
    const aluno = await alunosService.buscarPorId(id)
    return reply.code(200).send({ success: true, data: aluno })
  } catch (error: any) {
    if (error?.statusCode === 404) return reply.code(404).send({ success: false, message: error.message, code: 'NOT_FOUND' })
    logWarn('Erro ao buscar aluno', { error: String(error) })
    return reply.code(500).send({ success: false, message: 'Erro ao buscar aluno', code: 'INTERNAL_ERROR' })
  }
}

export async function atualizar(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }
    const aluno = await alunosService.atualizar(id, request.body as any)
    return reply.code(200).send({ success: true, data: aluno })
  } catch (error: any) {
    if (error instanceof ValidationError) return reply.code(400).send({ success: false, message: error.message, code: error.code })
    if (error?.statusCode === 404) return reply.code(404).send({ success: false, message: error.message, code: 'NOT_FOUND' })
    logWarn('Erro ao atualizar aluno', { error: String(error) })
    return reply.code(500).send({ success: false, message: 'Erro ao atualizar aluno', code: 'INTERNAL_ERROR' })
  }
}

export async function excluir(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }
    await alunosService.excluir(id)
    return reply.code(200).send({ success: true, data: {} })
  } catch (error: any) {
    if (error?.statusCode === 404) return reply.code(404).send({ success: false, message: error.message, code: 'NOT_FOUND' })
    logWarn('Erro ao excluir aluno', { error: String(error) })
    return reply.code(500).send({ success: false, message: 'Erro ao excluir aluno', code: 'INTERNAL_ERROR' })
  }
}
