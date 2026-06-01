import { PlanosRepository, planosRepository } from './planos.repository'
import { AppError, ValidationError } from '../../shared/errors'
import { logInfo, logDebug } from '../../shared/utils'
import { createPlanoSchema, updatePlanoSchema, listPlanosSchema } from '../../shared/schemas'
import { PLANOS_ERRORS, PLANOS_ERROR_CODES } from './planos.constants'
import type { Plano, CreatePlanoData, UpdatePlanoData } from './planos.types'

export class PlanosService {
  constructor(private repository: PlanosRepository) {}

  async criar(data: CreatePlanoData): Promise<Plano> {
    const validado = createPlanoSchema.parse({ ...data, preco: Number(data.preco) })

    const existente = await this.repository.findByNome(validado.nome)
    if (existente) {
      throw ValidationError.forField('nome', PLANOS_ERRORS.NOME_DUPLICADO)
    }

    const plano = await this.repository.create({
      nome: validado.nome,
      descricao: validado.descricao,
      tipo: validado.tipo as any,
      aulas: validado.aulas,
      preco: validado.preco,
      ativo: validado.ativo,
    })

    logInfo('Plano criado', { id: plano.id, nome: plano.nome })
    return plano
  }

  async buscarPorId(id: string): Promise<Plano> {
    const plano = await this.repository.findById(id)
    if (!plano) throw AppError.notFound('Plano', id)
    return plano
  }

  async listar(params: { ativo?: boolean; tipo?: string; page?: number; limit?: number }): Promise<{ planos: Plano[]; total: number; page: number; limit: number; totalPages: number }> {
    const validado = listPlanosSchema.parse(params)
    const { planos, total } = await this.repository.findAll({
      ativo: validado.ativo,
      tipo: validado.tipo,
      page: validado.page,
      limit: validado.limit,
    })
    return {
      planos,
      total,
      page: validado.page,
      limit: validado.limit,
      totalPages: Math.ceil(total / validado.limit),
    }
  }

  async atualizar(id: string, data: UpdatePlanoData): Promise<Plano> {
    await this.buscarPorId(id)

    const validado = updatePlanoSchema.parse({ ...data, preco: data.preco !== undefined ? Number(data.preco) : undefined })

    if (validado.nome) {
      const existente = await this.repository.findByNome(validado.nome)
      if (existente && existente.id !== id) {
        throw ValidationError.forField('nome', PLANOS_ERRORS.NOME_DUPLICADO)
      }
    }

    const plano = await this.repository.update(id, {
      nome: validado.nome,
      descricao: validado.descricao,
      tipo: validado.tipo as any,
      aulas: validado.aulas,
      preco: validado.preco,
      ativo: validado.ativo,
    })

    logInfo('Plano atualizado', { id })
    return plano
  }

  async excluir(id: string): Promise<void> {
    await this.buscarPorId(id)

    const totalAlunos = await this.repository.countAlunos(id)
    if (totalAlunos > 0) {
      throw AppError.badRequest(PLANOS_ERRORS.PLANO_COM_ALUNOS)
    }

    await this.repository.delete(id)
    logInfo('Plano excluído', { id })
  }
}

export const planosService = new PlanosService(planosRepository)
