import { AlunosRepository } from './alunos.repository'
import { AppError, ValidationError } from '../../shared/errors'
import { logInfo } from '../../shared/utils'
import { hashPassword } from '../../shared/utils/hash'
import { createAlunoSchema, updateAlunoSchema, listAlunosSchema } from '../../shared/schemas'
import { ALUNOS_ERRORS } from './alunos.constants'
import { prisma } from '../../database/prisma.client'
import { registrarLog } from '../auditoria/auditoria.service'
import type { Aluno, UpdateAlunoData } from './alunos.types'

export class AlunosService {
  constructor(private repository: AlunosRepository) {}

  async criar(data: {
    email: string; nomeCompleto: string; cpf: string; telefone?: string | null
    senha: string; planoId?: string | null; dataInicio: string
    dataNascimento?: string | null; endereco?: string | null; cidade?: string | null
    estado?: string | null; cep?: string | null; observacoes?: string | null
  }, realizadoPorId?: string): Promise<Aluno> {
    const validado = createAlunoSchema.parse(data)

    const emailExistente = await prisma.usuario.findUnique({ where: { email: validado.email } })
    if (emailExistente) throw ValidationError.forField('email', ALUNOS_ERRORS.EMAIL_DUPLICADO)

    const cpfExistente = await prisma.usuario.findUnique({ where: { cpf: validado.cpf } })
    if (cpfExistente) throw ValidationError.forField('cpf', ALUNOS_ERRORS.CPF_DUPLICADO)

    if (validado.planoId) {
      const plano = await prisma.plano.findUnique({ where: { id: validado.planoId } })
      if (!plano) throw ValidationError.forField('planoId', ALUNOS_ERRORS.PLANO_NOT_FOUND)
    }

    const senhaHash = await hashPassword(validado.senha)
    const aluno = await this.repository.create({
      email: validado.email,
      nomeCompleto: validado.nomeCompleto,
      cpf: validado.cpf,
      telefone: validado.telefone,
      senhaHash,
      planoId: validado.planoId,
      dataInicio: new Date(validado.dataInicio),
      dataNascimento: validado.dataNascimento ? new Date(validado.dataNascimento) : null,
      endereco: validado.endereco,
      cidade: validado.cidade,
      estado: validado.estado,
      cep: validado.cep,
      observacoes: validado.observacoes,
    })

    logInfo('Aluno criado', { id: aluno.id })
    await registrarLog({ usuarioId: realizadoPorId ?? aluno.usuarioId, acao: 'CREATE', entidade: 'Aluno', entidadeId: aluno.id })
    return aluno
  }

  async buscarPorId(id: string): Promise<Aluno> {
    const aluno = await this.repository.findById(id)
    if (!aluno) throw AppError.notFound('Aluno', id)
    return aluno
  }

  async listar(params: { status?: string; planoId?: string; search?: string; page?: number; limit?: number }) {
    const validado = listAlunosSchema.parse(params)
    const { alunos, total } = await this.repository.findAll({
      status: validado.status,
      planoId: validado.planoId,
      search: validado.search,
      page: validado.page,
      limit: validado.limit,
    })
    return { alunos, total, page: validado.page, limit: validado.limit, totalPages: Math.ceil(total / validado.limit) }
  }

  async atualizar(id: string, data: UpdateAlunoData & { email?: string; senha?: string }, realizadoPorId?: string): Promise<Aluno> {
    const alunoAtual = await this.buscarPorId(id)
    const validado = updateAlunoSchema.parse(data)

    if (validado.email) {
      const existente = await prisma.usuario.findUnique({ where: { email: validado.email } })
      if (existente && existente.id !== alunoAtual.usuarioId) {
        throw ValidationError.forField('email', ALUNOS_ERRORS.EMAIL_DUPLICADO)
      }
    }

    if (validado.planoId) {
      const plano = await prisma.plano.findUnique({ where: { id: validado.planoId } })
      if (!plano) throw ValidationError.forField('planoId', ALUNOS_ERRORS.PLANO_NOT_FOUND)
    }

    const senhaHash = validado.senha ? await hashPassword(validado.senha) : undefined

    const aluno = await this.repository.update(id, {
      ...validado,
      senhaHash,
      dataNascimento: validado.dataNascimento ? new Date(validado.dataNascimento) : undefined,
      status: validado.status as any,
    })
    logInfo('Aluno atualizado', { id })
    if (realizadoPorId) await registrarLog({ usuarioId: realizadoPorId, acao: 'UPDATE', entidade: 'Aluno', entidadeId: id })
    return aluno
  }

  async alterarStatus(id: string, ativo: boolean, realizadoPorId?: string): Promise<Aluno> {
    const aluno = await this.buscarPorId(id)
    const novoStatus = ativo ? 'ATIVO' : 'INATIVO'

    await prisma.$transaction(async (tx) => {
      await tx.aluno.update({ where: { id }, data: { status: novoStatus as any } })
      await tx.usuario.update({ where: { id: aluno.usuarioId }, data: { status: novoStatus as any } })
    })

    logInfo(`Aluno ${novoStatus.toLowerCase()}`, { id })
    if (realizadoPorId) await registrarLog({ usuarioId: realizadoPorId, acao: 'UPDATE', entidade: 'Aluno', entidadeId: id })
    return this.buscarPorId(id)
  }

  async excluir(id: string, realizadoPorId?: string): Promise<void> {
    await this.buscarPorId(id)
    await this.repository.delete(id)
    logInfo('Aluno excluído', { id })
    if (realizadoPorId) await registrarLog({ usuarioId: realizadoPorId, acao: 'DELETE', entidade: 'Aluno', entidadeId: id })
  }
}

export const alunosService = new AlunosService(new AlunosRepository())
