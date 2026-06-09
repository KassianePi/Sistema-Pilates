import type { FastifyRequest, FastifyReply } from 'fastify'
import { auditoriaService } from './auditoria.service'
import { logWarn } from '../../shared/utils'

export async function listar(request: FastifyRequest, reply: FastifyReply) {
  try {
    const resultado = await auditoriaService.listar(request.query as any)
    return reply.code(200).send({ success: true, data: resultado })
  } catch (error) {
    logWarn('Erro ao listar auditoria', { error: String(error) })
    return reply.code(500).send({ success: false, message: 'Erro ao listar auditoria', code: 'INTERNAL_ERROR' })
  }
}

export async function exportarCsv(request: FastifyRequest, reply: FastifyReply) {
  const query = request.query as { usuarioId?: string; acao?: string; entidade?: string; dataInicio?: string; dataFim?: string }

  const { logs } = await auditoriaService.listar({ ...query, page: 1, limit: 10000 })
  const logsArray = Array.isArray(logs) ? logs : (logs as any).logs ?? []

  const header = 'id,usuario,acao,entidade,entidadeId,ip,data\n'
  const rows = logsArray.map((l: any) => {
    const usuario = l.usuario?.nomeCompleto ?? l.usuarioId ?? ''
    const data = new Date(l.criadoEm).toLocaleString('pt-BR')
    const ip = l.enderecoIp ?? ''
    return `"${l.id}","${usuario}","${l.acao}","${l.entidade}","${l.entidadeId}","${ip}","${data}"`
  }).join('\n')

  const csv = '﻿' + header + rows

  return reply
    .header('Content-Type', 'text/csv; charset=utf-8')
    .header('Content-Disposition', `attachment; filename="auditoria_${new Date().toISOString().slice(0, 10)}.csv"`)
    .send(csv)
}
