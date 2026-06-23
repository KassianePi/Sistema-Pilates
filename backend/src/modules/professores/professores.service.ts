import { ProfessoresRepository } from './professores.repository'
import { AppError, ValidationError } from '../../shared/errors'
import { logInfo } from '../../shared/utils'
import { hashPassword } from '../../shared/utils/hash'
import { createProfessorSchema, updateProfessorSchema, listProfessoresSchema } from '../../shared/schemas'
import { PROFESSORES_ERRORS } from './professores.constants'
import { prisma } from '../../database/prisma.client'
import type { Professor, CreateProfessorData, UpdateProfessorData } from './professores.types'

export class ProfessoresService {
  constructor(private repository: ProfessoresRepository) {}

  async criar(data: {
    email: string
    nomeCompleto: string
    cpf: string
    telefone?: string | null
    senha: string
    especialidade?: string | null
    bio?: string | null
  }): Promise<Professor> {
    const validado = createProfessorSchema.parse(data)

    const emailExistente = await prisma.usuario.findUnique({ where: { email: validado.email } })
    if (emailExistente) throw ValidationError.forField('email', PROFESSORES_ERRORS.EMAIL_DUPLICADO)

    const cpfExistente = await prisma.usuario.findUnique({ where: { cpf: validado.cpf } })
    if (cpfExistente) throw ValidationError.forField('cpf', PROFESSORES_ERRORS.CPF_DUPLICADO)

    const senhaHash = await hashPassword(validado.senha)
    const professor = await this.repository.create({
      email: validado.email,
      nomeCompleto: validado.nomeCompleto,
      cpf: validado.cpf,
      telefone: validado.telefone,
      senhaHash,
      especialidade: validado.especialidade,
      bio: validado.bio,
    })

    logInfo('Professor criado', { id: professor.id })
    return professor
  }

  async buscarPorId(id: string): Promise<Professor> {
    const professor = await this.repository.findById(id)
    if (!professor) throw AppError.notFound('Professor', id)
    return professor
  }

  async listar(params: { status?: string; search?: string; page?: number; limit?: number }) {
    const validado = listProfessoresSchema.parse(params)
    const { professores, total } = await this.repository.findAll({
      status: validado.status,
      search: validado.search,
      page: validado.page,
      limit: validado.limit,
    })
    return {
      professores,
      total,
      page: validado.page,
      limit: validado.limit,
      totalPages: Math.ceil(total / validado.limit),
    }
  }

  async atualizar(id: string, data: UpdateProfessorData & { email?: string; senha?: string }): Promise<Professor> {
    const professorAtual = await this.buscarPorId(id)
    const validado = updateProfessorSchema.parse(data)

    if (validado.email) {
      const existente = await prisma.usuario.findUnique({ where: { email: validado.email } })
      if (existente && existente.id !== professorAtual.usuarioId) {
        throw ValidationError.forField('email', PROFESSORES_ERRORS.EMAIL_DUPLICADO)
      }
    }

    const senhaHash = validado.senha ? await hashPassword(validado.senha) : undefined
    const professor = await this.repository.update(id, { ...(validado as any), senhaHash })
    logInfo('Professor atualizado', { id })
    return professor
  }

  async alterarStatus(id: string, ativo: boolean): Promise<Professor> {
    const professor = await this.buscarPorId(id)
    const novoStatus = ativo ? 'ATIVO' : 'INATIVO'

    await prisma.$transaction(async (tx) => {
      await tx.professor.update({ where: { id }, data: { status: novoStatus as any } })
      await tx.usuario.update({ where: { id: professor.usuarioId }, data: { status: novoStatus as any } })
    })

    logInfo(`Professor ${novoStatus.toLowerCase()}`, { id })
    return this.buscarPorId(id)
  }

  async excluir(id: string): Promise<void> {
    await this.buscarPorId(id)
    const totalAulas = await this.repository.countAulas(id)
    if (totalAulas > 0) throw AppError.badRequest(PROFESSORES_ERRORS.COM_AULAS)
    await this.repository.delete(id)
    logInfo('Professor excluído', { id })
  }
}

export const professoresService = new ProfessoresService(new ProfessoresRepository())
