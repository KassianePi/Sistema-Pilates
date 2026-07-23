import type { PagamentoPix } from '@/services/pagamentosPix.service'
import type { PagamentoPixState } from './tipos'

interface MapearEstadoParams {
  pagamento: PagamentoPix | null | undefined
  isLoading: boolean
  isGenerating: boolean
  isError: boolean
  countdownExpirado: boolean
}

/**
 * Deriva o estado de interface a partir dos dados brutos (query + mutation +
 * countdown local). Isolar essa decisão aqui significa que um status novo do
 * gateway no futuro (ex.: reembolso/chargeback) só muda esta função — nenhum
 * componente é tocado.
 */
export function mapearEstadoPagamentoPix({
  pagamento,
  isLoading,
  isGenerating,
  isError,
  countdownExpirado,
}: MapearEstadoParams): PagamentoPixState {
  if (isGenerating) return 'GENERATING'
  if (isLoading) return 'LOADING'
  if (isError) return 'ERROR'
  if (!pagamento) return 'NO_CHARGE'

  switch (pagamento.status) {
    case 'APROVADO':
      return 'APPROVED'
    case 'REJEITADO':
      return 'REJECTED'
    case 'CANCELADO':
      return 'CANCELED'
    case 'EXPIRADO':
      return 'EXPIRED'
    case 'PENDENTE':
      // O countdown local só é usado de forma otimista — a troca definitiva
      // para EXPIRED só acontece quando o servidor confirmar (sincronização),
      // mas exibir o estado "expirado" antes disso evita mostrar um QR morto.
      return countdownExpirado ? 'EXPIRED' : 'PENDING'
    default:
      return 'ERROR'
  }
}
