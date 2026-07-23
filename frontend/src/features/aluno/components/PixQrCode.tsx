import { Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useClipboard } from '@/hooks/useClipboard'
import { registrarEventoPix } from '../utils/pixEventos'

/** Aceita tanto base64 cru (formato atual do backend) quanto uma URL ou data URI já prontos. */
function normalizarImagemQr(valor: string): string {
  if (valor.startsWith('http://') || valor.startsWith('https://')) return valor
  if (valor.startsWith('data:')) return valor
  return `data:image/png;base64,${valor}`
}

interface PixQrCodeProps {
  mensalidadeId: string
  qrCodeImagem: string | null
  qrCode: string | null
}

export function PixQrCode({ mensalidadeId, qrCodeImagem, qrCode }: PixQrCodeProps) {
  const { copiar, copiado } = useClipboard()

  async function handleCopiar() {
    if (!qrCode) return
    const ok = await copiar(qrCode)
    if (ok) registrarEventoPix({ tipo: 'pix_copiado', mensalidadeId })
  }

  return (
    <div className="space-y-3">
      {qrCodeImagem && (
        <div className="flex justify-center">
          <img
            src={normalizarImagemQr(qrCodeImagem)}
            alt="QR Code PIX"
            className="w-48 h-48 object-contain border border-bege-cartao rounded-lg bg-branco-puro p-2"
          />
        </div>
      )}
      {qrCode && (
        <div className="bg-branco-puro rounded-lg p-3 border border-lilas-medio/20 space-y-2">
          <p className="text-xs text-cinza-texto">PIX Copia e Cola</p>
          <div className="flex items-center gap-2">
            <p className="font-mono text-xs text-cinza-forte flex-1 break-all">{qrCode}</p>
            <Button variant="outline" size="sm" onClick={handleCopiar} className="shrink-0">
              {copiado ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
              {copiado ? 'Copiado' : 'Copiar'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
