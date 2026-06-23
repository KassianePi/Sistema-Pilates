import { prisma } from '../../database/prisma.client'
import { AppError } from '../../shared/errors'
import { logError } from '../../shared/utils'
import type { Notificacao, CreateNotificacaoData } from './notificacoes.types'

export class NotificacoesRepository {
  async findById(id: string): Promise<Notificacao | null> {
    try {
      return (await prisma.notificacao.findUnique({ where: { id } })) as any
    } catch (error) {
      logError('Erro ao buscar notificação', error as Error, { id })
      throw AppError.internal('Erro ao buscar notificação')
    }
  }

  async findAll(params: {
    usuarioId?: string
    status?: string
    tipo?: string
    page: number
    limit: number
  }): Promise<{ notificacoes: Notificacao[]; total: number }> {
    try {
      const { usuarioId, status, tipo, page, limit } = params
      const where: Record<string, unknown> = {}
      if (usuarioId) where.usuarioId = usuarioId
      if (status) where.status = status
      if (tipo) where.tipo = tipo

      const [notificacoes, total] = await Promise.all([
        prisma.notificacao.findMany({
          where: where as any,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { criadoEm: 'desc' },
        }),
        prisma.notificacao.count({ where: where as any }),
      ])

      return { notificacoes: notificacoes as any, total }
    } catch (error) {
      logError('Erro ao listar notificações', error as Error)
      throw AppError.internal('Erro ao listar notificações')
    }
  }

  async create(data: CreateNotificacaoData): Promise<Notificacao> {
    try {
      return (await prisma.notificacao.create({ data })) as any
    } catch (error) {
      logError('Erro ao criar notificação', error as Error)
      throw AppError.internal('Erro ao criar notificação')
    }
  }

  async marcarComoLida(id: string): Promise<Notificacao> {
    try {
      return (await prisma.notificacao.update({
        where: { id },
        data: { status: 'LIDA', dataLeitura: new Date() },
      })) as any
    } catch (error) {
      logError('Erro ao marcar notificação como lida', error as Error, { id })
      throw AppError.internal('Erro ao atualizar notificação')
    }
  }

  async arquivar(id: string): Promise<Notificacao> {
    try {
      return (await prisma.notificacao.update({ where: { id }, data: { status: 'ARQUIVADA' } })) as any
    } catch (error) {
      logError('Erro ao arquivar notificação', error as Error, { id })
      throw AppError.internal('Erro ao arquivar notificação')
    }
  }

  async countNaoLidas(usuarioId: string): Promise<number> {
    try {
      return await prisma.notificacao.count({ where: { usuarioId, status: 'NAO_LIDA' } })
    } catch (error) {
      logError('Erro ao contar notificações', error as Error)
      throw AppError.internal('Erro ao contar notificações')
    }
  }
}

export const notificacoesRepository = new NotificacoesRepository()
