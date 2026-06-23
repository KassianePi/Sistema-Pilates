import { prisma } from '../../database/prisma.client'
import { AppError } from '../../shared/errors'
import { logDebug, logError } from '../../shared/utils'
import type { Professor, CreateProfessorData, UpdateProfessorData } from './professores.types'

const includeUsuario = {
  usuario: { select: { id: true, nomeCompleto: true, email: true, telefone: true, cpf: true } },
}

export class ProfessoresRepository {
  async findById(id: string): Promise<Professor | null> {
    try {
      return (await prisma.professor.findUnique({ where: { id }, include: includeUsuario })) as any
    } catch (error) {
      logError('Erro ao buscar professor por ID', error as Error, { id })
      throw AppError.internal('Erro ao buscar professor')
    }
  }

  async findByUsuarioId(usuarioId: string): Promise<Professor | null> {
    try {
      return (await prisma.professor.findUnique({ where: { usuarioId }, include: includeUsuario })) as any
    } catch (error) {
      logError('Erro ao buscar professor por usuarioId', error as Error, { usuarioId })
      throw AppError.internal('Erro ao buscar professor')
    }
  }

  async findAll(params: {
    status?: string
    search?: string
    page: number
    limit: number
  }): Promise<{ professores: Professor[]; total: number }> {
    try {
      const { status, search, page, limit } = params
      const where: Record<string, unknown> = {}
      if (status) where.status = status
      if (search) {
        where.usuario = { nomeCompleto: { contains: search } }
      }

      const [professores, total] = await Promise.all([
        prisma.professor.findMany({
          where,
          include: includeUsuario,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { criadoEm: 'desc' },
        }),
        prisma.professor.count({ where }),
      ])

      return { professores: professores as any, total }
    } catch (error) {
      logError('Erro ao listar professores', error as Error)
      throw AppError.internal('Erro ao listar professores')
    }
  }

  async create(data: CreateProfessorData): Promise<Professor> {
    try {
      logDebug('Criando professor', { email: data.email })
      const result = await prisma.$transaction(async (tx) => {
        const usuario = await tx.usuario.create({
          data: {
            email: data.email,
            nomeCompleto: data.nomeCompleto,
            cpf: data.cpf,
            telefone: data.telefone || null,
            senhaHash: data.senhaHash,
            funcao: 'PROFESSOR',
            status: 'ATIVO',
          },
        })
        const professor = await tx.professor.create({
          data: {
            usuarioId: usuario.id,
            especialidade: data.especialidade || null,
            bio: data.bio || null,
            status: 'ATIVO',
          },
          include: includeUsuario,
        })
        return professor
      })
      return result as any
    } catch (error) {
      logError('Erro ao criar professor', error as Error, { email: data.email })
      throw AppError.internal('Erro ao criar professor')
    }
  }

  async update(id: string, data: UpdateProfessorData): Promise<Professor> {
    try {
      const professor = await prisma.professor.findUnique({ where: { id } })
      if (!professor) throw AppError.notFound('Professor', id)

      await prisma.$transaction(async (tx) => {
        if (data.nomeCompleto || data.telefone !== undefined || data.email || data.senhaHash) {
          await tx.usuario.update({
            where: { id: professor.usuarioId },
            data: {
              ...(data.nomeCompleto && { nomeCompleto: data.nomeCompleto }),
              ...(data.telefone !== undefined && { telefone: data.telefone }),
              ...(data.email && { email: data.email }),
              ...(data.senhaHash && { senhaHash: data.senhaHash }),
            },
          })
        }
        await tx.professor.update({
          where: { id },
          data: {
            ...(data.especialidade !== undefined && { especialidade: data.especialidade }),
            ...(data.bio !== undefined && { bio: data.bio }),
            ...(data.status && { status: data.status }),
          },
        })
      })

      return (await this.findById(id)) as Professor
    } catch (error) {
      if (error instanceof AppError) throw error
      logError('Erro ao atualizar professor', error as Error, { id })
      throw AppError.internal('Erro ao atualizar professor')
    }
  }

  async countAulas(id: string): Promise<number> {
    try {
      return await prisma.aula.count({ where: { professorId: id, status: 'AGENDADA' } })
    } catch (error) {
      logError('Erro ao contar aulas do professor', error as Error, { id })
      throw AppError.internal('Erro ao verificar aulas do professor')
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const professor = await prisma.professor.findUnique({ where: { id } })
      if (!professor) throw AppError.notFound('Professor', id)
      await prisma.$transaction(async (tx) => {
        await tx.professor.delete({ where: { id } })
        await tx.usuario.delete({ where: { id: professor.usuarioId } })
      })
    } catch (error) {
      if (error instanceof AppError) throw error
      logError('Erro ao excluir professor', error as Error, { id })
      throw AppError.internal('Erro ao excluir professor')
    }
  }
}

export const professoresRepository = new ProfessoresRepository()
