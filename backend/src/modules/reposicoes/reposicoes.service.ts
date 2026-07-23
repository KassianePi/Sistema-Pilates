import { ReposicoesRepository } from './reposicoes.repository'
import { AppError, ValidationError } from '../../shared/errors'
import { logInfo } from '../../shared/utils'
import { solicitarReposicaoSchema, agendarReposicaoSchema, listReposicoesSchema } from '../../shared/schemas'
import { REPOSICOES_ERRORS } from './reposicoes.constants'
import { prisma } from '../../database/prisma.client'
import { eventBus } from '../../events/event-bus'
import { notificacoesService } from '../notificacoes/notificacoes.service'
import type { Reposicao, StatusReposicao } from './reposicoes.types'

const STATUS_CANCELAVEIS: StatusReposicao[] = ['PENDENTE', 'AGENDADA']

export class ReposicoesService {
  constructor(private repository: ReposicoesRepository) {}

  async solicitar(data: { alunoId: string; aulaOriginalId: string; motivo: string }): Promise<Reposicao> {
    const validado = solicitarReposicaoSchema.parse(data)

    const aluno = await prisma.aluno.findUnique({ where: { id: data.alunoId } })
    if (!aluno) throw ValidationError.forField('alunoId', REPOSICOES_ERRORS.ALUNO_NOT_FOUND)

    const aulaOriginal = await prisma.aula.findUnique({ where: { id: validado.aulaOriginalId } })
    if (!aulaOriginal) throw ValidationError.forField('aulaOriginalId', REPOSICOES_ERRORS.AULA_ORIGINAL_NOT_FOUND)
    if (!['REALIZADA', 'CANCELADA'].includes(aulaOriginal.status)) {
      throw AppError.badRequest(REPOSICOES_ERRORS.AULA_ORIGINAL_NAO_OCORREU)
    }

    const inscricao = await prisma.inscricaoAula.findUnique({
      where: { alunoId_aulaId: { alunoId: data.alunoId, aulaId: validado.aulaOriginalId } },
    })
    if (!inscricao) throw AppError.badRequest(REPOSICOES_ERRORS.ALUNO_NAO_MATRICULADO)

    const existente = await this.repository.findPendenteOuAgendadaPorAula(data.alunoId, validado.aulaOriginalId)
    if (existente) throw AppError.conflict(REPOSICOES_ERRORS.JA_EXISTE_SOLICITACAO)

    const reposicao = await this.repository.create({
      alunoId: data.alunoId,
      aulaOriginalId: validado.aulaOriginalId,
      motivo: validado.motivo,
    })

    logInfo('Reposição solicitada', { id: reposicao.id, alunoId: data.alunoId })
    return reposicao
  }

  async buscarPorId(id: string): Promise<Reposicao> {
    const reposicao = await this.repository.findById(id)
    if (!reposicao) throw AppError.notFound('Reposição', id)
    return reposicao
  }

  async listar(params: { alunoId?: string; status?: StatusReposicao; page?: number; limit?: number }) {
    const validado = listReposicoesSchema.parse(params)
    const { reposicoes, total } = await this.repository.findAll({
      alunoId: validado.alunoId,
      status: validado.status as StatusReposicao | undefined,
      page: validado.page,
      limit: validado.limit,
    })
    return {
      reposicoes,
      total,
      page: validado.page,
      limit: validado.limit,
      totalPages: Math.ceil(total / validado.limit),
    }
  }

  async agendar(id: string, data: { aulaReposicaoId: string }): Promise<Reposicao> {
    const validado = agendarReposicaoSchema.parse(data)
    const reposicao = await this.buscarPorId(id)

    if (reposicao.status !== 'PENDENTE') {
      throw AppError.badRequest(REPOSICOES_ERRORS.STATUS_INVALIDO_AGENDAR)
    }

    const aulaOriginal = await prisma.aula.findUnique({ where: { id: reposicao.aulaOriginalId } })
    const aulaReposicao = await prisma.aula.findUnique({ where: { id: validado.aulaReposicaoId } })
    if (!aulaOriginal) throw ValidationError.forField('aulaOriginalId', REPOSICOES_ERRORS.AULA_ORIGINAL_NOT_FOUND)
    if (!aulaReposicao) {
      throw ValidationError.forField('aulaReposicaoId', REPOSICOES_ERRORS.AULA_REPOSICAO_NOT_FOUND)
    }

    const mesmoMes =
      aulaOriginal.dataHoraInicio.getUTCFullYear() === aulaReposicao.dataHoraInicio.getUTCFullYear() &&
      aulaOriginal.dataHoraInicio.getUTCMonth() === aulaReposicao.dataHoraInicio.getUTCMonth()
    if (!mesmoMes) throw ValidationError.forField('aulaReposicaoId', REPOSICOES_ERRORS.FORA_DO_MES)

    const matriculados = await this.repository.countInscricoesAtivas(validado.aulaReposicaoId)
    if (matriculados >= aulaReposicao.capacidade) {
      throw ValidationError.forField('aulaReposicaoId', REPOSICOES_ERRORS.SEM_VAGA)
    }

    const atualizada = await this.repository.agendar(id, reposicao.alunoId, validado.aulaReposicaoId)

    const aluno = await prisma.aluno.findUnique({ where: { id: reposicao.alunoId } })
    if (aluno) {
      const dataFmt = aulaReposicao.dataHoraInicio.toLocaleDateString('pt-BR')
      await notificacoesService
        .criar({
          usuarioId: aluno.usuarioId,
          tipo: 'REPOSICAO_OFERECIDA',
          titulo: 'Reposição agendada',
          mensagem: `Sua reposição foi agendada para ${dataFmt}, na sala ${aulaReposicao.sala}.`,
        })
        .catch(() => {
          /* silencioso */
        })
    }

    logInfo('Reposição agendada', { id, aulaReposicaoId: validado.aulaReposicaoId })
    return atualizada
  }

  async cancelar(id: string): Promise<Reposicao> {
    const reposicao = await this.buscarPorId(id)
    if (!STATUS_CANCELAVEIS.includes(reposicao.status)) {
      throw AppError.badRequest(REPOSICOES_ERRORS.STATUS_INVALIDO_CANCELAR)
    }
    const atualizada = await this.repository.atualizarStatus(id, 'CANCELADA')
    logInfo('Reposição cancelada', { id })
    return atualizada
  }

  /** Fecha o ciclo: chamado quando a aula de destino de uma reposição é marcada como realizada. */
  async processarAulaRealizada(aulaId: string): Promise<void> {
    await this.repository.marcarRealizadasPorAulaDestino(aulaId)
  }
}

export const reposicoesService = new ReposicoesService(new ReposicoesRepository())

// Fecha o ciclo automaticamente: quando a aula de destino é realizada, a reposição também é.
eventBus.on('aula.realizada', async (data: { aulaId: string }) => {
  try {
    await reposicoesService.processarAulaRealizada(data.aulaId)
  } catch {
    /* silencioso */
  }
})
