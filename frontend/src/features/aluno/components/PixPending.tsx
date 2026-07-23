import { Loader2, RefreshCw } from 'lucide-react'
import { PixQrCode } from './PixQrCode'
import { PixCountdown } from './PixCountdown'

interface PixPendingProps {
  mensalidadeId: string
  qrCodeImagem: string | null
  qrCode: string | null
  expiraEm: Date | null
  onVerificarAgora: () => void
  sincronizando: boolean
}

export function PixPending({
  mensalidadeId,
  qrCodeImagem,
  qrCode,
  expiraEm,
  onVerificarAgora,
  sincronizando,
}: PixPendingProps) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-cinza-texto text-center">
        Escaneie o QR Code ou copie o código abaixo no app do seu banco.
      </p>
      <PixQrCode mensalidadeId={mensalidadeId} qrCodeImagem={qrCodeImagem} qrCode={qrCode} />
      <PixCountdown expiraEm={expiraEm} />
      <div className="flex justify-center">
        <button
          type="button"
          onClick={onVerificarAgora}
          disabled={sincronizando}
          className="text-xs text-roxo-profundo hover:underline inline-flex items-center gap-1 disabled:opacity-50"
        >
          {sincronizando ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
          Verificar agora
        </button>
      </div>
    </div>
  )
}
