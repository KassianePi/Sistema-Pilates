import { PagamentosPixRepository, pagamentosPixRepository } from './pagamentos-pix.repository'
import { mercadoPagoGateway } from './gateway/mercado-pago-gateway.service'
import type { PaymentGatewayPix } from './gateway/payment-gateway-pix.interface'
import { AppError } from '../../shared/errors'
import { logInfo, logError, subtrairDias } from '../../shared/utils'
import { prisma } from '../../database/prisma.client'
import { financeiroService } from '../financeiro/financeiro.service'
import { ConfiguracaoRepository, configuracaoRepository } from '../configuracao/configuracao.repository'
import { PAGAMENTOS_PIX_ERRORS, EXPIRACAO_COBRANCA_MINUTOS } from './pagamentos-pix.constants'
import type { CobrancaPix, StatusCobrancaPix } from './pagamentos-pix.types'

interface WebhookInput {
  headers: Record<string, string | string[] | undefined>
  query: Record<string, string | string[] | undefined>
  body: unknown
}

const STATUS_MENSALIDADE_COBRAVEL = ['PENDENTE', 'VENCIDO', 'PARCIAL']

/** Traduz o status (bem menos previsível) do gateway para o nosso enum interno. */
export function mapStatusGateway(status: string): StatusCobrancaPix {
  if (['approved', 'processed'].includes(status)) return 'APROVADO'
  if (['rejected', 'cancelled'].includes(status)) return 'REJEITADO'
  return 'PENDENTE'
}

export class PagamentosPixService {
  constructor(
    private repository: PagamentosPixRepository,
    private gateway: PaymentGatewayPix,
    private configuracaoRepo: ConfiguracaoRepository = configuracaoRepository,
  ) {}

  async solicitarCobranca(alunoId: string, mensalidadeId: string): Promise<CobrancaPix> {
    const mensalidade = await prisma.mensalidade.findUnique({
      where: { id: mensalidadeId },
      include: { aluno: { include: { usuario: { select: { email: true } } } } },
    })
    if (!mensalidade) throw AppError.notFound('Mensalidade', mensalidadeId)
    if (mensalidade.alunoId !== alunoId) {
      throw AppError.badRequest(PAGAMENTOS_PIX_ERRORS.MENSALIDADE_NAO_PERTENCE_ALUNO)
    }
    if (!STATUS_MENSALIDADE_COBRAVEL.includes(mensalidade.status)) {
      throw AppError.badRequest(PAGAMENTOS_PIX_ERRORS.MENSALIDADE_JA_PAGA)
    }

    // A mensalidade pode já existir (gerada antecipadamente ao quitar a
    // anterior — ver gerarProximaAposPagamento), mas o QR Code só é liberado
    // perto do vencimento, pelo mesmo prazo usado pela geração automática.
    const config = await this.configuracaoRepo.find()
    const diasAntesGeracao = config?.diasAntesGeracao ?? 5
    const dataLimiteParaCobranca = subtrairDias(mensalidade.dataVencimento, diasAntesGeracao)
    if (new Date() < dataLimiteParaCobranca) {
      throw AppError.badRequest(PAGAMENTOS_PIX_ERRORS.FORA_DA_JANELA_COBRANCA)
    }

    const existente = await this.repository.buscarPendentePorMensalidade(mensalidadeId)
    if (existente) return existente

    // Nunca confiar em valor vindo do client: sempre o valor real da mensalidade no banco.
    const valor = Number(mensalidade.valor) - Number(mensalidade.desconto)

    const criada = await this.repository.criarCobranca({
      mensalidadeId,
      externalReference: mensalidadeId,
      valor,
      qrCode: null,
      qrCodeBase64: null,
      ticketUrl: null,
      dataExpiracao: null,
    })

    try {
      const resultado = await this.gateway.criarCobranca({
        externalReference: mensalidadeId,
        // Chave de idempotência = id da linha local desta tentativa, nunca o
        // mensalidadeId (persistente). Uma tentativa nova sempre tem um
        // `criada.id` novo, então sempre ganha uma chave nova no Mercado Pago.
        idempotencyKey: criada.id,
        valor,
        descricao: 'Mensalidade — Studio de Pilates',
        expiracaoMinutos: EXPIRACAO_COBRANCA_MINUTOS,
        payerEmail: mensalidade.aluno.usuario.email,
      })

      const atualizada = await this.repository.atualizarAposCriacao(criada.id, {
        externalPaymentId: resultado.externalPaymentId,
        status: mapStatusGateway(resultado.status),
        statusDetail: resultado.statusDetail,
        qrCode: resultado.qrCode,
        qrCodeBase64: resultado.qrCodeBase64,
        ticketUrl: resultado.ticketUrl,
        dataExpiracao: resultado.dataExpiracao,
      })

      logInfo('Cobrança PIX solicitada', { cobrancaId: atualizada.id, mensalidadeId })
      return atualizada
    } catch (error) {
      // A cobrança local já existe (status PENDENTE, sem QR) — marcamos como
      // REJEITADO para não ser reaproveitada como se fosse válida; a próxima
      // tentativa do aluno cria uma cobrança nova.
      await this.repository
        .atualizarStatus(criada.id, { status: 'REJEITADO', statusDetail: 'Falha ao criar cobrança no gateway' })
        .catch(() => {
          /* silencioso */
        })
      throw error
    }
  }

