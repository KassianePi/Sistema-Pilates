import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCountdown } from '../hooks/useCountdown'
import { PIX_EXPIRATION_WARNING_SECONDS } from '../constants/pagamentoPix'

interface PixCountdownProps {
  expiraEm: Date | null
}

export function PixCountdown({ expiraEm }: PixCountdownProps) {
  const { formatado, segundosRestantes, expirado } = useCountdown(expiraEm)

  if (!expiraEm || expirado) return null

  const urgente = segundosRestantes <= PIX_EXPIRATION_WARNING_SECONDS

  return (
    <p
      className={cn(
        'text-xs flex items-center gap-1 justify-center',
        urgente ? 'text-rosa-vibrante font-medium' : 'text-cinza-texto',
      )}
    >
      <Clock className="w-3.5 h-3.5" />
      Expira em {formatado}
    </p>
  )
}
