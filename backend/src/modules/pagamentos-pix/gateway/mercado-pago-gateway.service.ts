/**
 * Único arquivo do sistema que conhece o SDK do Mercado Pago.
 *
 * Implementa `PaymentGatewayPix` — nada fora daqui deve importar tipos ou
 * classes de `mercadopago`. Se um dia for preciso trocar de gateway, troca-se
 * esta implementação (e o ponto que instancia o singleton no final do
 * arquivo); o resto do sistema (pagamentos-pix.service.ts, financeiro.service.ts)
 * não muda.
 */
import { MercadoPagoConfig, Order, WebhookSignatureValidator } from 'mercadopago'
import { AppError } from '../../../shared/errors'
import { logInfo, logError } from '../../../shared/utils'
import type {
  PaymentGatewayPix,
  CriarCobrancaInput,
  CriarCobrancaResult,
  BuscarPagamentoResult,
  ValidarAssinaturaInput,
} from './payment-gateway-pix.interface'

function primeiroValor(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v
}

export class MercadoPagoGatewayService implements PaymentGatewayPix {
  private readonly config: MercadoPagoConfig
  private readonly orderClient: Order

  constructor() {
    // Não lança erro aqui de propósito: o restante da aplicação (rotas de
    // outros módulos, testes que não tocam em pagamento PIX) não pode
    // quebrar só porque o Mercado Pago ainda não foi configurado neste
    // ambiente. A falta de configuração só vira erro quando um método
    // abaixo é efetivamente chamado (ver `assertConfigurado`).
    this.config = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN ?? '' })
    // Usamos a Orders API (`/v1/orders`) em vez da Payments API clássica
    // (`/v1/payments`): é o fluxo atualmente documentado e suportado pelo
    // Mercado Pago para PIX via contas de teste — a Payments API clássica
    // rejeitava a criação com "Unauthorized use of live credentials" para
    // este tipo de conta sandbox.
    this.orderClient = new Order(this.config)
  }

  private assertConfigurado(): void {
    if (!process.env.MP_ACCESS_TOKEN) {
      throw AppError.internal('MP_ACCESS_TOKEN não configurado — integração com Mercado Pago indisponível')
    }
  }

  async criarCobranca(input: CriarCobrancaInput): Promise<CriarCobrancaResult> {
    this.assertConfigurado()
    const dataExpiracao = new Date(Date.now() + input.expiracaoMinutos * 60_000)
    const valorFormatado = input.valor.toFixed(2)

    logInfo('MercadoPago: criando cobrança PIX', {
      externalReference: input.externalReference,
      valor: input.valor,
    })

    try {
      const response = await this.orderClient.create({
        body: {
          type: 'online',
          total_amount: valorFormatado,
          external_reference: input.externalReference,
          description: input.descricao,
          currency: 'BRL',
          // TESTE MANUAL (Fase 4.9) — REVERTER DEPOIS: sandbox do Mercado Pago
          // só aceita payer.email no domínio @testuser.com (rejeita e-mails
          // reais de aluno com "invalid_email_for_sandbox"), e `first_name:
          // 'APRO'` é o gatilho documentado para aprovação automática —
          // evita a simulação manual de pagamento que travou em rodadas
          // anteriores de teste. O e-mail real do aluno seguiria normalmente
          // em produção (só sandbox tem essa restrição de domínio).
          payer: { email: 'test_user_3969600205402650582@testuser.com', first_name: 'APRO' },
          transactions: {
            payments: [
              {
                amount: valorFormatado,
                payment_method: { id: 'pix', type: 'bank_transfer' },
                // Duração ISO 8601 (não data absoluta — "date_of_expiration"
                // é rejeitado pela API apesar de declarado no tipo do SDK).
                // Mínimo aceito pelo Mercado Pago: 30 minutos.
                expiration_time: `PT${Math.max(input.expiracaoMinutos, 30)}M`,
              },
            ],
          },
          // A URL do webhook não é aceita por requisição — é configurada uma
          // vez no painel do Mercado Pago (Suas integrações > aplicação >
          // Webhooks), não aqui.
        },
        // A chave de idempotência é por TENTATIVA (input.idempotencyKey = id da
        // linha local CobrancaPix), nunca o external_reference/mensalidadeId —
        // esse é persistente e se repetiria entre tentativas diferentes, o que
        // faz o Mercado Pago recusar com "idempotency_key_already_used" assim
        // que o corpo da requisição mudar entre uma tentativa e outra.
        requestOptions: { idempotencyKey: input.idempotencyKey },
      })

      const pagamento = response.transactions?.payments?.[0]
      const metodo = pagamento?.payment_method

      logInfo('MercadoPago: cobrança PIX criada', {
        externalPaymentId: String(response.id),
        status: response.status,
      })

      return {
        externalPaymentId: String(response.id),
        status: pagamento?.status ?? response.status ?? 'created',
        statusDetail: pagamento?.status_detail ?? response.status_detail ?? null,
        qrCode: metodo?.qr_code ?? null,
        qrCodeBase64: metodo?.qr_code_base64 ?? null,
        ticketUrl: metodo?.ticket_url ?? null,
        dataExpiracao: pagamento?.date_of_expiration ? new Date(pagamento.date_of_expiration) : dataExpiracao,
      }
    } catch (error) {
      logError('MercadoPago: erro ao criar cobrança PIX', error as Error, {
        externalReference: input.externalReference,
      })
      throw AppError.internal('Não foi possível gerar a cobrança PIX. Tente novamente em instantes.')
    }
  }

  async buscarPagamento(externalPaymentId: string): Promise<BuscarPagamentoResult> {
    this.assertConfigurado()
    logInfo('MercadoPago: consultando pagamento', { externalPaymentId })

    try {
      const response = await this.orderClient.get({ id: externalPaymentId })
      const pagamento = response.transactions?.payments?.[0]

      return {
        externalPaymentId: String(response.id),
        status: pagamento?.status ?? response.status ?? 'unknown',
        statusDetail: pagamento?.status_detail ?? response.status_detail ?? null,
        valor: response.total_amount ? Number(response.total_amount) : null,
        externalReference: response.external_reference ?? null,
        // A Orders API não expõe um "date_approved" dedicado por pagamento;
        // usamos a última atualização do pedido como melhor aproximação.
        dataAprovacao: response.last_updated_date ? new Date(response.last_updated_date) : null,
      }
    } catch (error) {
      logError('MercadoPago: erro ao consultar pagamento', error as Error, { externalPaymentId })
      throw AppError.internal('Não foi possível consultar o pagamento no Mercado Pago.')
    }
  }

  validarAssinaturaWebhook({ headers, query }: ValidarAssinaturaInput): void {
    const secret = process.env.MP_WEBHOOK_SECRET
    if (!secret) {
      logError('MercadoPago: MP_WEBHOOK_SECRET não configurado — recusando webhook')
      throw AppError.internal('Webhook do Mercado Pago não configurado')
    }

    try {
      WebhookSignatureValidator.validate({
        xSignature: primeiroValor(headers['x-signature'] as string | string[] | undefined),
        xRequestId: primeiroValor(headers['x-request-id'] as string | string[] | undefined),
        dataId: primeiroValor(query['data.id'] as string | string[] | undefined),
        secret,
        toleranceSeconds: 300,
      })
    } catch (error) {
      logError('MercadoPago: assinatura de webhook inválida', error as Error)
      throw error
    }
  }
}

export const mercadoPagoGateway = new MercadoPagoGatewayService()
