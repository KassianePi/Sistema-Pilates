/**
 * Contrato genérico de um gateway de cobrança PIX.
 *
 * Nenhum tipo ou detalhe específico do Mercado Pago deve vazar para fora
 * da implementação concreta (`mercado-pago-gateway.service.ts`). O restante
 * do sistema (pagamentos-pix.service.ts, financeiro.service.ts) só conhece
 * esta interface — trocar de gateway no futuro significa trocar só a
 * implementação e o ponto onde o singleton é instanciado.
 */

export interface CriarCobrancaInput {
  /** Âncora para reconciliação — usamos sempre o id da Mensalidade. */
  externalReference: string
  /**
   * Chave de idempotência única desta TENTATIVA de criação (não da mensalidade
   * nem do external_reference, que são persistentes e se repetem entre
   * tentativas). Deve ser o id da linha local criada para esta tentativa
   * (`CobrancaPix.id`) — assim, uma tentativa nova (após falha definitiva,
   * cancelamento ou expiração da anterior) sempre ganha uma chave nova,
   * enquanto retries internos de uma mesma chamada (timeout, 5xx) continuam
   * reaproveitando a mesma chave automaticamente, pelo próprio SDK.
   */
  idempotencyKey: string
  valor: number
  descricao: string
  expiracaoMinutos: number
  payerEmail: string
}

export interface CriarCobrancaResult {
  externalPaymentId: string
  status: string
  statusDetail: string | null
  qrCode: string | null
  qrCodeBase64: string | null
  ticketUrl: string | null
  dataExpiracao: Date | null
}

export interface BuscarPagamentoResult {
  externalPaymentId: string
  status: string
  statusDetail: string | null
  valor: number | null
  externalReference: string | null
  dataAprovacao: Date | null
}

export interface ValidarAssinaturaInput {
  /** Headers da requisição do webhook (chaves em minúsculo). */
  headers: Record<string, string | string[] | undefined>
  /** Query string da requisição do webhook (ex.: `data.id`). */
  query: Record<string, string | string[] | undefined>
}

export interface PaymentGatewayPix {
  criarCobranca(input: CriarCobrancaInput): Promise<CriarCobrancaResult>
  buscarPagamento(externalPaymentId: string): Promise<BuscarPagamentoResult>
  /** @throws Error (ou subtipo) quando a assinatura é inválida/ausente. */
  validarAssinaturaWebhook(input: ValidarAssinaturaInput): void
}
