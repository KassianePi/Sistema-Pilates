import { QrCode } from 'lucide-react'
import { SectionCard } from './SectionCard'
import { StatusBadge } from './StatusBadge'
import { PixSkeleton } from './PixSkeleton'
import { PixNoCharge } from './PixNoCharge'
import { PixPending } from './PixPending'
import { PixApproved } from './PixApproved'
import { PixExpired } from './PixExpired'
import { PixError } from './PixError'
import { usePagamentoPix } from '../hooks/usePagamentoPix'

interface PagamentoPixCardProps {
  mensalidadeId: string
  onVerDetalhes: () => void
}

/**
 * Container: só decide qual sub-componente renderizar a partir do `estado`
 * derivado pelo hook. Nenhuma regra de negócio, nenhuma chamada de API direta.
 */
export function PagamentoPixCard({ mensalidadeId, onVerDetalhes }: PagamentoPixCardProps) {
  const { estado, pagamento, gerar, sincronizarAgora, sincronizando } = usePagamentoPix(mensalidadeId)

  return (
    <SectionCard
      title="Pagar via PIX"
      icon={QrCode}
      action={pagamento && <StatusBadge domain="pixCobranca" status={pagamento.status} />}
    >
      {estado === 'LOADING' && <PixSkeleton />}

      {(estado === 'NO_CHARGE' || estado === 'GENERATING') && (
        <PixNoCharge onGerar={gerar} gerando={estado === 'GENERATING'} />
      )}

      {estado === 'PENDING' && pagamento && (
        <PixPending
          mensalidadeId={mensalidadeId}
          qrCodeImagem={pagamento.qrCodeImagem}
          qrCode={pagamento.qrCode}
          expiraEm={pagamento.expiraEm}
          onVerificarAgora={sincronizarAgora}
          sincronizando={sincronizando}
        />
      )}

      {estado === 'APPROVED' && <PixApproved onVerDetalhes={onVerDetalhes} />}

      {estado === 'EXPIRED' && <PixExpired onGerarNovo={gerar} gerando={false} />}

      {(estado === 'REJECTED' || estado === 'CANCELED') && (
        <PixError
          titulo={estado === 'REJECTED' ? 'Pagamento recusado' : 'Cobrança cancelada'}
          motivo="Tente gerar um novo PIX para continuar."
          textoBotao="Gerar novo PIX"
          onTentarNovamente={gerar}
        />
      )}

      {estado === 'ERROR' && (
        <PixError
          titulo="Não foi possível consultar o pagamento"
          motivo="Verifique sua conexão e tente novamente."
          onTentarNovamente={sincronizarAgora}
          carregando={sincronizando}
        />
      )}
    </SectionCard>
  )
}
