import { prisma } from '../../database/prisma.client'
import { AppError } from '../../shared/errors'
import { logError } from '../../shared/utils'
import type { Reposicao, CreateReposicaoData, StatusReposicao } from './reposicoes.types'

const includeRelations = {
  aluno: { select: { id: true, usuario: { select: { nomeCompleto: true } } } },
  aulaOriginal: { select: { id: true, dataHoraInicio: true, sala: true } },
  aulaReposicao: { select: { id: true, dataHoraInicio: true, sala: true, capacidade: true } },
} as const

export class ReposicoesRepository {
  async findById(id: string): Promise<Reposicao | null> {
    try {
      return (await prisma.reposicao.findUnique({ where: { id }, include: includeRelations })) as any
    } catch (error) {
      logError('Erro ao buscar reposição por ID', error as Error, { id })
      throw AppError.internal('Erro ao buscar reposição')
    }
  }

  async findPendenteOuAgendadaPorAula(alunoId: string, aulaOriginalId: string): Promise<Reposicao | null> {
    try {
      return (await prisma.reposicao.findFirst({
        where: { alunoId, aulaOriginalId, status: { in: ['PENDENTE', 'AGENDADA'] } },
      })) as any
    } catch (error) {
      logError('Erro ao buscar reposição existente', error as Error)
      throw AppError.internal('Erro ao verificar reposição existente')
    }
  }

  async findAll(params: {
    alunoId?: string
    status?: StatusReposicao
    page: number
    limit: number
  }): Promise<{ reposicoes: Reposicao[]; total: number }> {
    try {
      const { alunoId, status, page, limit } = params
      const where: Record<string, unknown> = {}
      if (alunoId) where.alunoId = alunoId
      if (status) where.status = status

      const [reposicoes, total] = await Promise.all([
        prisma.reposicao.findMany({
          where: where as any,
          include: includeRelations,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { dataSolicitacao: 'desc' },
        }),
        prisma.reposicao.count({ where: where as any }),
      ])

      return { reposicoes: reposicoes as any, total }
    } catch (error) {
      logError('Erro ao listar reposições', error as Error)
      throw AppError.internal('Erro ao listar reposições')
    }
  }

  async create(data: CreateReposicaoData): Promise<Reposicao> {
    try {
      return (await prisma.reposicao.create({
        data: { ...data, status: 'PENDENTE', dataSolicitacao: new Date() },
        include: includeRelations,
      })) as any
    } catch (error) {
      logError('Erro ao criar reposição', error as Error)
      throw AppError.internal('Erro ao criar reposição')
    }
  }

  async countInscricoesAtivas(aulaId: string): Promise<number> {
    try {
      return await prisma.inscricaoAula.count({ where: { aulaId, status: 'ATIVA' } })
    } catch (error) {
      logError('Erro ao contar matrículas da aula de reposição', error as Error, { aulaId })
      throw AppError.internal('Erro ao verificar vagas da aula de reposição')
    }
  }

  /** Agenda a reposição: matricula o aluno na aula de destino e atualiza o status, em transação. */
  async agendar(id: string, alunoId: string, aulaReposicaoId: string): Promise<Reposicao> {
    try {
      await prisma.$transaction(async (tx) => {
        await tx.inscricaoAula.upsert({
          where: { alunoId_aulaId: { alunoId, aulaId: aulaReposicaoId } },
          update: { status: 'ATIVA' },
          create: { alunoId, aulaId: aulaReposicaoId, status: 'ATIVA' },
        })
        await tx.reposicao.update({ where: { id }, data: { aulaReposicaoId, status: 'AGENDADA' } })
      })
      return (await this.findById(id)) as Reposicao
    } catch (error) {
      logError('Erro ao agendar reposição', error as Error, { id })
      throw AppError.internal('Erro ao agendar reposição')
    }
  }

  async atualizarStatus(id: string, status: StatusReposicao): Promise<Reposicao> {
    try {
      return (await prisma.reposicao.update({ where: { id }, data: { status }, include: includeRelations })) as any
    } catch (error) {
      logError('Erro ao atualizar status da reposição', error as Error, { id })
      throw AppError.internal('Erro ao atualizar reposição')
    }
  }

  /** Marca REALIZADA todas as reposições AGENDADAS cuja aula de destino é a informada. */
  async marcarRealizadasPorAulaDestino(aulaId: string): Promise<void> {
    try {
      await prisma.reposicao.updateMany({
        where: { aulaReposicaoId: aulaId, status: 'AGENDADA' },
        data: { status: 'REALIZADA' },
      })
    } catch (error) {
      logError('Erro ao marcar reposições como realizadas', error as Error, { aulaId })
      throw AppError.internal('Erro ao atualizar reposições')
    }
  }
}

export const reposicoesRepository = new ReposicoesRepository()
