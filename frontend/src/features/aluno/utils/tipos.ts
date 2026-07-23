/**
 * Formas financeiras como o portal do aluno realmente as recebe (o objeto em runtime
 * traz campos além dos declarados no domínio — ex.: pagamentos, criadoEm). Tipadas aqui
 * para evitar `any` nas páginas e utilitários.
 */

export interface PagamentoResumo {
  id: string
  dataPagamento?: string | null
  valor?: number
}

export interface MensalidadeAluno {
  id: string
  status: string
  valor: number
  vencimento: string
  criadoEm?: string | null
  plano?: { nome?: string | null } | null
  pagamentos?: PagamentoResumo[] | null
}

export interface ComprovanteAluno {
  id: string
  mensalidadeId: string
  status: string
  nomeArquivo: string
  dataEnvio: string
  observacoes?: string | null
  atualizadoEm?: string | null
  mensalidade?: { plano?: { nome?: string | null } | null } | null
}

/** Status de uma cobrança PIX (Mercado Pago), espelha o enum `StatusCobrancaPix` do backend. */
export type StatusCobrancaPix = 'PENDENTE' | 'APROVADO' | 'REJEITADO' | 'CANCELADO' | 'EXPIRADO'

/**
 * Estado de interface derivado para o fluxo de pagamento PIX (ver
 * `mapearEstadoPagamentoPix`). Não é o mesmo que `StatusCobrancaPix`: inclui
 * estados que não existem no backend (LOADING, NO_CHARGE, GENERATING, ERROR)
 * e isola qualquer status novo do gateway (ex.: reembolso/chargeback) numa
 * única função de mapeamento, sem impactar os componentes.
 */
export type PagamentoPixState =
  | 'LOADING'
  | 'NO_CHARGE'
  | 'GENERATING'
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELED'
  | 'EXPIRED'
  | 'ERROR'
