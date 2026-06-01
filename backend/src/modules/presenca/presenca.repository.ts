import { prisma } from '../../database/prisma.client'
import { AppError } from '../../shared/errors'
import { logError } from '../../shared/utils'
import type { Presenca, CreatePresencaData, UpdatePresencaData } from './presenca.types'

const includeRelations = {
  aluno: { include: { usuario: { select: { nomeCompleto: true } } } },
  aula: { select: { id: true, dataHoraInicio: true, sala: true } },
}

export class PresencaRepository {
  async findById(id: string): Promise<Presenca | null> {
    try {
      return await prisma.presenca.findUnique({ where: { id }, include: includeRelations }) as any
    } catch (error) {
      logError('Erro ao buscar presença', error as Error, { id })
      throw AppError.internal('Erro ao buscar presença')
    }
  }

  async findByAlunoAula(alunoId: string, aulaId: string): Promise<Presenca | null> {
    try {
      return await prisma.presenca.findUnique({
        where: { alunoId_aulaId: { alunoId, aulaId } },
        include: includeRelations,
      }) as any
    } catch (error) {
      logError('Erro ao buscar presença por aluno/aula', error as Error)
      throw AppError.internal('Erro ao buscar presença')
    }
  }

  async findAll(params: { alunoId?: string; aulaId?: string; status?: string; dataInicio?: Date; dataFim?: Date; page: number; limit: number }): Promise<{ presencas: Presenca[]; total: number }> {
    try {
      const { alunoId, aulaId, status, dataInicio, dataFim, page, limit } = params
      const where: Record<string, unknown> = {}
      if (alunoId) where.alunoId = alunoId
      if (aulaId) where.aulaId = aulaId
      if (status) where.status = status
      if (dataInicio || dataFim) {
        where.dataRegistro = {
          ...(dataInicio && { gte: dataInicio }),
          ...(dataFim && { lte: dataFim }),
        }
      }

      const [presencas, total] = await Promise.all([
        prisma.presenca.findMany({ where: where as any, include: includeRelations, skip: (page - 1) * limit, take: limit, orderBy: { dataRegistro: 'desc' } }),
        prisma.presenca.count({ where: where as any }),
      ])

      return { presencas: presencas as any, total }
    } catch (error) {
      logError('Erro ao listar presenças', error as Error)
      throw AppError.internal('Erro ao listar presenças')
    }
  }

  async create(data: CreatePresencaData): Promise<Presenca> {
    try {
      return await prisma.presenca.create({ data: data as any, include: includeRelations }) as any
    } catch (error) {
      logError('Erro ao registrar presença', error as Error)
      throw AppError.internal('Erro ao registrar presença')
    }
  }

  async update(id: string, data: UpdatePresencaData): Promise<Presenca> {
    try {
      return await prisma.presenca.update({ where: { id }, data: data as any, include: includeRelations }) as any
    } catch (error) {
      logError('Erro ao atualizar presença', error as Error, { id })
      throw AppError.internal('Erro ao atualizar presença')
    }
  }
}

export const presencaRepository = new PresencaRepository()
