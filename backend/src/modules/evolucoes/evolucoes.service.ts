import { EvolucoesRepository } from './evolucoes.repository'
import { AppError, ValidationError } from '../../shared/errors'
import { logInfo } from '../../shared/utils'
import { createEvolucaoSchema, updateEvolucaoSchema, listEvolucoesSchema } from '../../shared/schemas'
import { EVOLUCOES_ERRORS } from './evolucoes.constants'
import { prisma } from '../../database/prisma.client'
import type { EvolucaoAula, CreateEvolucaoData, UpdateEvolucaoData } from './evolucoes.types'

export class EvolucoesService {
  constructor(private repository: EvolucoesRepository) {}

  async criar(data: CreateEvolucaoData): Promise<EvolucaoAula> {
    const validado = createEvolucaoSchema.parse(data)

    const [aluno, aula] = await Promise.all([
      prisma.aluno.findUnique({ where: { id: validado.alunoId } }),
      prisma.aula.findUnique({ where: { id: validado.aulaId } }),
    ])
    if (!aluno) throw ValidationError.forField('alunoId', EVOLUCOES_ERRORS.ALUNO_NOT_FOUND)
    if (!aula) throw ValidationError.forField('aulaId', EVOLUCOES_ERRORS.AULA_NOT_FOUND)

    const evolucao = await this.repository.create({
      alunoId: validado.alunoId,
      aulaId: validado.aulaId,
      registradoPorId: data.registradoPorId,
      observacao: validado.observacao,
    })

    logInfo('Evolução registrada', { id: evolucao.id, alunoId: evolucao.alunoId, aulaId: evolucao.aulaId })
    return evolucao
  }

  async buscarPorId(id: string): Promise<EvolucaoAula> {
    const evolucao = await this.repository.findById(id)
    if (!evolucao) throw AppError.notFound('Evolução', id)
    return evolucao
  }

  async listar(params: { alunoId?: string; aulaId?: string; page?: number; limit?: number }) {
    const validado = listEvolucoesSchema.parse(params)
    const { evolucoes, total } = await this.repository.findAll({
      alunoId: validado.alunoId,
      aulaId: validado.aulaId,
      page: validado.page,
      limit: validado.limit,
    })
    return {
      evolucoes,
      total,
      page: validado.page,
      limit: validado.limit,
      totalPages: Math.ceil(total / validado.limit),
    }
  }

  async atualizar(id: string, data: UpdateEvolucaoData): Promise<EvolucaoAula> {
    await this.buscarPorId(id)
    const validado = updateEvolucaoSchema.parse(data)
    const evolucao = await this.repository.update(id, validado)
    logInfo('Evolução atualizada', { id })
    return evolucao
  }

  async excluir(id: string): Promise<void> {
    await this.buscarPorId(id)
    await this.repository.delete(id)
    logInfo('Evolução excluída', { id })
  }
}

export const evolucoesService = new EvolucoesService(new EvolucoesRepository())