  /**
   * Leitura pura — só o banco de dados, nunca chama o Mercado Pago. Usado
   * pelo polling de rotina (barato, rápido, sem custo de rede externa).
   */
  async consultarCobranca(alunoId: string, mensalidadeId: string): Promise<CobrancaPix | null> {
    const mensalidade = await prisma.mensalidade.findUnique({ where: { id: mensalidadeId } })
    if (!mensalidade) throw AppError.notFound('Mensalidade', mensalidadeId)
    if (mensalidade.alunoId !== alunoId) {
      throw AppError.badRequest(PAGAMENTOS_PIX_ERRORS.MENSALIDADE_NAO_PERTENCE_ALUNO)
    }
    return this.repository.buscarUltimaPorMensalidade(mensalidadeId)
  }

  /**
   * Reconcilia de verdade com o Mercado Pago: se a cobrança está PENDENTE e
   * tem um pedido criado no gateway, reconsulta (nunca confia só no estado
   * local) e resolve — aprovado → baixa a mensalidade pelo mesmo caminho
   * idempotente do webhook; senão → marca EXPIRADO. Não faz nada se a
   * cobrança não está PENDENTE ou nunca chegou a ter um pedido no gateway.
   * Compartilhado por `sincronizarCobranca` (sempre reconcilia) e
   * `resolverSeExpirada` (só reconcilia quando já passou da validade).
   */
  private async reconciliarComGateway(cobranca: CobrancaPix): Promise<CobrancaPix> {
    if (cobranca.status !== 'PENDENTE' || !cobranca.externalPaymentId) {
      return cobranca
    }

    const pagamento = await this.gateway.buscarPagamento(cobranca.externalPaymentId)
    const statusMapeado = mapStatusGateway(pagamento.status)

    if (statusMapeado === 'APROVADO') {
      await financeiroService.baixarMensalidadePorGateway({
        mensalidadeId: cobranca.mensalidadeId,
        valor: Number(cobranca.valor),
        referenciaExterna: `MercadoPago:${pagamento.externalPaymentId}`,
      })
      return this.repository.atualizarStatus(cobranca.id, {
        status: 'APROVADO',
        statusDetail: pagamento.statusDetail,
        dataAprovacao: pagamento.dataAprovacao ?? new Date(),
      })
    }

    if (statusMapeado === 'REJEITADO') {
      return this.repository.atualizarStatus(cobranca.id, {
        status: 'REJEITADO',
        statusDetail: pagamento.statusDetail,
      })
    }

    const jaExpirou = !!cobranca.dataExpiracao && cobranca.dataExpiracao.getTime() < Date.now()
    if (!jaExpirou) {
      // Ainda pendente de verdade (confirmado com o gateway) — só atualiza o detalhe.
      return this.repository.atualizarStatus(cobranca.id, { status: 'PENDENTE', statusDetail: pagamento.statusDetail })
    }

    logInfo('Cobrança PIX expirada sem confirmação de pagamento', { cobrancaId: cobranca.id })
    return this.repository.atualizarStatus(cobranca.id, {
      status: 'EXPIRADO',
      statusDetail: 'Expirado sem confirmação de pagamento',
    })
  }

  /**
   * Chamado só pelo job periódico (`processarCobrancasExpiradas`): reconcilia
   * com o gateway apenas quando a cobrança já passou da validade local.
   */
  private async resolverSeExpirada(cobranca: CobrancaPix): Promise<CobrancaPix> {
    const jaExpirou = !!cobranca.dataExpiracao && cobranca.dataExpiracao.getTime() < Date.now()
    if (cobranca.status !== 'PENDENTE' || !jaExpirou) return cobranca
    return this.reconciliarComGateway(cobranca)
  }

