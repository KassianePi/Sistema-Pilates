import { prisma } from '../../database/prisma.client'
import { AppError } from '../../shared/errors'
import { logError } from '../../shared/utils'
import type { Estorno, CreateEstornoData, StatusEstorno } from './estornos.types'

export class EstornosRepository {
  async create(data: CreateEstornoData): Promise<Estorno> {
    try {
      return await prisma.estorno.create({
        data: data as any,
        include: this.includeBasico(),
      }) as any
    } catch (error) {
      logError('Erro ao criar estorno', error as Error)
      throw AppError.internal('Erro ao criar estorno')
    }
  }

  async findById(id: string): Promise<Estorno | null> {
    try {
      return await prisma.estorno.findUnique({
        where: { id },
        include: this.includeBasico(),
      }) as any
    } catch (error) {
      logError('Erro ao buscar estorno', error as Error, { id })
      throw AppError.internal('Erro ao buscar estorno')
    }
  }

  async findByMensalidade(mensalidadeId: string): Promise<Estorno | null> {
    try {
      return await prisma.estorno.findFirst({
        where: { mensalidadeId, status: { not: 'NEGADO' } } as any,
        include: this.includeBasico(),
      }) as any
    } catch (error) {
      logError('Erro ao buscar estorno por mensalidade', error as Error)
      throw AppError.internal('Erro ao buscar estorno')
    }
  }

  async findAll(params: {
    alunoId?: string
    status?: string
    page: number
    limit: number
  }): Promise<{ estornos: Estorno[]; total: number }> {
    try {
      const where: Record<string, unknown> = {}
      if (params.alunoId) where.alunoId = params.alunoId
      if (params.status) where.status = params.status

      const [estornos, total] = await Promise.all([
        prisma.estorno.findMany({
          where: where as any,
          skip: (params.page - 1) * params.limit,
          take: params.limit,
          orderBy: { criadoEm: 'desc' },
          include: this.includeBasico(),
        }),
        prisma.estorno.count({ where: where as any }),
      ])
      return { estornos: estornos as any, total }
    } catch (error) {
      logError('Erro ao listar estornos', error as Error)
      throw AppError.internal('Erro ao listar estornos')
    }
  }

  async updateStatus(id: string, status: StatusEstorno, aprovadoPorId?: string): Promise<Estorno> {
    try {
      return await prisma.estorno.update({
        where: { id },
        data: { status, ...(aprovadoPorId && { aprovadoPorId }) } as any,
        include: this.includeBasico(),
      }) as any
    } catch (error) {
      logError('Erro ao atualizar status do estorno', error as Error, { id })
      throw AppError.internal('Erro ao atualizar estorno')
    }
  }

  private includeBasico() {
    return {
      mensalidade: { include: { plano: { select: { nome: true } } } },
      aluno: { include: { usuario: { select: { nomeCompleto: true } } } },
      aprovadoPor: { select: { nomeCompleto: true } },
    }
  }
}

export const estornosRepository = new EstornosRepository()
