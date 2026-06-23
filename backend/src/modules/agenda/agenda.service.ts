import { AgendaRepository } from './agenda.repository'
import { AppError, ValidationError } from '../../shared/errors'
import { logInfo } from '../../shared/utils'
import {
  createAulaSchema,
  updateAulaSchema,
  listAulasSchema,
  justificativaAulaSchema,
  reagendarAulaSchema,
  matricularAulaSchema,
} from '../../shared/schemas'
import { AGENDA_ERRORS } from './agenda.constants'
import { prisma } from '../../database/prisma.client'
import { eventBus } from '../../events/event-bus'
import { notificacoesService } from '../notificacoes/notificacoes.service'
import type { Aula, UpdateAulaData } from './agenda.types'

/** Status em que a aula é considerada encerrada e não admite novas ações de gestão. */
const STATUS_ENCERRADOS: ReadonlyArray<string> = ['REALIZADA', 'CANCELADA', 'EXCLUIDA']

export class AgendaService {
  constructor(private repository: AgendaRepository) {}

  async criar(data: {
    professorId: string
    dataHoraInicio: string
    duracao?: number
    capacidade?: number
    sala: string
    tipo?: string
    categoria?: string
    modalidadeId?: string | null
    observacoes?: string | null
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

  async listar(params: {
    professorId?: string
    status?: string
    tipo?: string
    categoria?: string
    modalidadeId?: string
    dataInicio?: string
    dataFim?: string
    page?: number
    limit?: number
  }) {
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

    // Não permitir reduzir a capacidade abaixo do número de matriculados ativos.
    if (validado.capacidade !== undefined) {
      const matriculados = await this.repository.countInscricoesAtivas(id)
      if (validado.capacidade < matriculados) {
        throw ValidationError.forField(
          'capacidade',
          `A aula já tem ${matriculados} aluno(s) matriculado(s). Reduza as matrículas antes de diminuir a capacidade.`,
        )
      }
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
      await notificacoesService
        .notificarAdmins('Aula cancelada', `A aula do dia ${dataFmt} foi cancelada.`)
        .catch(() => {
          /* silencioso */
        })
    }

    logInfo('Aula atualizada', { id })
    return aula
  }

  /**
   * Notifica os alunos afetados e os administradores sobre uma alteração de status
   * da aula, incluindo a justificativa. Para aulas da grade GERAL (que todos frequentam)
   * notifica todos os alunos ativos; para aulas específicas, apenas os inscritos (presença).
   */
  private async notificarEnvolvidos(
    aula: { id: string; categoria: string },
    tituloAluno: string,
    mensagemAluno: string,
    tituloAdmin: string,
    mensagemAdmin: string,
  ): Promise<void> {
    try {
      let usuarioIds: string[]
      if (aula.categoria === 'GERAL') {
        const alunos = await prisma.aluno.findMany({ where: { status: 'ATIVO' }, select: { usuarioId: true } })
        usuarioIds = alunos.map((a) => a.usuarioId)
      } else {
        const presencas = await prisma.presenca.findMany({
          where: { aulaId: aula.id } as any,
          select: { aluno: { select: { usuarioId: true } } },
        })
        usuarioIds = presencas.map((p) => p.aluno.usuarioId)
      }
      await Promise.all(
        usuarioIds.map((usuarioId) =>
          notificacoesService.criar({ usuarioId, tipo: 'AULA_AGENDADA', titulo: tituloAluno, mensagem: mensagemAluno }),
        ),
      )
      await notificacoesService.notificarAdmins(tituloAdmin, mensagemAdmin)
    } catch {
      /* notificação não deve bloquear a operação principal */
    }
  }

  async cancelar(id: string, usuarioId: string, data: { justificativa: string }): Promise<Aula> {
    const aulaAtual = await this.buscarPorId(id)
    if (aulaAtual.status !== 'AGENDADA' && aulaAtual.status !== 'ADIADA' && aulaAtual.status !== 'SUSPENSA') {
      throw AppError.badRequest(AGENDA_ERRORS.AULA_ENCERRADA)
    }
    const { justificativa } = justificativaAulaSchema.parse(data)

    const aula = await this.repository.update(id, {
      status: 'CANCELADA',
      justificativa,
      statusAlteradoEm: new Date(),
      statusAlteradoPorId: usuarioId,
    })
    eventBus.emit('aula.cancelada', { id: aula.id })
    logInfo('Aula cancelada', { id })

    const dataFmt = aulaAtual.dataHoraInicio.toLocaleDateString('pt-BR')
    await this.notificarEnvolvidos(
      aulaAtual,
      'Aula cancelada',
      `A aula do dia ${dataFmt} foi cancelada. Motivo: ${justificativa}`,
      'Aula cancelada',
      `A aula do dia ${dataFmt} foi cancelada. Motivo: ${justificativa}`,
    )
    return aula
  }

  async suspender(id: string, usuarioId: string, data: { justificativa: string }): Promise<Aula> {
    const aulaAtual = await this.buscarPorId(id)
    if (aulaAtual.status !== 'AGENDADA' && aulaAtual.status !== 'ADIADA') {
      throw AppError.badRequest(AGENDA_ERRORS.AULA_ENCERRADA)
    }
    const { justificativa } = justificativaAulaSchema.parse(data)

    const aula = await this.repository.update(id, {
      status: 'SUSPENSA',
      justificativa,
      statusAlteradoEm: new Date(),
      statusAlteradoPorId: usuarioId,
    })
    logInfo('Aula suspensa', { id })

    const dataFmt = aulaAtual.dataHoraInicio.toLocaleDateString('pt-BR')
    await this.notificarEnvolvidos(
      aulaAtual,
      'Aula suspensa',
      `A aula do dia ${dataFmt} foi suspensa temporariamente. Motivo: ${justificativa}`,
      'Aula suspensa',
      `A aula do dia ${dataFmt} foi suspensa. Motivo: ${justificativa}`,
    )
    return aula
  }

  async reagendar(
    id: string,
    usuarioId: string,
    data: { dataHoraInicio: string; justificativa: string },
  ): Promise<Aula> {
    const aulaAtual = await this.buscarPorId(id)
    if (STATUS_ENCERRADOS.includes(aulaAtual.status)) {
      throw AppError.badRequest(AGENDA_ERRORS.AULA_ENCERRADA)
    }
    const { dataHoraInicio, justificativa } = reagendarAulaSchema.parse(data)

    const novaData = new Date(dataHoraInicio)
    const conflito = await this.repository.findConflito(aulaAtual.professorId, novaData, aulaAtual.duracao, id)
    if (conflito) throw AppError.conflict(AGENDA_ERRORS.CONFLITO_HORARIO)

    const aula = await this.repository.update(id, {
      status: 'AGENDADA',
      dataHoraInicio: novaData,
      dataHoraAnterior: aulaAtual.dataHoraInicio,
      justificativa,
      statusAlteradoEm: new Date(),
      statusAlteradoPorId: usuarioId,
    })
    logInfo('Aula reagendada', { id })

    const antesFmt = aulaAtual.dataHoraInicio.toLocaleString('pt-BR')
    const depoisFmt = novaData.toLocaleString('pt-BR')
    await this.notificarEnvolvidos(
      aulaAtual,
      'Aula reagendada',
      `A aula de ${antesFmt} foi reagendada para ${depoisFmt}. Motivo: ${justificativa}`,
      'Aula reagendada',
      `A aula de ${antesFmt} foi reagendada para ${depoisFmt}. Motivo: ${justificativa}`,
    )
    return aula
  }

  /** Exclusão lógica (soft delete): a aula deixa de aparecer nas listagens ativas,
   *  mas o registro e a justificativa permanecem visíveis ao aluno. */
  async excluir(id: string, usuarioId: string, data: { justificativa: string }): Promise<Aula> {
    const aulaAtual = await this.buscarPorId(id)
    if (aulaAtual.status === 'EXCLUIDA') {
      throw AppError.badRequest('Aula já excluída')
    }
    const { justificativa } = justificativaAulaSchema.parse(data)

    const aula = await this.repository.update(id, {
      status: 'EXCLUIDA',
      justificativa,
      statusAlteradoEm: new Date(),
      statusAlteradoPorId: usuarioId,
    })
    logInfo('Aula excluída (soft delete)', { id })

    const dataFmt = aulaAtual.dataHoraInicio.toLocaleDateString('pt-BR')
    await this.notificarEnvolvidos(
      aulaAtual,
      'Aula excluída',
      `A aula do dia ${dataFmt} foi removida da agenda. Motivo: ${justificativa}`,
      'Aula excluída',
      `A aula do dia ${dataFmt} foi removida da agenda. Motivo: ${justificativa}`,
    )
    return aula
  }

  // ===================== MATRÍCULA =====================

  async listarInscritos(aulaId: string) {
    await this.buscarPorId(aulaId)
    return this.repository.findInscritos(aulaId)
  }

  async matricular(aulaId: string, data: { alunoIds: string[] }) {
    const aula = await this.buscarPorId(aulaId)
    if (aula.status === 'CANCELADA' || aula.status === 'EXCLUIDA') {
      throw AppError.badRequest('Não é possível matricular alunos em uma aula cancelada ou excluída')
    }
    const { alunoIds } = matricularAulaSchema.parse(data)
    if (alunoIds.length > aula.capacidade) {
      throw ValidationError.forField(
        'alunoIds',
        `Capacidade da aula é ${aula.capacidade}. Selecione no máximo ${aula.capacidade} aluno(s).`,
      )
    }
    await this.repository.setInscricoes(aulaId, alunoIds)
    logInfo('Matrículas atualizadas', { aulaId, total: alunoIds.length })
    return this.repository.findInscritos(aulaId)
  }
}

export const agendaService = new AgendaService(new AgendaRepository())
