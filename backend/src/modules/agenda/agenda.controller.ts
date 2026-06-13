import type { FastifyRequest, FastifyReply } from 'fastify'
import { agendaService } from './agenda.service'
import { ValidationError } from '../../shared/errors'
import { logWarn } from '../../shared/utils'

export async function criar(request: FastifyRequest, reply: FastifyReply) {
  try {
    const aula = await agendaService.criar(request.body as any)
    return reply.code(201).send({ success: true, data: aula })
  } catch (error: any) {
    if (error instanceof ValidationError) return reply.code(400).send({ success: false, message: error.message, code: error.code })
    if (error?.statusCode === 409) return reply.code(409).send({ success: false, message: error.message, code: 'CONFLICT' })
    logWarn('Erro ao criar aula', { error: String(error) })
    return reply.code(500).send({ success: false, message: 'Erro ao criar aula', code: 'INTERNAL_ERROR' })
  }
}

export async function listar(request: FastifyRequest, reply: FastifyReply) {
  try {
    const resultado = await agendaService.listar(request.query as any)
    return reply.code(200).send({ success: true, data: resultado })
  } catch (error) {
    logWarn('Erro ao listar aulas', { error: String(error) })
    return reply.code(500).send({ success: false, message: 'Erro ao listar aulas', code: 'INTERNAL_ERROR' })
  }
}

export async function buscarPorId(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }
    const aula = await agendaService.buscarPorId(id)
    return reply.code(200).send({ success: true, data: aula })
  } catch (error: any) {
    if (error?.statusCode === 404) return reply.code(404).send({ success: false, message: error.message, code: 'NOT_FOUND' })
    logWarn('Erro ao buscar aula', { error: String(error) })
    return reply.code(500).send({ success: false, message: 'Erro ao buscar aula', code: 'INTERNAL_ERROR' })
  }
}

export async function atualizar(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }
    const aula = await agendaService.atualizar(id, request.body as any)
    return reply.code(200).send({ success: true, data: aula })
  } catch (error: any) {
    if (error instanceof ValidationError) return reply.code(400).send({ success: false, message: error.message, code: error.code })
    if (error?.statusCode === 404) return reply.code(404).send({ success: false, message: error.message, code: 'NOT_FOUND' })
    if (error?.statusCode === 409) return reply.code(409).send({ success: false, message: error.message, code: 'CONFLICT' })
    if (error?.statusCode === 400) return reply.code(400).send({ success: false, message: error.message, code: 'BAD_REQUEST' })
    logWarn('Erro ao atualizar aula', { error: String(error) })
    return reply.code(500).send({ success: false, message: 'Erro ao atualizar aula', code: 'INTERNAL_ERROR' })
  }
}

export async function cancelar(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }
    const aula = await agendaService.cancelar(id, request.usuarioId!, request.body as any)
    return reply.code(200).send({ success: true, data: aula })
  } catch (error: any) {
    if (error instanceof ValidationError) return reply.code(400).send({ success: false, message: error.message, code: error.code })
    if (error?.name === 'ZodError') return reply.code(400).send({ success: false, message: error.errors?.[0]?.message ?? 'Dados inválidos', code: 'VALIDATION_ERROR' })
    if (error?.statusCode === 404) return reply.code(404).send({ success: false, message: error.message, code: 'NOT_FOUND' })
    if (error?.statusCode === 400) return reply.code(400).send({ success: false, message: error.message, code: 'BAD_REQUEST' })
    logWarn('Erro ao cancelar aula', { error: String(error) })
    return reply.code(500).send({ success: false, message: 'Erro ao cancelar aula', code: 'INTERNAL_ERROR' })
  }
}

export async function suspender(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }
    const aula = await agendaService.suspender(id, request.usuarioId!, request.body as any)
    return reply.code(200).send({ success: true, data: aula })
  } catch (error: any) {
    if (error instanceof ValidationError) return reply.code(400).send({ success: false, message: error.message, code: error.code })
    if (error?.name === 'ZodError') return reply.code(400).send({ success: false, message: error.errors?.[0]?.message ?? 'Dados inválidos', code: 'VALIDATION_ERROR' })
    if (error?.statusCode === 404) return reply.code(404).send({ success: false, message: error.message, code: 'NOT_FOUND' })
    if (error?.statusCode === 400) return reply.code(400).send({ success: false, message: error.message, code: 'BAD_REQUEST' })
    logWarn('Erro ao suspender aula', { error: String(error) })
    return reply.code(500).send({ success: false, message: 'Erro ao suspender aula', code: 'INTERNAL_ERROR' })
  }
}

export async function reagendar(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }
    const aula = await agendaService.reagendar(id, request.usuarioId!, request.body as any)
    return reply.code(200).send({ success: true, data: aula })
  } catch (error: any) {
    if (error instanceof ValidationError) return reply.code(400).send({ success: false, message: error.message, code: error.code })
    if (error?.name === 'ZodError') return reply.code(400).send({ success: false, message: error.errors?.[0]?.message ?? 'Dados inválidos', code: 'VALIDATION_ERROR' })
    if (error?.statusCode === 404) return reply.code(404).send({ success: false, message: error.message, code: 'NOT_FOUND' })
    if (error?.statusCode === 409) return reply.code(409).send({ success: false, message: error.message, code: 'CONFLICT' })
    if (error?.statusCode === 400) return reply.code(400).send({ success: false, message: error.message, code: 'BAD_REQUEST' })
    logWarn('Erro ao reagendar aula', { error: String(error) })
    return reply.code(500).send({ success: false, message: 'Erro ao reagendar aula', code: 'INTERNAL_ERROR' })
  }
}

export async function excluir(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }
    const aula = await agendaService.excluir(id, request.usuarioId!, request.body as any)
    return reply.code(200).send({ success: true, data: aula })
  } catch (error: any) {
    if (error instanceof ValidationError) return reply.code(400).send({ success: false, message: error.message, code: error.code })
    if (error?.name === 'ZodError') return reply.code(400).send({ success: false, message: error.errors?.[0]?.message ?? 'Dados inválidos', code: 'VALIDATION_ERROR' })
    if (error?.statusCode === 404) return reply.code(404).send({ success: false, message: error.message, code: 'NOT_FOUND' })
    if (error?.statusCode === 400) return reply.code(400).send({ success: false, message: error.message, code: 'BAD_REQUEST' })
    logWarn('Erro ao excluir aula', { error: String(error) })
    return reply.code(500).send({ success: false, message: 'Erro ao excluir aula', code: 'INTERNAL_ERROR' })
  }
}

// Endpoint público para o portal do aluno — retorna agenda de aulas AGENDADAS
export async function listarAulasAluno(request: FastifyRequest, reply: FastifyReply) {
  try {
    const query = request.query as { page?: string; limit?: string; escopo?: string }
    const escoposValidos = ['minhas', 'gerais', 'historico'] as const
    const escopo = escoposValidos.includes(query.escopo as any) ? (query.escopo as 'minhas' | 'gerais' | 'historico') : 'minhas'

    const resultado = await agendaService.listarParaAluno(
      request.usuarioId!,
      escopo,
      query.page ? parseInt(query.page) : 1,
      query.limit ? parseInt(query.limit) : 30,
    )
    return reply.code(200).send({ success: true, data: resultado })
  } catch (error) {
    logWarn('Erro ao listar aulas para aluno', { error: String(error) })
    return reply.code(500).send({ success: false, message: 'Erro ao listar aulas', code: 'INTERNAL_ERROR' })
  }
}
