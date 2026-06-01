import { prisma } from '../../database/prisma.client'
import { AppError } from '../../shared/errors'
import { logError } from '../../shared/utils'
import type { Relatorio, CreateRelatorioData } from './relatorios.types'

const includeRelations = {
  professor: { include: { usuario: { select: { nomeCompleto: true } } } },
}

export class RelatoriosRepository {
  async findById(id: string): Promise<Relatorio | null> {
    try {
      return await prisma.relatorio.findUnique({ where: { id }, include: includeRelations }) as any
    } catch (error) {
      logError('Erro ao buscar relatório', error as Error, { id })
      throw AppError.internal('Erro ao buscar relatório')
    }
  }

  async findAll(params: { professorId?: string; tipo?: string; dataInicio?: Date; dataFim?: Date; page: number; limit: number }): Promise<{ relatorios: Relatorio[]; total: number }> {
    try {
      const { professorId, tipo, dataInicio, dataFim, page, limit } = params
      const where: Record<string, unknown> = {}
      if (professorId) where.professorId = professorId
      if (tipo) where.tipo = tipo
      if (dataInicio || dataFim) where.criadoEm = { ...(dataInicio && { gte: dataInicio }), ...(dataFim && { lte: dataFim }) }

      const [relatorios, total] = await Promise.all([
        prisma.relatorio.findMany({ where: where as any, include: includeRelations, skip: (page - 1) * limit, take: limit, orderBy: { criadoEm: 'desc' } }),
        prisma.relatorio.count({ where: where as any }),
      ])

      return { relatorios: relatorios as any, total }
    } catch (error) {
      logError('Erro ao listar relatórios', error as Error)
      throw AppError.internal('Erro ao listar relatórios')
    }
  }

  async create(data: CreateRelatorioData): Promise<Relatorio> {
    try {
      return await prisma.relatorio.create({ data: data as any, include: includeRelations }) as any
    } catch (error) {
      logError('Erro ao criar relatório', error as Error)
      throw AppError.internal('Erro ao criar relatório')
    }
  }
}

export const relatoriosRepository = new RelatoriosRepository()
