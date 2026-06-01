import { FinanceiroRepository } from './financeiro.repository'
import { AppError, ValidationError } from '../../shared/errors'
import { logInfo } from '../../shared/utils'
import {
  abrirCaixaSchema, fecharCaixaSchema,
  createMensalidadeSchema, updateMensalidadeSchema, listMensalidadesSchema,
  createPagamentoSchema, listPagamentosSchema,
} from '../../shared/schemas'
import { FINANCEIRO_ERRORS } from './financeiro.constants'
import { prisma } from '../../database/prisma.client'
import { eventBus } from '../../events/event-bus'
import { registrarLog } from '../auditoria/auditoria.service'
import type { Caixa, Mensalidade, Pagamento } from './financeiro.types'

export class FinanceiroService {
  constructor(private repository: FinanceiroRepository) {}

  // ===================== CAIXA =====================

  async abrirCaixa(usuarioId: string, data: { saldoAbertura: number; observacoes?: string | null }): Promise<Caixa> {
    const validado = abrirCaixaSchema.parse(data)
    const caixaAberto = await this.repository.findCaixaAtivo()
    if (caixaAberto) throw AppError.conflict(FINANCEIRO_ERRORS.CAIXA_JA_ABERTO)

    const caixa = await this.repository.abrirCaixa({ usuarioId, ...validado })
    logInfo('Caixa aberto', { id: caixa.id, usuarioId })
    return caixa
  }

  async fecharCaixa(caixaId: string, usuarioId: string, data: { saldoFechamento: number; observacoes?: string | null }): Promise<Caixa> {
    const validado = fecharCaixaSchema.parse(data)
    const caixa = await this.repository.findCaixaById(caixaId)
    if (!caixa) throw AppError.notFound('Caixa', caixaId)
    if (caixa.dataFechamento) throw AppError.badRequest(FINANCEIRO_ERRORS.CAIXA_JA_FECHADO)

    const caixaFechado = await this.repository.fecharCaixa(caixaId, usuarioId, validado)
    logInfo('Caixa fechado', { id: caixaId })
    return caixaFechado
  }

  async buscarCaixaAtivo(): Promise<Caixa | null> {
    return this.repository.findCaixaAtivo()
  }

  // ===================== MENSALIDADES =====================

  async criarMensalidade(data: { alunoId: string; planoId: string; mesReferencia: string; dataVencimento: string; valor: number; desconto?: number; observacoes?: string | null }): Promise<Mensalidade> {
    const validado = createMensalidadeSchema.parse(data)

    const [aluno, plano] = await Promise.all([
      prisma.aluno.findUnique({ where: { id: validado.alunoId } }),
      prisma.plano.findUnique({ where: { id: validado.planoId } }),
    ])
    if (!aluno) throw ValidationError.forField('alunoId', FINANCEIRO_ERRORS.ALUNO_NOT_FOUND)
    if (!plano) throw ValidationError.forField('planoId', FINANCEIRO_ERRORS.PLANO_NOT_FOUND)

    const mensalidade = await this.repository.createMensalidade({
      alunoId: validado.alunoId,
      planoId: validado.planoId,
      mesReferencia: new Date(validado.mesReferencia),
      dataVencimento: new Date(validado.dataVencimento),
      valor: validado.valor,
      desconto: validado.desconto,
      observacoes: validado.observacoes,
    })

    logInfo('Mensalidade criada', { id: mensalidade.id })
    return mensalidade
  }

  async buscarMensalidadePorId(id: string): Promise<Mensalidade> {
    const mensalidade = await this.repository.findMensalidadeById(id)
    if (!mensalidade) throw AppError.notFound('Mensalidade', id)
    return mensalidade
  }

  async listarMensalidades(params: { alunoId?: string; planoId?: string; status?: string; dataInicio?: string; dataFim?: string; page?: number; limit?: number }) {
    const validado = listMensalidadesSchema.parse(params)
    const { mensalidades, total } = await this.repository.findMensalidades({
      alunoId: validado.alunoId,
      planoId: validado.planoId,
      status: validado.status,
      dataInicio: validado.dataInicio ? new Date(validado.dataInicio) : undefined,
      dataFim: validado.dataFim ? new Date(validado.dataFim) : undefined,
      page: validado.page,
      limit: validado.limit,
    })
    return { mensalidades, total, page: validado.page, limit: validado.limit, totalPages: Math.ceil(total / validado.limit) }
  }

  async atualizarMensalidade(id: string, data: { dataVencimento?: string; valor?: number; desconto?: number; status?: string; observacoes?: string | null }): Promise<Mensalidade> {
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

  async registrarPagamento(usuarioId: string, data: { mensalidadeId: string; caixaId: string; valor: number; metodo: string; dataPagamento?: string; referencia?: string | null; observacoes?: string | null }): Promise<Pagamento> {
    const validado = createPagamentoSchema.parse(data)

    const [mensalidade, caixa] = await Promise.all([
      this.repository.findMensalidadeById(validado.mensalidadeId),
      this.repository.findCaixaById(validado.caixaId),
    ])

    if (!mensalidade) throw ValidationError.forField('mensalidadeId', FINANCEIRO_ERRORS.MENSALIDADE_NOT_FOUND)
    if (!caixa) throw ValidationError.forField('caixaId', FINANCEIRO_ERRORS.CAIXA_NOT_FOUND)
    if (caixa.dataFechamento) throw AppError.badRequest(FINANCEIRO_ERRORS.CAIXA_JA_FECHADO)
    if (mensalidade.status === 'PAGO') throw AppError.badRequest(FINANCEIRO_ERRORS.MENSALIDADE_JA_PAGA)

    const pagamento = await this.repository.createPagamento({
      mensalidadeId: validado.mensalidadeId,
      caixaId: validado.caixaId,
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

    eventBus.emit('pagamento.realizado', { pagamentoId: pagamento.id, alunoId: mensalidade.alunoId, valor: validado.valor })
    logInfo('Pagamento registrado', { id: pagamento.id })
    await registrarLog({ usuarioId, acao: 'CREATE', entidade: 'Pagamento', entidadeId: pagamento.id })
    return pagamento
  }

  async listarPagamentos(params: { mensalidadeId?: string; caixaId?: string; metodo?: string; dataInicio?: string; dataFim?: string; page?: number; limit?: number }) {
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
    return { pagamentos, total, page: validado.page, limit: validado.limit, totalPages: Math.ceil(total / validado.limit) }
  }
}

export const financeiroService = new FinanceiroService(new FinanceiroRepository())
