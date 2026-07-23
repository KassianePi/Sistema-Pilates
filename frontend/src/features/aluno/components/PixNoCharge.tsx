import { QrCode, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PixNoChargeProps {
  onGerar: () => void
  gerando: boolean
}

export function PixNoCharge({ onGerar, gerando }: PixNoChargeProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <QrCode className="w-8 h-8 text-roxo-profundo opacity-60" />
      <p className="text-sm text-cinza-texto">Gere um PIX para pagar sua mensalidade na hora.</p>
      <Button
        onClick={onGerar}
        disabled={gerando}
        className="bg-roxo-profundo hover:bg-roxo-profundo/90 text-branco-puro"
      >
        {gerando && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {gerando ? 'Gerando...' : 'Gerar cobrança PIX'}
      </Button>
    </div>
  )
}
