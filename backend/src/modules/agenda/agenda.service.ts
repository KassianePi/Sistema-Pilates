import { AgendaRepository } from './agenda.repository'
import { AppError, ValidationError } from '../../shared/errors'
import { logInfo } from '../../shared/utils'
import { createAulaSchema, updateAulaSchema, listAulasSchema } from '../../shared/schemas'
import { AGENDA_ERRORS } from './agenda.constants'
import { prisma } from '../../database/prisma.client'
import { eventBus } from '../../events/event-bus'
import type { Aula, UpdateAulaData } from './agenda.types'

export class AgendaService {
  constructor(private repository: AgendaRepository) {}

  async criar(data: {
    professorId: string; dataHoraInicio: string; duracao?: number
    capacidade?: number; sala: string; tipo?: string; modalidade?: string; observacoes?: string | null
  }): Promise<Aula> {
    const validado = createAulaSchema.parse(data)

    const professor = await prisma.professor.findUnique({ where: { id: validado.professorId } })
    if (!professor) throw ValidationError.forField('professorId', AGENDA_ERRORS.PROFESSOR_NOT_FOUND)

    const dataHoraInicio = new Date(validado.dataHoraInicio)
    const conflito = await this.repository.findConflito(validado.professorId, dataHoraInicio, validado.duracao)
    if (conflito) throw AppError.conflict(AGENDA_ERRORS.CONFLITO_HORARIO)

    const aula = await this.repository.create({
      professorId: validado.professorId,
      dataHoraInicio,
      duracao: validado.duracao,
      capacidade: validado.capacidade,
      sala: validado.sala,
      tipo: validado.tipo as any,
      modalidade: validado.modalidade as any,
      observacoes: validado.observacoes,
    })

    eventBus.emit('aula.criada', { id: aula.id })
    logInfo('Aula criada', { id: aula.id })
    return aula
  }

  async buscarPorId(id: string): Promise<Aula> {
    const aula = await this.repository.findById(id)
    if (!aula) throw AppError.notFound('Aula', id)
    return aula
  }

  async listar(params: { professorId?: string; status?: string; tipo?: string; modalidade?: string; dataInicio?: string; dataFim?: string; page?: number; limit?: number }) {
    const validado = listAulasSchema.parse(params)
    const { aulas, total } = await this.repository.findAll({
      professorId: validado.professorId,
      status: validado.status,
      tipo: validado.tipo,
      modalidade: validado.modalidade,
      dataInicio: validado.dataInicio ? new Date(validado.dataInicio) : undefined,
      dataFim: validado.dataFim ? new Date(validado.dataFim) : undefined,
      page: validado.page,
      limit: validado.limit,
    })
    return { aulas, total, page: validado.page, limit: validado.limit, totalPages: Math.ceil(total / validado.limit) }
  }

  async atualizar(id: string, data: UpdateAulaData): Promise<Aula> {
    const aulaAtual = await this.buscarPorId(id)
    if (aulaAtual.status === 'REALIZADA' || aulaAtual.status === 'CANCELADA') {
      throw AppError.badRequest(AGENDA_ERRORS.AULA_ENCERRADA)
    }

    const validado = updateAulaSchema.parse(data)

    if (validado.professorId || validado.dataHoraInicio) {
      const professorId = validado.professorId || aulaAtual.professorId
      const dataHoraInicio = validado.dataHoraInicio ? new Date(validado.dataHoraInicio) : aulaAtual.dataHoraInicio
      const duracao = validado.duracao || aulaAtual.duracao
      const conflito = await this.repository.findConflito(professorId, dataHoraInicio, duracao, id)
      if (conflito) throw AppError.conflict(AGENDA_ERRORS.CONFLITO_HORARIO)
    }

    const aula = await this.repository.update(id, {
      ...(validado.professorId !== undefined && { professorId: validado.professorId }),
      ...(validado.dataHoraInicio !== undefined && { dataHoraInicio: new Date(validado.dataHoraInicio) }),
      ...(validado.duracao !== undefined && { duracao: validado.duracao }),
      ...(validado.capacidade !== undefined && { capacidade: validado.capacidade }),
      ...(validado.sala !== undefined && { sala: validado.sala }),
      ...(validado.tipo !== undefined && { tipo: validado.tipo as any }),
      ...(validado.modalidade !== undefined && { modalidade: validado.modalidade as any }),
      ...(validado.observacoes !== undefined && { observacoes: validado.observacoes }),
      ...(validado.status !== undefined && { status: validado.status as any }),
    })

    if (validado.status === 'CANCELADA') {
      eventBus.emit('aula.cancelada', { id: aula.id })
    }

    logInfo('Aula atualizada', { id })
    return aula
  }

  async cancelar(id: string): Promise<Aula> {
    const aulaAtual = await this.buscarPorId(id)
    if (aulaAtual.status !== 'AGENDADA' && aulaAtual.status !== 'ADIADA') {
      throw AppError.badRequest(AGENDA_ERRORS.AULA_ENCERRADA)
    }
    const aula = await this.repository.update(id, { status: 'CANCELADA' })
    eventBus.emit('aula.cancelada', { id: aula.id })
    logInfo('Aula cancelada', { id })
    return aula
  }
}

export const agendaService = new AgendaService(new AgendaRepository())
