import { prisma } from '../../database/prisma.client'
import { AppError } from '../../shared/errors'
import { logError } from '../../shared/utils'
import type { Prisma, StatusMensalidade, MetodoPagamento } from '@prisma/client'
import type { Caixa, Mensalidade, Pagamento, AbrirCaixaData, FecharCaixaData, CreateMensalidadeData, CreatePagamentoData } from './financeiro.types'

export class FinanceiroRepository {
  // ===================== CAIXA =====================

  async findCaixaAtivo(): Promise<Caixa | null> {
    try {
      return await prisma.caixa.findFirst({
        where: { dataFechamento: null } as any,
        orderBy: { dataAbertura: 'desc' },
      }) as any
    } catch (error) {
      logError('Erro ao buscar caixa ativo', error as Error)
      throw AppError.internal('Erro ao buscar caixa')
    }
  }

  async findCaixaById(id: string): Promise<Caixa | null> {
    try {
      return await prisma.caixa.findUnique({
        where: { id },
        include: { usuarioAbre: { select: { nomeCompleto: true } } } as any,
      }) as any
    } catch (error) {
      logError('Erro ao buscar caixa', error as Error, { id })
      throw AppError.internal('Erro ao buscar caixa')
    }
  }

  async abrirCaixa(data: AbrirCaixaData): Promise<Caixa> {
    try {
      return await prisma.caixa.create({
        data: {
          usuarioAbreId: data.usuarioId,
          dataAbertura: new Date(),
          saldoAbertura: data.saldoAbertura,
          observacoes: data.observacoes ?? null,
        } as any,
      }) as any
    } catch (error) {
      logError('Erro ao abrir caixa', error as Error)
      throw AppError.internal('Erro ao abrir caixa')
    }
  }

  async fecharCaixa(id: string, usuarioId: string, data: FecharCaixaData): Promise<Caixa> {
    try {
      return await prisma.caixa.update({
        where: { id },
        data: {
          usuarioFechaId: usuarioId,
          dataFechamento: new Date(),
          saldoFechamento: data.saldoFechamento,
          observacoes: data.observacoes ?? null,
        },
      }) as any
    } catch (error) {
      logError('Erro ao fechar caixa', error as Error, { id })
      throw AppError.internal('Erro ao fechar caixa')
    }
  }

  // ===================== MENSALIDADES =====================

  async findMensalidadeById(id: string): Promise<Mensalidade | null> {
    try {
      return await prisma.mensalidade.findUnique({
        where: { id },
        include: {
          aluno: { include: { usuario: { select: { nomeCompleto: true } } } },
          plano: { select: { id: true, nome: true } },
          pagamentos: true,
        },
      }) as any
    } catch (error) {
      logError('Erro ao buscar mensalidade', error as Error, { id })
      throw AppError.internal('Erro ao buscar mensalidade')
    }
  }

  async findMensalidades(params: {
    alunoId?: string
    planoId?: string
    status?: string
    dataInicio?: Date
    dataFim?: Date
    page: number
    limit: number
  }): Promise<{ mensalidades: Mensalidade[]; total: number }> {
    try {
      const { alunoId, planoId, status, dataInicio, dataFim, page, limit } = params

      // Constrói o filtro via spread para evitar erros de atribuição em tipos Prisma
      const where: Prisma.MensalidadeWhereInput = {
        ...(alunoId && { alunoId }),
        ...(planoId && { planoId }),
        ...(status && { status: status as StatusMensalidade }),
        ...((dataInicio ?? dataFim) && {
          dataVencimento: {
            ...(dataInicio && { gte: dataInicio }),
            ...(dataFim && { lte: dataFim }),
          },
        }),
      }

      const [mensalidades, total] = await Promise.all([
        prisma.mensalidade.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { dataVencimento: 'asc' },
          include: {
            aluno: { include: { usuario: { select: { nomeCompleto: true } } } },
            plano: { select: { id: true, nome: true } },
          },
        }),
        prisma.mensalidade.count({ where }),
      ])

