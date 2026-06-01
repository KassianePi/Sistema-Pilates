import { prisma } from '../../database/prisma.client'
import { AppError } from '../../shared/errors'
import { logError } from '../../shared/utils'
import type { LogAuditoria, CreateLogAuditoriaData } from './auditoria.types'

export class AuditoriaRepository {
  async create(data: CreateLogAuditoriaData): Promise<LogAuditoria> {
    try {
      return await prisma.logAuditoria.create({
        data: {
          usuarioId: data.usuarioId,
          acao: data.acao,
          entidade: data.entidade,
          entidadeId: data.entidadeId,
          dadosAntigos: data.dadosAntigos ? JSON.stringify(data.dadosAntigos) : null,
          dadosNovos: data.dadosNovos ? JSON.stringify(data.dadosNovos) : null,
          enderecoIp: data.enderecoIp || null,
          userAgent: data.userAgent || null,
        } as any,
      }) as any
    } catch (error) {
      logError('Erro ao criar log de auditoria', error as Error)
      throw AppError.internal('Erro ao registrar auditoria')
    }
  }

  async findAll(params: { usuarioId?: string; acao?: string; entidade?: string; dataInicio?: Date; dataFim?: Date; page: number; limit: number }): Promise<{ logs: LogAuditoria[]; total: number }> {
    try {
      const { usuarioId, acao, entidade, dataInicio, dataFim, page, limit } = params
      const where: Record<string, unknown> = {}
      if (usuarioId) where.usuarioId = usuarioId
      if (acao) where.acao = acao
      if (entidade) where.entidade = entidade
      if (dataInicio || dataFim) where.criadoEm = { ...(dataInicio && { gte: dataInicio }), ...(dataFim && { lte: dataFim }) }

      const [logs, total] = await Promise.all([
        prisma.logAuditoria.findMany({
          where: where as any,
          include: { usuario: { select: { id: true, nomeCompleto: true, email: true } } },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { criadoEm: 'desc' },
        }),
        prisma.logAuditoria.count({ where: where as any }),
      ])

      return { logs: logs as any, total }
    } catch (error) {
      logError('Erro ao listar logs de auditoria', error as Error)
      throw AppError.internal('Erro ao listar auditoria')
    }
  }
}

export const auditoriaRepository = new AuditoriaRepository()
