import { prisma } from '../../database/prisma.client'
import { AppError } from '../../shared/errors'
import { logError } from '../../shared/utils'
import type { EvolucaoAula, CreateEvolucaoData, UpdateEvolucaoData } from './evolucoes.types'

const includeRelations = {
  aula: { select: { id: true, dataHoraInicio: true, sala: true } },
  registradoPor: { select: { id: true, nomeCompleto: true } },
} as const

export class EvolucoesRepository {
  async findById(id: string): Promise<EvolucaoAula | null> {
    try {
      return (await prisma.evolucaoAula.findUnique({ where: { id }, include: includeRelations })) as any
    } catch (error) {
      logError('Erro ao buscar evolução por ID', error as Error, { id })
      throw AppError.internal('Erro ao buscar evolução')
    }
  }

  async findAll(params: {
    alunoId?: string
    aulaId?: string
    page: number
    limit: number
  }): Promise<{ evolucoes: EvolucaoAula[]; total: number }> {
    try {
      const { alunoId, aulaId, page, limit } = params
      const where: Record<string, unknown> = {}
      if (alunoId) where.alunoId = alunoId
      if (aulaId) where.aulaId = aulaId

      const [evolucoes, total] = await Promise.all([
        prisma.evolucaoAula.findMany({
          where: where as any,
          include: includeRelations,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { criadoEm: 'desc' },
        }),
        prisma.evolucaoAula.count({ where: where as any }),
      ])

      return { evolucoes: evolucoes as any, total }
    } catch (error) {
      logError('Erro ao listar evoluções', error as Error)
      throw AppError.internal('Erro ao listar evoluções')
    }
  }

  async create(data: CreateEvolucaoData): Promise<EvolucaoAula> {
    try {
      return (await prisma.evolucaoAula.create({ data, include: includeRelations })) as any
    } catch (error) {
      logError('Erro ao criar evolução', error as Error)
      throw AppError.internal('Erro ao criar evolução')
    }
  }

  async update(id: string, data: UpdateEvolucaoData): Promise<EvolucaoAula> {
    try {
      return (await prisma.evolucaoAula.update({ where: { id }, data, include: includeRelations })) as any
    } catch (error) {
      logError('Erro ao atualizar evolução', error as Error, { id })
      throw AppError.internal('Erro ao atualizar evolução')
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await prisma.evolucaoAula.delete({ where: { id } })
    } catch (error) {
      logError('Erro ao excluir evolução', error as Error, { id })
      throw AppError.internal('Erro ao excluir evolução')
    }
  }
}

export const evolucoesRepository = new EvolucoesRepository()
