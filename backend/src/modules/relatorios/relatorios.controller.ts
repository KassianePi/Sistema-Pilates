import type { FastifyRequest, FastifyReply } from 'fastify'
import { relatoriosService } from './relatorios.service'
import { ValidationError } from '../../shared/errors'
import { logWarn } from '../../shared/utils'

export async function gerar(request: FastifyRequest, reply: FastifyReply) {
  try {
    const relatorio = await relatoriosService.gerar(request.body as any)
    return reply.code(201).send({ success: true, data: relatorio })
  } catch (error: any) {
    if (error instanceof ValidationError) return reply.code(400).send({ success: false, message: error.message, code: error.code })
    logWarn('Erro ao gerar relatório', { error: String(error) })
    return reply.code(500).send({ success: false, message: 'Erro ao gerar relatório', code: 'INTERNAL_ERROR' })
  }
}

export async function listar(request: FastifyRequest, reply: FastifyReply) {
  try {
    const resultado = await relatoriosService.listar(request.query as any)
    return reply.code(200).send({ success: true, data: resultado })
  } catch (error) {
    logWarn('Erro ao listar relatórios', { error: String(error) })
    return reply.code(500).send({ success: false, message: 'Erro ao listar relatórios', code: 'INTERNAL_ERROR' })
  }
}

export async function buscarPorId(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }
    const relatorio = await relatoriosService.buscarPorId(id)
    return reply.code(200).send({ success: true, data: relatorio })
  } catch (error: any) {
    if (error?.statusCode === 404) return reply.code(404).send({ success: false, message: error.message, code: 'NOT_FOUND' })
    logWarn('Erro ao buscar relatório', { error: String(error) })
    return reply.code(500).send({ success: false, message: 'Erro ao buscar relatório', code: 'INTERNAL_ERROR' })
  }
}

export async function exportarRelatorio(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }
    const buffer = await relatoriosService.exportarPorId(id)
    const relatorio = await relatoriosService.buscarPorId(id)
    const nomeArquivo = `relatorio_${relatorio.tipo.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.xlsx`
    return reply
      .header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      .header('Content-Disposition', `attachment; filename="${nomeArquivo}"`)
      .send(buffer)
  } catch (error: any) {
    if (error?.statusCode === 404) return reply.code(404).send({ success: false, message: error.message, code: 'NOT_FOUND' })
    logWarn('Erro ao exportar relatório', { error: String(error) })
    return reply.code(500).send({ success: false, message: 'Erro ao exportar relatório', code: 'INTERNAL_ERROR' })
  }
}

export async function gerarEExportar(request: FastifyRequest, reply: FastifyReply) {
  try {
    const body = request.body as any
    const buffer = await relatoriosService.gerarEExportar(body)
    const tipo = (body.tipo ?? 'relatorio').toLowerCase()
    const nomeArquivo = `relatorio_${tipo}_${new Date().toISOString().slice(0, 10)}.xlsx`
    return reply
      .header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      .header('Content-Disposition', `attachment; filename="${nomeArquivo}"`)
      .send(buffer)
  } catch (error: any) {
    if (error instanceof ValidationError) return reply.code(400).send({ success: false, message: error.message, code: error.code })
    logWarn('Erro ao gerar e exportar relatório', { error: String(error) })
    return reply.code(500).send({ success: false, message: 'Erro ao exportar relatório', code: 'INTERNAL_ERROR' })
  }
}
