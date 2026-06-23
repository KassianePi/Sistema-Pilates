import { PresencaRepository } from './presenca.repository'
import { AppError, ValidationError } from '../../shared/errors'
import { logInfo } from '../../shared/utils'
import { createPresencaSchema, updatePresencaSchema, listPresencasSchema } from '../../shared/schemas'
import { PRESENCA_ERRORS } from './presenca.constants'
import { prisma } from '../../database/prisma.client'
import { eventBus } from '../../events/event-bus'
import type { Presenca } from './presenca.types'

export class PresencaService {
  constructor(private repository: PresencaRepository) {}

  async registrar(data: {
    alunoId: string
    aulaId: string
    status?: string
    dataRegistro?: string
  }): Promise<Presenca> {
    const validado = createPresencaSchema.parse(data)

    const [aluno, aula] = await Promise.all([
      prisma.aluno.findUnique({ where: { id: validado.alunoId } }),
      prisma.aula.findUnique({ where: { id: validado.aulaId } }),
    ])

    if (!aluno) throw ValidationError.forField('alunoId', PRESENCA_ERRORS.ALUNO_NOT_FOUND)
    if (!aula) throw ValidationError.forField('aulaId', PRESENCA_ERRORS.AULA_NOT_FOUND)
    if (aula.status === 'CANCELADA') throw AppError.badRequest(PRESENCA_ERRORS.AULA_ENCERRADA)

    const jaRegistrada = await this.repository.findByAlunoAula(validado.alunoId, validado.aulaId)
    if (jaRegistrada) throw AppError.conflict(PRESENCA_ERRORS.JA_REGISTRADA)

    const presenca = await this.repository.create({
      alunoId: validado.alunoId,
      aulaId: validado.aulaId,
      status: validado.status as any,
      dataRegistro: validado.dataRegistro ? new Date(validado.dataRegistro) : new Date(),
    })

    eventBus.emit('presenca.registrada', { presencaId: presenca.id, alunoId: presenca.alunoId })
    logInfo('Presença registrada', { id: presenca.id })
    return presenca
  }

  async buscarPorId(id: string): Promise<Presenca> {
    const presenca = await this.repository.findById(id)
    if (!presenca) throw AppError.notFound('Presença', id)
    return presenca
  }

  async listar(params: {
    alunoId?: string
    aulaId?: string
    status?: string
    dataInicio?: string
    dataFim?: string
    page?: number
    limit?: number
  }) {
    const validado = listPresencasSchema.parse(params)
    const { presencas, total } = await this.repository.findAll({
      alunoId: validado.alunoId,
      aulaId: validado.aulaId,
      status: validado.status,
      dataInicio: validado.dataInicio ? new Date(validado.dataInicio) : undefined,
      dataFim: validado.dataFim ? new Date(validado.dataFim) : undefined,
      page: validado.page,
      limit: validado.limit,
    })
    return {
      presencas,
      total,
      page: validado.page,
      limit: validado.limit,
      totalPages: Math.ceil(total / validado.limit),
    }
  }

  async atualizar(id: string, data: { status: string }): Promise<Presenca> {
    await this.buscarPorId(id)
    const validado = updatePresencaSchema.parse(data)
    const presenca = await this.repository.update(id, { status: validado.status as any })
    logInfo('Presença atualizada', { id })
    return presenca
  }

  async registrarBatch(
    aulaId: string,
    presencas: Array<{ alunoId: string; status: 'PRESENTE' | 'AUSENTE' | 'JUSTIFICADO' }>,
  ): Promise<{ registros: number; aulaStatus: string }> {
    const aula = await prisma.aula.findUnique({ where: { id: aulaId } })
    if (!aula) throw AppError.notFound('Aula', aulaId)
    if (aula.status === 'CANCELADA') throw AppError.badRequest('Não é possível registrar presenças em aula cancelada')

    // Segurança: só é permitido registrar presença de alunos matriculados (inscrição ATIVA).
    const inscritos = await prisma.inscricaoAula.findMany({
      where: { aulaId, status: 'ATIVA' } as any,
      select: { alunoId: true },
    })
    const matriculados = new Set(inscritos.map((i) => i.alunoId))
    const naoMatriculados = presencas.filter((p) => !matriculados.has(p.alunoId))
    if (naoMatriculados.length > 0) {
      throw AppError.badRequest('Só é possível registrar presença de alunos matriculados na aula.')
    }

    const agora = new Date()
    await prisma.$transaction(async (tx) => {
      for (const item of presencas) {
        await tx.presenca.upsert({
          where: { alunoId_aulaId: { alunoId: item.alunoId, aulaId } },
          update: { status: item.status as any },
          create: {
            alunoId: item.alunoId,
            aulaId,
            status: item.status as any,
            dataRegistro: agora,
          },
        })
      }
      await tx.aula.update({ where: { id: aulaId }, data: { status: 'REALIZADA' } })
    })

    eventBus.emit('aula.realizada', { aulaId, totalPresentes: presencas.filter((p) => p.status === 'PRESENTE').length })
    logInfo('Presenças registradas em lote', { aulaId, total: presencas.length })
    return { registros: presencas.length, aulaStatus: 'REALIZADA' }
  }
}

export const presencaService = new PresencaService(new PresencaRepository())
