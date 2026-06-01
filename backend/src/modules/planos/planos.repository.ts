import { prisma } from '../../database/prisma.client'
import { AppError } from '../../shared/errors'
import { logDebug, logError } from '../../shared/utils'
import type { Plano, CreatePlanoData, UpdatePlanoData } from './planos.types'

export class PlanosRepository {
  async findById(id: string): Promise<Plano | null> {
    try {
      return await prisma.plano.findUnique({ where: { id } })
    } catch (error) {
      logError('Erro ao buscar plano por ID', error as Error, { id })
      throw AppError.internal('Erro ao buscar plano')
    }
  }

  async findByNome(nome: string): Promise<Plano | null> {
    try {
      return await prisma.plano.findUnique({ where: { nome } })
    } catch (error) {
      logError('Erro ao buscar plano por nome', error as Error, { nome })
      throw AppError.internal('Erro ao buscar plano')
    }
  }

  async findAll(params: { ativo?: boolean; tipo?: string; page: number; limit: number }): Promise<{ planos: Plano[]; total: number }> {
    try {
      const { ativo, tipo, page, limit } = params
      const where: Record<string, unknown> = {}
      if (ativo !== undefined) where.ativo = ativo
      if (tipo) where.tipo = tipo

      const [planos, total] = await Promise.all([
        prisma.plano.findMany({
          where: where as any,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { criadoEm: 'desc' },
        }),
        prisma.plano.count({ where: where as any }),
      ])

      return { planos, total }
    } catch (error) {
      logError('Erro ao listar planos', error as Error)
      throw AppError.internal('Erro ao listar planos')
    }
  }

  async create(data: CreatePlanoData): Promise<Plano> {
    try {
      logDebug('Criando plano', { nome: data.nome })
      return await prisma.plano.create({ data: { ...data, preco: data.preco } })
    } catch (error) {
      logError('Erro ao criar plano', error as Error, { nome: data.nome })
      throw AppError.internal('Erro ao criar plano')
    }
  }

  async update(id: string, data: UpdatePlanoData): Promise<Plano> {
    try {
      return await prisma.plano.update({
        where: { id },
        data: {
          ...(data.nome !== undefined && { nome: data.nome }),
          ...(data.descricao !== undefined && { descricao: data.descricao }),
          ...(data.tipo !== undefined && { tipo: data.tipo }),
          ...(data.aulas !== undefined && { aulas: data.aulas }),
          ...(data.preco !== undefined && { preco: data.preco }),
          ...(data.ativo !== undefined && { ativo: data.ativo }),
        } as any,
      })
    } catch (error) {
      logError('Erro ao atualizar plano', error as Error, { id })
      throw AppError.internal('Erro ao atualizar plano')
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await prisma.plano.delete({ where: { id } })
    } catch (error) {
      logError('Erro ao excluir plano', error as Error, { id })
      throw AppError.internal('Erro ao excluir plano')
    }
  }

  async countAlunos(id: string): Promise<number> {
    try {
      return await prisma.aluno.count({ where: { planoId: id } })
    } catch (error) {
      logError('Erro ao contar alunos do plano', error as Error, { id })
      throw AppError.internal('Erro ao verificar alunos do plano')
    }
  }
}

export const planosRepository = new PlanosRepository()
