import type { FastifyRequest, FastifyReply } from 'fastify'
import { financeiroService } from './financeiro.service'
import { ValidationError } from '../../shared/errors'
import { logWarn } from '../../shared/utils'

// ===================== CAIXA =====================

export async function abrirCaixa(request: FastifyRequest, reply: FastifyReply) {
  try {
    const usuarioId = request.usuarioId as string
    const caixa = await financeiroService.abrirCaixa(usuarioId, request.body as any)
    return reply.code(201).send({ success: true, data: caixa })
  } catch (error: any) {
    if (error?.statusCode === 409) return reply.code(409).send({ success: false, message: error.message, code: 'CONFLICT' })
    logWarn('Erro ao abrir caixa', { error: String(error) })
    return reply.code(500).send({ success: false, message: 'Erro ao abrir caixa', code: 'INTERNAL_ERROR' })
  }
}

export async function fecharCaixa(request: FastifyRequest, reply: FastifyReply) {
  try {
    const usuarioId = request.usuarioId as string
    const { id } = request.params as { id: string }
    const caixa = await financeiroService.fecharCaixa(id, usuarioId, request.body as any)
    return reply.code(200).send({ success: true, data: caixa })
  } catch (error: any) {
    if (error?.statusCode === 404) return reply.code(404).send({ success: false, message: error.message, code: 'NOT_FOUND' })
    if (error?.statusCode === 400) return reply.code(400).send({ success: false, message: error.message, code: 'BAD_REQUEST' })
    logWarn('Erro ao fechar caixa', { error: String(error) })
    return reply.code(500).send({ success: false, message: 'Erro ao fechar caixa', code: 'INTERNAL_ERROR' })
  }
}

export async function caixaAtivo(request: FastifyRequest, reply: FastifyReply) {
  try {
    const caixa = await financeiroService.buscarCaixaAtivo()
    return reply.code(200).send({ success: true, data: caixa })
  } catch (error) {
    logWarn('Erro ao buscar caixa ativo', { error: String(error) })
    return reply.code(500).send({ success: false, message: 'Erro ao buscar caixa', code: 'INTERNAL_ERROR' })
  }
}

// ===================== MENSALIDADES =====================

export async function criarMensalidade(request: FastifyRequest, reply: FastifyReply) {
  try {
    const mensalidade = await financeiroService.criarMensalidade(request.body as any)
    return reply.code(201).send({ success: true, data: mensalidade })
  } catch (error: any) {
    if (error instanceof ValidationError) return reply.code(400).send({ success: false, message: error.message, code: error.code })
    logWarn('Erro ao criar mensalidade', { error: String(error) })
    return reply.code(500).send({ success: false, message: 'Erro ao criar mensalidade', code: 'INTERNAL_ERROR' })
  }
}

export async function listarMensalidades(request: FastifyRequest, reply: FastifyReply) {
  try {
    const resultado = await financeiroService.listarMensalidades(request.query as any)
    return reply.code(200).send({ success: true, data: resultado })
  } catch (error) {
    logWarn('Erro ao listar mensalidades', { error: String(error) })
    return reply.code(500).send({ success: false, message: 'Erro ao listar mensalidades', code: 'INTERNAL_ERROR' })
  }
}

export async function buscarMensalidadePorId(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }
    const mensalidade = await financeiroService.buscarMensalidadePorId(id)
    return reply.code(200).send({ success: true, data: mensalidade })
  } catch (error: any) {
    if (error?.statusCode === 404) return reply.code(404).send({ success: false, message: error.message, code: 'NOT_FOUND' })
    logWarn('Erro ao buscar mensalidade', { error: String(error) })
    return reply.code(500).send({ success: false, message: 'Erro ao buscar mensalidade', code: 'INTERNAL_ERROR' })
  }
}

export async function atualizarMensalidade(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }
    const mensalidade = await financeiroService.atualizarMensalidade(id, request.body as any)
    return reply.code(200).send({ success: true, data: mensalidade })
  } catch (error: any) {
    if (error instanceof ValidationError) return reply.code(400).send({ success: false, message: error.message, code: error.code })
    if (error?.statusCode === 404) return reply.code(404).send({ success: false, message: error.message, code: 'NOT_FOUND' })
    if (error?.statusCode === 400) return reply.code(400).send({ success: false, message: error.message, code: 'BAD_REQUEST' })
    logWarn('Erro ao atualizar mensalidade', { error: String(error) })
    return reply.code(500).send({ success: false, message: 'Erro ao atualizar mensalidade', code: 'INTERNAL_ERROR' })
  }
}

// ===================== PAGAMENTOS =====================

export async function registrarPagamento(request: FastifyRequest, reply: FastifyReply) {
  try {
    const usuarioId = request.usuarioId as string
    const pagamento = await financeiroService.registrarPagamento(usuarioId, request.body as any)
    return reply.code(201).send({ success: true, data: pagamento })
  } catch (error: any) {
    if (error instanceof ValidationError) return reply.code(400).send({ success: false, message: error.message, code: error.code })
    if (error?.statusCode === 400) return reply.code(400).send({ success: false, message: error.message, code: 'BAD_REQUEST' })
    logWarn('Erro ao registrar pagamento', { error: String(error) })
    return reply.code(500).send({ success: false, message: 'Erro ao registrar pagamento', code: 'INTERNAL_ERROR' })
  }
}

export async function listarPagamentos(request: FastifyRequest, reply: FastifyReply) {
  try {
    const resultado = await financeiroService.listarPagamentos(request.query as any)
    return reply.code(200).send({ success: true, data: resultado })
  } catch (error) {
    logWarn('Erro ao listar pagamentos', { error: String(error) })
    return reply.code(500).send({ success: false, message: 'Erro ao listar pagamentos', code: 'INTERNAL_ERROR' })
  }
}
