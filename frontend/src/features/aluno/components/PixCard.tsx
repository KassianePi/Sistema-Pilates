import { QrCode, Copy, Info } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const TIPO_CHAVE: Record<string, string> = {
  CPF: 'CPF',
  EMAIL: 'E-mail',
  CELULAR: 'Celular',
  ALEATORIA: 'Chave aleatória',
}

interface PixCardProps {
  chavePix?: string | null
  tipoChavePix?: string | null
  nomeRecebedor?: string | null
  qrCodeBase64?: string | null
}

export function PixCard({ chavePix, tipoChavePix, nomeRecebedor, qrCodeBase64 }: PixCardProps) {
  function copiar() {
    if (!chavePix) return
    navigator.clipboard.writeText(chavePix)
    toast.success('Chave PIX copiada!')
  }

  return (
    <Card className="border-lilas-medio/30 bg-lilas-claro/30">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base text-roxo-profundo">
          <QrCode className="w-4 h-4" /> Como pagar via PIX
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-cinza-texto">Realize o pagamento via PIX e envie o comprovante para confirmação.</p>

        {chavePix && (
          <div className="bg-branco-puro rounded-lg p-3 border border-lilas-medio/20 space-y-1">
            <p className="text-xs text-cinza-medio">{tipoChavePix ? TIPO_CHAVE[tipoChavePix] ?? tipoChavePix : 'Chave PIX'}</p>
            <div className="flex items-center gap-2">
              <p className="font-mono text-sm font-semibold text-cinza-forte flex-1 break-all">{chavePix}</p>
              <Button variant="outline" size="sm" onClick={copiar} className="shrink-0">
                <Copy className="w-3.5 h-3.5 mr-1" /> Copiar
              </Button>
            </div>
            {nomeRecebedor && <p className="text-xs text-cinza-texto">Recebedor: <strong>{nomeRecebedor}</strong></p>}
          </div>
        )}

        {qrCodeBase64 && (
          <div className="flex justify-center">
            <img src={qrCodeBase64} alt="QR Code PIX" className="w-40 h-40 object-contain border border-bege-cartao rounded-lg bg-branco-puro" />
          </div>
        )}

        <p className="text-xs text-cinza-medio flex items-center gap-1">
          <Info className="w-3 h-3 shrink-0" />
          Após pagar, envie o comprovante pelo portal. A confirmação é feita manualmente pelo studio.
        </p>
      </CardContent>
    </Card>
  )
}
