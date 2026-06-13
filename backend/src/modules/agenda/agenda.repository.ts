import { prisma } from '../../database/prisma.client'
import { AppError } from '../../shared/errors'
import { logError } from '../../shared/utils'
import type { Aula, CreateAulaData, UpdateAulaData } from './agenda.types'

const includeRelations = {
  professor: { include: { usuario: { select: { nomeCompleto: true, email: true } } } },
  modalidade: { select: { id: true, nome: true, descricao: true, ativo: true } },
  _count: { select: { presencas: true } },
}

export class AgendaRepository {
  async findById(id: string): Promise<Aula | null> {
    try {
      return await prisma.aula.findUnique({ where: { id }, include: includeRelations }) as any
    } catch (error) {
      logError('Erro ao buscar aula por ID', error as Error, { id })
      throw AppError.internal('Erro ao buscar aula')
    }
  }

  async findAll(params: {
    professorId?: string; status?: string; tipo?: string; categoria?: string; modalidadeId?: string
    dataInicio?: Date; dataFim?: Date; page: number; limit: number
  }): Promise<{ aulas: Aula[]; total: number }> {
    try {
      const { professorId, status, tipo, categoria, modalidadeId, dataInicio, dataFim, page, limit } = params
      const where: Record<string, unknown> = {}
      if (professorId) where.professorId = professorId
      if (status) where.status = status
      else where.status = { not: 'EXCLUIDA' } // listagem admin não mostra aulas excluídas por padrão
      if (tipo) where.tipo = tipo
      if (categoria) where.categoria = categoria
      if (modalidadeId) where.modalidadeId = modalidadeId
      if (dataInicio || dataFim) {
        where.dataHoraInicio = {
          ...(dataInicio && { gte: dataInicio }),
          ...(dataFim && { lte: dataFim }),
        }
      }

      const [aulas, total] = await Promise.all([
        prisma.aula.findMany({ where: where as any, include: includeRelations, skip: (page - 1) * limit, take: limit, orderBy: { dataHoraInicio: 'asc' } }),
        prisma.aula.count({ where: where as any }),
      ])

      return { aulas: aulas as any, total }
    } catch (error) {
      logError('Erro ao listar aulas', error as Error)
      throw AppError.internal('Erro ao listar aulas')
    }
  }

  /**
   * Lista aulas para o portal do aluno segmentadas por escopo:
   * - 'minhas': aulas futuras AGENDADAS em que o aluno está inscrito (tem presença)
   * - 'gerais': aulas GERAIS futuras AGENDADAS (grade aberta, somente visualização)
   * - 'historico': aulas passadas ou encerradas em que o aluno esteve inscrito
   */
  async findForAluno(params: {
    alunoId: string; escopo: 'minhas' | 'gerais' | 'historico'; page: number; limit: number
  }): Promise<{ aulas: Aula[]; total: number }> {
    try {
      const { alunoId, escopo, page, limit } = params
      const agora = new Date()
      let where: Record<string, unknown>
      let orderBy: Record<string, 'asc' | 'desc'> = { dataHoraInicio: 'asc' }

      if (escopo === 'gerais') {
        where = {
          categoria: 'GERAL',
          status: 'AGENDADA',
          dataHoraInicio: { gte: agora },
        }
      } else if (escopo === 'historico') {
        where = {
          presencas: { some: { alunoId } },
          OR: [
            { dataHoraInicio: { lt: agora } },
            { status: { in: ['REALIZADA', 'CANCELADA'] } },
          ],
        }
        orderBy = { dataHoraInicio: 'desc' }
      } else {
        // 'minhas' — todas as aulas futuras em que o aluno está inscrito, independentemente
        // do status, para que SUSPENSA/CANCELADA/EXCLUIDA apareçam com o motivo (justificativa).
        where = {
          presencas: { some: { alunoId } },
          dataHoraInicio: { gte: agora },
        }
      }

      const [aulas, total] = await Promise.all([
        prisma.aula.findMany({ where: where as any, include: includeRelations, skip: (page - 1) * limit, take: limit, orderBy }),
        prisma.aula.count({ where: where as any }),
      ])

      return { aulas: aulas as any, total }
    } catch (error) {
      logError('Erro ao listar aulas do aluno', error as Error, { alunoId: params.alunoId, escopo: params.escopo })
      throw AppError.internal('Erro ao listar aulas')
    }
  }

  async findConflito(professorId: string, dataHoraInicio: Date, duracao: number, excludeId?: string): Promise<boolean> {
    try {
      const dataHoraFim = new Date(dataHoraInicio.getTime() + duracao * 60000)
      const conflito = await prisma.aula.findFirst({
        where: {
          professorId,
          status: { in: ['AGENDADA'] },
          ...(excludeId && { id: { not: excludeId } }),
          dataHoraInicio: { lt: dataHoraFim },
          AND: [{ dataHoraInicio: { gte: new Date(dataHoraInicio.getTime() - duracao * 60000) } }],
        } as any,
      })
      return !!conflito
    } catch (error) {
      logError('Erro ao verificar conflito de horário', error as Error)
      throw AppError.internal('Erro ao verificar disponibilidade')
    }
  }

  async create(data: CreateAulaData): Promise<Aula> {
    try {
      return await prisma.aula.create({
        data: {
          ...data,
          modalidadeId: data.modalidadeId ?? null,
        } as any,
        include: includeRelations,
      }) as any
    } catch (error) {
      logError('Erro ao criar aula', error as Error)
      throw AppError.internal('Erro ao criar aula')
    }
  }

  async update(id: string, data: UpdateAulaData): Promise<Aula> {
    try {
      return await prisma.aula.update({
        where: { id },
        data: {
          ...data,
          ...(data.modalidadeId !== undefined && { modalidadeId: data.modalidadeId ?? null }),
        } as any,
        include: includeRelations,
      }) as any
    } catch (error) {
      logError('Erro ao atualizar aula', error as Error, { id })
      throw AppError.internal('Erro ao atualizar aula')
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await prisma.aula.delete({ where: { id } })
    } catch (error) {
      logError('Erro ao excluir aula', error as Error, { id })
      throw AppError.internal('Erro ao excluir aula')
    }
  }
}

export const agendaRepository = new AgendaRepository()
