import { TimerOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PixExpiredProps {
  onGerarNovo: () => void
  gerando: boolean
}

export function PixExpired({ onGerarNovo, gerando }: PixExpiredProps) {
  return (
    <div className="flex flex-col items-center gap-2 py-6 text-center">
      <TimerOff className="w-10 h-10 text-cinza-texto opacity-50" />
      <p className="text-sm font-medium text-cinza-forte">PIX expirado</p>
      <p className="text-xs text-cinza-texto">O tempo para pagamento acabou. Gere um novo código para continuar.</p>
      <Button
        onClick={onGerarNovo}
        disabled={gerando}
        className="mt-2 bg-roxo-profundo hover:bg-roxo-profundo/90 text-branco-puro"
      >
        {gerando && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Gerar novo PIX
      </Button>
    </div>
  )
}
