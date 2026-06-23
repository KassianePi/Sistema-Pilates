import { prisma } from '../../database/prisma.client'
import { AppError } from '../../shared/errors'
import { logDebug, logError } from '../../shared/utils'
import type { Aluno, CreateAlunoData, UpdateAlunoData } from './alunos.types'

const includeRelations = {
  usuario: {
    select: {
      id: true,
      nomeCompleto: true,
      email: true,
      telefone: true,
      cpf: true,
    },
  },
  planoAtual: {
    select: { id: true, nome: true, tipo: true, aulas: true, preco: true },
  },
}

export class AlunosRepository {
  async findById(id: string): Promise<Aluno | null> {
    try {
      return (await prisma.aluno.findUnique({
        where: { id },
        include: includeRelations,
      })) as any
    } catch (error) {
      logError('Erro ao buscar aluno por ID', error as Error, { id })
      throw AppError.internal('Erro ao buscar aluno')
    }
  }

  async findByUsuarioId(usuarioId: string): Promise<Aluno | null> {
    try {
      return (await prisma.aluno.findUnique({
        where: { usuarioId },
        include: includeRelations,
      })) as any
    } catch (error) {
      logError('Erro ao buscar aluno por usuarioId', error as Error)
      throw AppError.internal('Erro ao buscar aluno')
    }
  }

  async findAll(params: {
    status?: string
    planoId?: string
    search?: string
    page: number
    limit: number
  }): Promise<{ alunos: Aluno[]; total: number }> {
    try {
      const { status, planoId, search, page, limit } = params
      const where: Record<string, unknown> = {}
      if (status) where.status = status
      if (planoId) where.planoId = planoId
      if (search) where.usuario = { nomeCompleto: { contains: search } }

      const [alunos, total] = await Promise.all([
        prisma.aluno.findMany({
          where: where as any,
          include: includeRelations,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { criadoEm: 'desc' },
        }),
        prisma.aluno.count({ where: where as any }),
      ])

      return { alunos: alunos as any, total }
    } catch (error) {
      logError('Erro ao listar alunos', error as Error)
      throw AppError.internal('Erro ao listar alunos')
    }
  }

  async create(data: CreateAlunoData): Promise<Aluno> {
    try {
      logDebug('Criando aluno', { email: data.email })
      const result = await prisma.$transaction(async (tx) => {
        const usuario = await tx.usuario.create({
          data: {
            email: data.email,
            nomeCompleto: data.nomeCompleto,
            cpf: data.cpf,
            telefone: data.telefone || null,
            senhaHash: data.senhaHash,
            funcao: 'ALUNO' as any,
            status: 'ATIVO',
          },
        })
        const aluno = await tx.aluno.create({
          data: {
            usuarioId: usuario.id,
            planoId: data.planoId || null,
            dataInicio: data.dataInicio,
            dataNascimento: data.dataNascimento || null,
            endereco: data.endereco || null,
            cidade: data.cidade || null,
            estado: data.estado || null,
            cep: data.cep || null,
            observacoes: data.observacoes || null,
            status: 'ATIVO',
          },
          include: includeRelations,
        })
        return aluno
      })
      return result as any
    } catch (error) {
      logError('Erro ao criar aluno', error as Error, { email: data.email })
      throw AppError.internal('Erro ao criar aluno')
    }
  }

