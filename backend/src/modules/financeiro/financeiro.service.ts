import { FinanceiroRepository } from './financeiro.repository'
import { AppError, ValidationError } from '../../shared/errors'
import { logInfo } from '../../shared/utils'
import {
  createMensalidadeSchema,
  updateMensalidadeSchema,
  listMensalidadesSchema,
  createPagamentoSchema,
  listPagamentosSchema,
} from '../../shared/schemas'
import { FINANCEIRO_ERRORS } from './financeiro.constants'
import { prisma } from '../../database/prisma.client'
import { eventBus } from '../../events/event-bus'
import { registrarLog } from '../auditoria/auditoria.service'
import { notificacoesService } from '../notificacoes/notificacoes.service'
import type { Mensalidade, Pagamento } from './financeiro.types'

export class FinanceiroService {
  constructor(private repository: FinanceiroRepository) {}

  // ===================== MENSALIDADES =====================

  async criarMensalidade(data: {
    alunoId: string
    planoId?: string | null
    tipo?: string
    mesReferencia: string
    dataVencimento: string
    valor: number
    desconto?: number
    observacoes?: string | null
  }): Promise<Mensalidade> {
    const validado = createMensalidadeSchema.parse(data)

    const aluno = await prisma.aluno.findUnique({ where: { id: validado.alunoId } })
    if (!aluno) throw ValidationError.forField('alunoId', FINANCEIRO_ERRORS.ALUNO_NOT_FOUND)

    if (validado.tipo === 'MENSAL' || !validado.tipo) {
      if (!validado.planoId) throw ValidationError.forField('planoId', 'Plano é obrigatório para mensalidade mensal')
      const plano = await prisma.plano.findUnique({ where: { id: validado.planoId } })
      if (!plano) throw ValidationError.forField('planoId', FINANCEIRO_ERRORS.PLANO_NOT_FOUND)
    }

    const mensalidade = await this.repository.createMensalidade({
      alunoId: validado.alunoId,
      planoId: validado.planoId ?? null,
      tipo: (validado.tipo ?? 'MENSAL') as any,
      mesReferencia: new Date(validado.mesReferencia),
      dataVencimento: new Date(validado.dataVencimento),
      valor: validado.valor,
      desconto: validado.desconto,
      observacoes: validado.observacoes,
    })

    logInfo('Mensalidade criada', { id: mensalidade.id, tipo: mensalidade.tipo })

    // Notifica o aluno sobre a nova cobrança
    try {
      const valorFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
        Number(mensalidade.valor) - Number(mensalidade.desconto ?? 0),
      )
      const vencFmt = new Date(mensalidade.dataVencimento).toLocaleDateString('pt-BR')
      const descricao = mensalidade.tipo === 'AVULSO' ? 'aula avulsa' : 'mensalidade'
      await notificacoesService.criar({
        usuarioId: aluno.usuarioId,
        tipo: 'MENSALIDADE_CRIADA',
        titulo: 'Nova cobrança disponível',
        mensagem: `Foi gerada uma cobrança de ${descricao} no valor de ${valorFmt}, com vencimento em ${vencFmt}. Pague e envie o comprovante pelo portal.`,
      })
    } catch {
      /* silencioso */
    }