      return { mensalidades: mensalidades as any, total }
    } catch (error) {
      logError('Erro ao listar mensalidades', error as Error)
      throw AppError.internal('Erro ao listar mensalidades')
    }
  }

  async createMensalidade(data: CreateMensalidadeData): Promise<Mensalidade> {
    try {
      return await prisma.mensalidade.create({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: {
          alunoId: data.alunoId,
          planoId: data.planoId,
          mesReferencia: data.mesReferencia,
          dataVencimento: data.dataVencimento,
          valor: data.valor,
          desconto: data.desconto ?? 0,
          observacoes: data.observacoes ?? null,
        } as any,
      }) as any
    } catch (error) {
      logError('Erro ao criar mensalidade', error as Error)
      throw AppError.internal('Erro ao criar mensalidade')
    }
  }

  async updateMensalidadeStatus(
    id: string,
    status: string,
    dados?: { dataVencimento?: Date; valor?: number; desconto?: number; observacoes?: string | null },
  ): Promise<Mensalidade> {
    try {
      // UncheckedUpdateInput tem os campos escalares sem ambiguidade com relações
      const data: Prisma.MensalidadeUncheckedUpdateInput = {
        status: status as StatusMensalidade,
        ...(dados?.dataVencimento !== undefined && { dataVencimento: dados.dataVencimento }),
        ...(dados?.valor !== undefined && { valor: dados.valor }),
        ...(dados?.desconto !== undefined && { desconto: dados.desconto }),
        ...(dados?.observacoes !== undefined && { observacoes: dados.observacoes }),
      }

      return await prisma.mensalidade.update({ where: { id }, data }) as any
    } catch (error) {
      logError('Erro ao atualizar mensalidade', error as Error, { id })
      throw AppError.internal('Erro ao atualizar mensalidade')
    }
  }

  // ===================== PAGAMENTOS =====================

  async findPagamentoById(id: string): Promise<Pagamento | null> {
    try {
      return await prisma.pagamento.findUnique({ where: { id } }) as any
    } catch (error) {
      logError('Erro ao buscar pagamento', error as Error, { id })
      throw AppError.internal('Erro ao buscar pagamento')
    }
  }

  async findPagamentos(params: {
    mensalidadeId?: string
    caixaId?: string
    metodo?: string
    dataInicio?: Date
    dataFim?: Date
    page: number
    limit: number
  }): Promise<{ pagamentos: Pagamento[]; total: number }> {
    try {
      const { mensalidadeId, caixaId, metodo, dataInicio, dataFim, page, limit } = params

      const where: Prisma.PagamentoWhereInput = {
        ...(mensalidadeId && { mensalidadeId }),
        ...(caixaId && { caixaId }),
        ...(metodo && { metodo: metodo as MetodoPagamento }),
        ...((dataInicio ?? dataFim) && {
          dataPagamento: {
            ...(dataInicio && { gte: dataInicio }),
            ...(dataFim && { lte: dataFim }),
          },
        }),
      }

      const [pagamentos, total] = await Promise.all([
        prisma.pagamento.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { criadoEm: 'desc' },
        }),
        prisma.pagamento.count({ where }),
      ])

      return { pagamentos: pagamentos as any, total }
    } catch (error) {
      logError('Erro ao listar pagamentos', error as Error)
      throw AppError.internal('Erro ao listar pagamentos')
    }
  }

  async createPagamento(data: CreatePagamentoData): Promise<Pagamento> {
    try {
      return await prisma.pagamento.create({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: {
          mensalidadeId: data.mensalidadeId,
          caixaId: data.caixaId,
          usuarioId: data.usuarioId,
          valor: data.valor,
          metodo: data.metodo,
          dataPagamento: data.dataPagamento ?? new Date(),
          referencia: data.referencia ?? null,
          observacoes: data.observacoes ?? null,
        } as any,
      }) as any
    } catch (error) {
      logError('Erro ao criar pagamento', error as Error)
      throw AppError.internal('Erro ao registrar pagamento')
    }
  }
}

export const financeiroRepository = new FinanceiroRepository()
