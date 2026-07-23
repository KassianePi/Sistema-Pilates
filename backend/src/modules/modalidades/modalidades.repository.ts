import { prisma } from '../../database/prisma.client'
import { AppError } from '../../shared/errors'
import { logError } from '../../shared/utils'
import type { Modalidade } from './modalidades.types'

export class ModalidadesRepository {
  async findAll(apenasAtivos = false): Promise<Modalidade[]> {
    try {
      return prisma.modalidade.findMany({
        where: apenasAtivos ? { ativo: true } : undefined,
        orderBy: { nome: 'asc' },
      }) as any
    } catch (error) {
      logError('Erro ao listar modalidades', error as Error)
      throw AppError.internal('Erro ao listar modalidades')
    }
  }

  async findById(id: string): Promise<Modalidade | null> {
    try {
      return prisma.modalidade.findUnique({ where: { id } }) as any
    } catch (error) {
      logError('Erro ao buscar modalidade', error as Error, { id })
      throw AppError.internal('Erro ao buscar modalidade')
    }
  }

  async findByNome(nome: string): Promise<Modalidade | null> {
    try {
      return prisma.modalidade.findUnique({ where: { nome } }) as any
    } catch (error) {
      logError('Erro ao buscar modalidade por nome', error as Error)
      throw AppError.internal('Erro ao buscar modalidade')
    }
  }

  async create(data: { nome: string; descricao?: string | null; valor?: number | null }): Promise<Modalidade> {
    try {
      return prisma.modalidade.create({ data }) as any
    } catch (error) {
      logError('Erro ao criar modalidade', error as Error)
      throw AppError.internal('Erro ao criar modalidade')
    }
  }

  async update(
    id: string,
    data: { nome?: string; descricao?: string | null; valor?: number | null; ativo?: boolean },
  ): Promise<Modalidade> {
    try {
      return prisma.modalidade.update({ where: { id }, data }) as any
    } catch (error) {
      logError('Erro ao atualizar modalidade', error as Error, { id })
      throw AppError.internal('Erro ao atualizar modalidade')
    }
  }

  async countAulas(id: string): Promise<number> {
    try {
      return prisma.aula.count({ where: { modalidadeId: id } })
    } catch (error) {
      logError('Erro ao contar aulas da modalidade', error as Error)
      throw AppError.internal('Erro ao verificar uso da modalidade')
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await prisma.modalidade.delete({ where: { id } })
    } catch (error) {
      logError('Erro ao excluir modalidade', error as Error, { id })
      throw AppError.internal('Erro ao excluir modalidade')
    }
  }
}

export const modalidadesRepository = new ModalidadesRepository()