  /**
   * Sincronização sob demanda (endpoint dedicado, nunca uma variação do
   * `GET`): sempre reconcilia com o Mercado Pago quando a cobrança está
   * PENDENTE, independente de já ter expirado ou não. Chamado só em
   * momentos explícitos (abertura da tela, retorno de aba, countdown
   * zerado, botão manual) — nunca pelo polling de rotina.
   */
  async sincronizarCobranca(alunoId: string, mensalidadeId: string): Promise<CobrancaPix | null> {
    const mensalidade = await prisma.mensalidade.findUnique({ where: { id: mensalidadeId } })
    if (!mensalidade) throw AppError.notFound('Mensalidade', mensalidadeId)
    if (mensalidade.alunoId !== alunoId) {
      throw AppError.badRequest(PAGAMENTOS_PIX_ERRORS.MENSALIDADE_NAO_PERTENCE_ALUNO)
    }
    const cobranca = await this.repository.buscarUltimaPorMensalidade(mensalidadeId)
    if (!cobranca) return null
    return this.reconciliarComGateway(cobranca)
  }

  /** Varredura periódica (job) — resolve todas as cobranças PENDENTE vencidas. */
  async processarCobrancasExpiradas(): Promise<void> {
    const expiradas = await this.repository.buscarPendentesExpiradas()
    if (expiradas.length === 0) {
      logInfo('Job cobranças PIX: nenhuma expirada encontrada')
      return
    }
    logInfo(`Job cobranças PIX: processando ${expiradas.length} cobranças expiradas`)
    for (const cobranca of expiradas) {
      try {
        await this.resolverSeExpirada(cobranca)
      } catch (error) {
        logError('Erro ao processar expiração de cobrança PIX', error as Error, { cobrancaId: cobranca.id })
      }
    }
  }

  /**
   * Processa uma notificação de webhook do Mercado Pago. Valida a assinatura,
   * garante idempotência (evento já processado é ignorado) e, se aprovado,
   * delega a baixa da mensalidade ao FinanceiroService — este método nunca
   * mexe direto em Mensalidade/Pagamento.
   */
  async processarWebhook(input: WebhookInput): Promise<void> {
    // 1. Segurança: nada é processado sem uma assinatura válida.
    this.gateway.validarAssinaturaWebhook({ headers: input.headers, query: input.query })

    const body = (input.body ?? {}) as { id?: unknown; type?: unknown; data?: { id?: unknown } }
    const tipo = String(body.type ?? input.query?.type ?? 'desconhecido')
    const dataId = String(body.data?.id ?? input.query?.['data.id'] ?? '')
    const externalEventId = String(body.id ?? `${tipo}-${dataId}-${Date.now()}`)

    // 2. Idempotência de ingestão: notificação repetida não é reprocessada.
    if (await this.repository.existeEventoProcessado(externalEventId)) {
      logInfo('Webhook Mercado Pago ignorado (evento já processado)', { externalEventId })
      return
    }

    // 3. Registra o payload bruto antes de qualquer decisão de negócio (auditoria).
    await this.repository.registrarEventoWebhook({
      externalEventId,
      topico: tipo,
      paymentIdMp: dataId || null,
      payload: body as any,
    })

    if (tipo !== 'order') {
      logInfo('Webhook Mercado Pago ignorado (tópico não tratado)', { tipo, externalEventId })
      await this.repository.marcarEventoProcessado(externalEventId, true)
      return
    }
    if (!dataId) {
      await this.repository.marcarEventoProcessado(externalEventId, false, 'data.id ausente na notificação')
      return
    }

    try {
      // Nunca confiamos no corpo da notificação: sempre buscamos o pedido
      // canônico na API do Mercado Pago antes de decidir qualquer coisa.
      const pagamento = await this.gateway.buscarPagamento(dataId)
      const cobranca = await this.repository.buscarPorExternalPaymentId(pagamento.externalPaymentId)
      if (!cobranca) {
        logInfo('Webhook Mercado Pago: nenhuma cobrança PIX corresponde a este pedido', {
          externalPaymentId: pagamento.externalPaymentId,
        })
        await this.repository.marcarEventoProcessado(externalEventId, true)
        return
      }

      const statusMapeado = mapStatusGateway(pagamento.status)
      await this.repository.atualizarStatus(cobranca.id, {
        status: statusMapeado,
        statusDetail: pagamento.statusDetail,
        dataAprovacao: statusMapeado === 'APROVADO' ? (pagamento.dataAprovacao ?? new Date()) : null,
      })

      if (statusMapeado === 'APROVADO') {
        await financeiroService.baixarMensalidadePorGateway({
          mensalidadeId: cobranca.mensalidadeId,
          valor: Number(cobranca.valor),
          referenciaExterna: `MercadoPago:${pagamento.externalPaymentId}`,
        })
      }

      await this.repository.marcarEventoProcessado(externalEventId, true)
    } catch (error) {
      await this.repository.marcarEventoProcessado(
        externalEventId,
        false,
        error instanceof Error ? error.message : String(error),
      )
      throw error
    }
  }
}

export const pagamentosPixService = new PagamentosPixService(pagamentosPixRepository, mercadoPagoGateway)