    if (mensalidade.tipo === 'AVULSO') {
      const aluno = await prisma.aluno.findUnique({
        where: { id: mensalidade.alunoId },
        include: { usuario: { select: { nomeCompleto: true } } },
      })
      const nomeAluno = aluno?.usuario?.nomeCompleto ?? 'Aluno'
      const valorFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
        Number(mensalidade.valor),
      )
      const dataVenc = new Date(mensalidade.dataVencimento).toLocaleDateString('pt-BR')
      await notificacoesService.notificarAdmins(
        'Cobrança avulsa criada',
        `Uma nova cobrança avulsa no valor de ${valorFmt} foi criada para o aluno ${nomeAluno} com vencimento em ${dataVenc}.`,
      )
    }

    return mensalidade
  }

  async buscarMensalidadePorId(id: string): Promise<Mensalidade> {
    const mensalidade = await this.repository.findMensalidadeById(id)
    if (!mensalidade) throw AppError.notFound('Mensalidade', id)
    return mensalidade
  }

  async listarMensalidades(params: {
    alunoId?: string
    planoId?: string
    tipo?: string
    status?: string
    dataInicio?: string
    dataFim?: string
    page?: number
    limit?: number
  }) {
    const validado = listMensalidadesSchema.parse(params)
    const { mensalidades, total } = await this.repository.findMensalidades({
      alunoId: validado.alunoId,
      planoId: validado.planoId,
      tipo: validado.tipo,
      status: validado.status,
      dataInicio: validado.dataInicio ? new Date(validado.dataInicio) : undefined,
      dataFim: validado.dataFim ? new Date(validado.dataFim) : undefined,
      page: validado.page,
      limit: validado.limit,
    })
    return {
      mensalidades,
      total,
      page: validado.page,
      limit: validado.limit,
      totalPages: Math.ceil(total / validado.limit),
    }
  }

  async atualizarMensalidade(
    id: string,
    data: { dataVencimento?: string; valor?: number; desconto?: number; status?: string; observacoes?: string | null },
  ): Promise<Mensalidade> {
    const mensalidade = await this.buscarMensalidadePorId(id)
    if (mensalidade.status === 'PAGO') throw AppError.badRequest(FINANCEIRO_ERRORS.MENSALIDADE_JA_PAGA)

    const validado = updateMensalidadeSchema.parse(data)
    const atualizada = await this.repository.updateMensalidadeStatus(id, validado.status || mensalidade.status, {
      dataVencimento: validado.dataVencimento ? new Date(validado.dataVencimento) : undefined,
      valor: validado.valor,
      desconto: validado.desconto,
      observacoes: validado.observacoes,
    })

    if (validado.status === 'VENCIDO') {
      eventBus.emit('mensalidade.vencida', { mensalidadeId: id, alunoId: mensalidade.alunoId })
    }

    logInfo('Mensalidade atualizada', { id })
    return atualizada
  }

  // ===================== PAGAMENTOS =====================

  async registrarPagamento(
    usuarioId: string,
    data: {
      mensalidadeId: string
      caixaId?: string | null
      valor: number
      metodo: string
      dataPagamento?: string
      referencia?: string | null
      observacoes?: string | null
    },
  ): Promise<Pagamento> {
    const validado = createPagamentoSchema.parse(data)

    // Operações financeiras não dependem mais de caixa aberto: o pagamento é
    // registrado como movimentação autônoma (caixaId opcional/nulo).
    const mensalidade = await this.repository.findMensalidadeById(validado.mensalidadeId)

    if (!mensalidade) throw ValidationError.forField('mensalidadeId', FINANCEIRO_ERRORS.MENSALIDADE_NOT_FOUND)
    if (mensalidade.status === 'PAGO') throw AppError.badRequest(FINANCEIRO_ERRORS.MENSALIDADE_JA_PAGA)

    const pagamento = await this.repository.createPagamento({
      mensalidadeId: validado.mensalidadeId,
      caixaId: validado.caixaId ?? null,
      usuarioId,
      valor: validado.valor,
      metodo: validado.metodo as any,
      dataPagamento: validado.dataPagamento ? new Date(validado.dataPagamento) : new Date(),
      referencia: validado.referencia,
      observacoes: validado.observacoes,
    })

    const valorTotal = mensalidade.valor.toNumber() - mensalidade.desconto.toNumber()
    const novoStatus = validado.valor >= valorTotal ? 'PAGO' : 'PARCIAL'
    await this.repository.updateMensalidadeStatus(mensalidade.id, novoStatus)

    eventBus.emit('pagamento.realizado', {
      pagamentoId: pagamento.id,
      alunoId: mensalidade.alunoId,
      valor: validado.valor,
    })
    logInfo('Pagamento registrado', { id: pagamento.id })
    await registrarLog({ usuarioId, acao: 'CREATE', entidade: 'Pagamento', entidadeId: pagamento.id })
    return pagamento
  }

  async listarPagamentos(params: {
    mensalidadeId?: string
    caixaId?: string
    metodo?: string
    dataInicio?: string
    dataFim?: string
    page?: number
    limit?: number
  }) {
    const validado = listPagamentosSchema.parse(params)
    const { pagamentos, total } = await this.repository.findPagamentos({
      mensalidadeId: validado.mensalidadeId,
      caixaId: validado.caixaId,
      metodo: validado.metodo,
      dataInicio: validado.dataInicio ? new Date(validado.dataInicio) : undefined,
      dataFim: validado.dataFim ? new Date(validado.dataFim) : undefined,
      page: validado.page,
      limit: validado.limit,
    })
    return {
      pagamentos,
      total,
      page: validado.page,
      limit: validado.limit,
      totalPages: Math.ceil(total / validado.limit),
    }
  }
}

export const financeiroService = new FinanceiroService(new FinanceiroRepository())
