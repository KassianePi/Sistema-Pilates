import { prisma } from '../../database/prisma.client'
import { AppError } from '../../shared/errors'
import { logError } from '../../shared/utils'
import type { Aula, CreateAulaData, UpdateAulaData } from './agenda.types'

const includeRelations = {
  professor: { include: { usuario: { select: { nomeCompleto: true, email: true } } } },
  modalidade: { select: { id: true, nome: true, descricao: true, ativo: true } },
  _count: { select: { presencas: true, inscricoes: { where: { status: 'ATIVA' as const } } } },
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
   * - 'minhas': próximas aulas do aluno — a grade GERAL (que todos frequentam) + aulas
   *   específicas em que ele está inscrito (tem presença). Inclui todos os status.
   * - 'gerais': aulas GERAIS futuras AGENDADAS (grade aberta, somente visualização)
   * - 'historico': aulas passadas ou encerradas em que o aluno esteve inscrito
   */
  async findForAluno(params: {
    alunoId: string; escopo: 'minhas' | 'gerais' | 'historico'; page: number; limit: number
  }): Promise<{ aulas: Aula[]; total: number }> {
    try {
      const { alunoId, escopo, page, limit } = params
      const agora = new Date()
      // Limite inferior = início do dia de hoje, para que uma aula agendada para hoje
      // continue visível mesmo após seu horário já ter passado (ou estar em andamento).
      const inicioHoje = new Date(agora)
      inicioHoje.setHours(0, 0, 0, 0)
      let where: Record<string, unknown>
      let orderBy: Record<string, 'asc' | 'desc'> = { dataHoraInicio: 'asc' }

      if (escopo === 'gerais') {
        where = {
          categoria: 'GERAL',
          status: 'AGENDADA',
          dataHoraInicio: { gte: inicioHoje },
        }
      } else if (escopo === 'historico') {
        // Aulas passadas/encerradas em que o aluno esteve matriculado ou tem presença
        // (inclui inscrições CANCELADAS para preservar o histórico).
        where = {
          AND: [
            { OR: [{ inscricoes: { some: { alunoId } } }, { presencas: { some: { alunoId } } }] },
            { OR: [{ dataHoraInicio: { lt: agora } }, { status: { in: ['REALIZADA', 'CANCELADA'] } }] },
          ],
        }
        orderBy = { dataHoraInicio: 'desc' }
      } else {
        // 'minhas' — aulas de hoje em diante: grade GERAL + aulas em que o aluno está
        // matriculado (inscrição ATIVA) ou já tem presença. Mantém todos os status,
        // para que SUSPENSA/CANCELADA/EXCLUIDA apareçam com o motivo (justificativa).
        where = {
          dataHoraInicio: { gte: inicioHoje },
          OR: [
            { categoria: 'GERAL' },
            { inscricoes: { some: { alunoId, status: 'ATIVA' } } },
            { presencas: { some: { alunoId } } },
          ],
        }
      }

      // Inclui a própria inscrição ATIVA do aluno para marcar "matriculado" por aula.
      const includeAluno = {
        ...includeRelations,
        inscricoes: { where: { alunoId, status: 'ATIVA' as const }, select: { id: true } },
      }

      const [aulas, total] = await Promise.all([
        prisma.aula.findMany({ where: where as any, include: includeAluno as any, skip: (page - 1) * limit, take: limit, orderBy }),
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

  // ===================== MATRÍCULA (INSCRIÇÕES) =====================

  /**
   * Sincroniza o conjunto de matriculados da aula (cancelamento lógico, sem delete físico):
   * cria/reativa as inscrições selecionadas e marca como CANCELADA as removidas.
   */
  async setInscricoes(aulaId: string, alunoIds: string[]): Promise<void> {
    try {
      await prisma.$transaction(async (tx) => {
        for (const alunoId of alunoIds) {
          await tx.inscricaoAula.upsert({
            where: { alunoId_aulaId: { alunoId, aulaId } },
            update: { status: 'ATIVA' },
            create: { alunoId, aulaId, status: 'ATIVA' },
          })
        }
        // Cancela (logicamente) as ATIVA que não estão mais na seleção.
        // Com alunoIds vazio, `NOT in []` cancela todas as ativas.
        await tx.inscricaoAula.updateMany({
          where: { aulaId, status: 'ATIVA', NOT: { alunoId: { in: alunoIds } } },
          data: { status: 'CANCELADA' },
        })
      })
    } catch (error) {
      logError('Erro ao matricular alunos', error as Error, { aulaId })
      throw AppError.internal('Erro ao salvar matrículas')
    }
  }

  /** Alunos com inscrição ATIVA na aula. */
  async findInscritos(aulaId: string): Promise<Array<{ id: string; usuario: { nomeCompleto: string }; planoAtual: { nome: string } | null }>> {
    try {
      const inscricoes = await prisma.inscricaoAula.findMany({
        where: { aulaId, status: 'ATIVA' },
        select: {
          aluno: {
            select: {
              id: true,
              usuario: { select: { nomeCompleto: true } },
              planoAtual: { select: { nome: true } },
            },
          },
        },
        orderBy: { criadoEm: 'asc' },
      })
      return inscricoes.map((i) => i.aluno) as any
    } catch (error) {
      logError('Erro ao listar matriculados', error as Error, { aulaId })
      throw AppError.internal('Erro ao listar matriculados')
    }
  }

  async countInscricoesAtivas(aulaId: string): Promise<number> {
    try {
      return await prisma.inscricaoAula.count({ where: { aulaId, status: 'ATIVA' } })
    } catch (error) {
      logError('Erro ao contar matrículas', error as Error, { aulaId })
      throw AppError.internal('Erro ao contar matrículas')
    }
  }
}

export const agendaRepository = new AgendaRepository()
