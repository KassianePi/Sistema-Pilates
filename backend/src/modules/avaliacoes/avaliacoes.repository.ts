import { prisma } from '../../database/prisma.client'
import { AppError } from '../../shared/errors'
import { logError } from '../../shared/utils'
import type { AvaliacaoCorporal, CreateAvaliacaoData, UpdateAvaliacaoData } from './avaliacoes.types'

const includeFotos = { fotos: true } as const

export class AvaliacoesRepository {
  async findById(id: string): Promise<AvaliacaoCorporal | null> {
    try {
      return (await prisma.avaliacaoCorporal.findUnique({ where: { id }, include: includeFotos })) as any
    } catch (error) {
      logError('Erro ao buscar avaliação por ID', error as Error, { id })
      throw AppError.internal('Erro ao buscar avaliação')
    }
  }

  async findAll(params: {
    alunoId?: string
    page: number
    limit: number
  }): Promise<{ avaliacoes: AvaliacaoCorporal[]; total: number }> {
    try {
      const { alunoId, page, limit } = params
      const where: Record<string, unknown> = {}
      if (alunoId) where.alunoId = alunoId

      const [avaliacoes, total] = await Promise.all([
        prisma.avaliacaoCorporal.findMany({
          where: where as any,
          include: includeFotos,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { dataAvaliacao: 'desc' },
        }),
        prisma.avaliacaoCorporal.count({ where: where as any }),
      ])

      return { avaliacoes: avaliacoes as any, total }
    } catch (error) {
      logError('Erro ao listar avaliações', error as Error)
      throw AppError.internal('Erro ao listar avaliações')
    }
  }

  async create(data: CreateAvaliacaoData): Promise<AvaliacaoCorporal> {
    try {
      const { fotos, ...resto } = data
      return (await prisma.avaliacaoCorporal.create({
        data: {
          ...resto,
          dataAvaliacao: new Date(data.dataAvaliacao),
          medidas: data.medidas ?? undefined,
          fotos: fotos && fotos.length > 0 ? { create: fotos } : undefined,
        } as any,
        include: includeFotos,
      })) as any
    } catch (error) {
      logError('Erro ao criar avaliação', error as Error)
      throw AppError.internal('Erro ao criar avaliação')
    }
  }

  async update(id: string, data: UpdateAvaliacaoData): Promise<AvaliacaoCorporal> {
    try {
      return (await prisma.avaliacaoCorporal.update({
        where: { id },
        data: {
          ...(data.dataAvaliacao !== undefined && { dataAvaliacao: new Date(data.dataAvaliacao) }),
          ...(data.peso !== undefined && { peso: data.peso }),
          ...(data.altura !== undefined && { altura: data.altura }),
          ...(data.medidas !== undefined && { medidas: data.medidas ?? undefined }),
          ...(data.queixaPrincipal !== undefined && { queixaPrincipal: data.queixaPrincipal }),
          ...(data.historicoMedico !== undefined && { historicoMedico: data.historicoMedico }),
          ...(data.observacoesPostura !== undefined && { observacoesPostura: data.observacoesPostura }),
          ...(data.observacoesGerais !== undefined && { observacoesGerais: data.observacoesGerais }),
        } as any,
        include: includeFotos,
      })) as any
    } catch (error) {
      logError('Erro ao atualizar avaliação', error as Error, { id })
      throw AppError.internal('Erro ao atualizar avaliação')
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await prisma.avaliacaoCorporal.delete({ where: { id } })
    } catch (error) {
      logError('Erro ao excluir avaliação', error as Error, { id })
      throw AppError.internal('Erro ao excluir avaliação')
    }
  }
}

export const avaliacoesRepository = new AvaliacoesRepository()