  /**
   * Cria aluno + primeira mensalidade + comprovante de matrícula de forma atômica.
   * Usado no cadastro com plano, onde o comprovante de pagamento é obrigatório.
   */
  async createWithMatricula(
    data: CreateAlunoData,
    matricula: {
      planoId: string
      valor: number
      mesReferencia: Date
      dataVencimento: Date
      comprovante: {
        arquivo: string
        nomeArquivo: string
        tipoArquivo: string
      }
    },
  ): Promise<{ aluno: Aluno; mensalidadeId: string; comprovanteId: string }> {
    try {
      logDebug('Criando aluno com matrícula', { email: data.email })
      return await prisma.$transaction(async (tx) => {
        const usuario = await tx.usuario.create({
          data: {
            email: data.email,
            nomeCompleto: data.nomeCompleto,
            cpf: data.cpf,
            telefone: data.telefone || null,
            senhaHash: data.senhaHash,
            funcao: 'ALUNO' as any,
            status: 'ATIVO',
          },
        })
        const aluno = await tx.aluno.create({
          data: {
            usuarioId: usuario.id,
            planoId: data.planoId || null,
            dataInicio: data.dataInicio,
            dataNascimento: data.dataNascimento || null,
            endereco: data.endereco || null,
            cidade: data.cidade || null,
            estado: data.estado || null,
            cep: data.cep || null,
            observacoes: data.observacoes || null,
            status: 'ATIVO',
          },
          include: includeRelations,
        })
        const mensalidade = await tx.mensalidade.create({
          data: {
            alunoId: aluno.id,
            planoId: matricula.planoId,
            tipo: 'MENSAL' as any,
            mesReferencia: matricula.mesReferencia,
            dataVencimento: matricula.dataVencimento,
            valor: matricula.valor,
            status: 'PENDENTE' as any,
          },
        })
        const comprovante = await tx.comprovantePagemento.create({
          data: {
            mensalidadeId: mensalidade.id,
            alunoId: aluno.id,
            arquivo: matricula.comprovante.arquivo,
            nomeArquivo: matricula.comprovante.nomeArquivo,
            tipoArquivo: matricula.comprovante.tipoArquivo,
            dataEnvio: new Date(),
            status: 'PENDENTE' as any,
          },
        })
        return {
          aluno: aluno as any,
          mensalidadeId: mensalidade.id,
          comprovanteId: comprovante.id,
        }
      })
    } catch (error) {
      logError('Erro ao criar aluno com matrícula', error as Error, {
        email: data.email,
      })
      throw AppError.internal('Erro ao cadastrar aluno')
    }
  }

  async update(id: string, data: UpdateAlunoData): Promise<Aluno> {
    try {
      const aluno = await prisma.aluno.findUnique({ where: { id } })
      if (!aluno) throw AppError.notFound('Aluno', id)

      await prisma.$transaction(async (tx) => {
        if (data.nomeCompleto || data.telefone !== undefined || data.email || data.senhaHash) {
          await tx.usuario.update({
            where: { id: aluno.usuarioId },
            data: {
              ...(data.nomeCompleto && { nomeCompleto: data.nomeCompleto }),
              ...(data.telefone !== undefined && { telefone: data.telefone }),
              ...(data.email && { email: data.email }),
              ...(data.senhaHash && { senhaHash: data.senhaHash }),
            },
          })
        }
        await tx.aluno.update({
          where: { id },
          data: {
            ...(data.planoId !== undefined && { planoId: data.planoId }),
            ...(data.dataNascimento !== undefined && {
              dataNascimento: data.dataNascimento,
            }),
            ...(data.endereco !== undefined && { endereco: data.endereco }),
            ...(data.cidade !== undefined && { cidade: data.cidade }),
            ...(data.estado !== undefined && { estado: data.estado }),
            ...(data.cep !== undefined && { cep: data.cep }),
            ...(data.observacoes !== undefined && {
              observacoes: data.observacoes,
            }),
            ...(data.status && { status: data.status }),
          },
        })
      })

      return (await this.findById(id)) as Aluno
    } catch (error) {
      if (error instanceof AppError) throw error
      logError('Erro ao atualizar aluno', error as Error, { id })
      throw AppError.internal('Erro ao atualizar aluno')
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const aluno = await prisma.aluno.findUnique({ where: { id } })
      if (!aluno) throw AppError.notFound('Aluno', id)
      await prisma.$transaction(async (tx) => {
        await tx.aluno.delete({ where: { id } })
        await tx.usuario.delete({ where: { id: aluno.usuarioId } })
      })
    } catch (error) {
      if (error instanceof AppError) throw error
      logError('Erro ao excluir aluno', error as Error, { id })
      throw AppError.internal('Erro ao excluir aluno')
    }
  }
}

export const alunosRepository = new AlunosRepository()
