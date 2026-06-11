import { AgendaRepository } from './agenda.repository'
import { AppError, ValidationError } from '../../shared/errors'
import { logInfo } from '../../shared/utils'
import { createAulaSchema, updateAulaSchema, listAulasSchema } from '../../shared/schemas'
import { AGENDA_ERRORS } from './agenda.constants'
import { prisma } from '../../database/prisma.client'
import { eventBus } from '../../events/event-bus'
import { notificacoesService } from '../notificacoes/notificacoes.service'
import type { Aula, UpdateAulaData } from './agenda.types'

export class AgendaService {
  constructor(private repository: AgendaRepository) {}

  async criar(data: {
    professorId: string; dataHoraInicio: string; duracao?: number
    capacidade?: number; sala: string; tipo?: string; categoria?: string; modalidadeId?: string | null; observacoes?: string | null
  }): Promise<Aula> {
    const validado = createAulaSchema.parse(data)

    const professor = await prisma.professor.findUnique({ where: { id: validado.professorId } })
    if (!professor) throw ValidationError.forField('professorId', AGENDA_ERRORS.PROFESSOR_NOT_FOUND)

    if (validado.modalidadeId) {
      const modalidade = await prisma.modalidade.findUnique({ where: { id: validado.modalidadeId } })
      if (!modalidade) throw ValidationError.forField('modalidadeId', 'Modalidade não encontrada')
      if (!modalidade.ativo) throw ValidationError.forField('modalidadeId', 'A modalidade selecionada está inativa')
    }

    const dataHoraInicio = new Date(validado.dataHoraInicio)
    const conflito = await this.repository.findConflito(validado.professorId, dataHoraInicio, validado.duracao)
    if (conflito) throw AppError.conflict(AGENDA_ERRORS.CONFLITO_HORARIO)

    const aula = await this.repository.create({
      professorId: validado.professorId,
      modalidadeId: validado.modalidadeId ?? null,
      dataHoraInicio,
      duracao: validado.duracao,
      capacidade: validado.capacidade,
      sala: validado.sala,
      tipo: validado.tipo as any,
      categoria: validado.categoria as any,
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

  async listar(params: { professorId?: string; status?: string; tipo?: string; categoria?: string; modalidadeId?: string; dataInicio?: string; dataFim?: string; page?: number; limit?: number }) {
    const validado = listAulasSchema.parse(params)
    const { aulas, total } = await this.repository.findAll({
      professorId: validado.professorId,
      status: validado.status,
      tipo: validado.tipo,
      categoria: validado.categoria,
      modalidadeId: validado.modalidadeId,
      dataInicio: validado.dataInicio ? new Date(validado.dataInicio) : undefined,
      dataFim: validado.dataFim ? new Date(validado.dataFim) : undefined,
      page: validado.page,
      limit: validado.limit,
    })
    return { aulas, total, page: validado.page, limit: validado.limit, totalPages: Math.ceil(total / validado.limit) }
  }

  /**
   * Lista aulas para o portal do aluno, segmentadas por escopo.
   * Resolve o alunoId a partir do usuário autenticado.
   */
  async listarParaAluno(usuarioId: string, escopo: 'minhas' | 'gerais' | 'historico', page: number, limit: number) {
    const aluno = await prisma.aluno.findUnique({ where: { usuarioId }, select: { id: true } })
    if (!aluno) throw AppError.notFound('Aluno', usuarioId)

    const { aulas, total } = await this.repository.findForAluno({ alunoId: aluno.id, escopo, page, limit })
    return { aulas, total, page, limit, totalPages: Math.ceil(total / limit) }
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

    if (validado.modalidadeId) {
      const modalidade = await prisma.modalidade.findUnique({ where: { id: validado.modalidadeId } })
      if (!modalidade) throw ValidationError.forField('modalidadeId', 'Modalidade não encontrada')
      if (!modalidade.ativo) throw ValidationError.forField('modalidadeId', 'A modalidade selecionada está inativa')
    }

    const aula = await this.repository.update(id, {
      ...(validado.professorId !== undefined && { professorId: validado.professorId }),
      ...(validado.dataHoraInicio !== undefined && { dataHoraInicio: new Date(validado.dataHoraInicio) }),
      ...(validado.duracao !== undefined && { duracao: validado.duracao }),
      ...(validado.capacidade !== undefined && { capacidade: validado.capacidade }),
      ...(validado.sala !== undefined && { sala: validado.sala }),
      ...(validado.tipo !== undefined && { tipo: validado.tipo as any }),
      ...(validado.categoria !== undefined && { categoria: validado.categoria as any }),
      ...(validado.modalidadeId !== undefined && { modalidadeId: validado.modalidadeId }),
      ...(validado.observacoes !== undefined && { observacoes: validado.observacoes }),
      ...(validado.status !== undefined && { status: validado.status as any }),
    })

    if (validado.status === 'CANCELADA') {
      eventBus.emit('aula.cancelada', { id: aula.id })
      const dataFmt = aulaAtual.dataHoraInicio.toLocaleDateString('pt-BR')
      await notificacoesService.notificarAdmins('Aula cancelada', `A aula do dia ${dataFmt} foi cancelada.`).catch(() => {/* silencioso */})
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
    const dataFmt = aulaAtual.dataHoraInicio.toLocaleDateString('pt-BR')
    await notificacoesService.notificarAdmins('Aula cancelada', `A aula do dia ${dataFmt} foi cancelada.`).catch(() => {/* silencioso */})
    return aula
  }
}

export const agendaService = new AgendaService(new AgendaRepository())
