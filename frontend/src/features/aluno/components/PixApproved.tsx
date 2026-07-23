import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PixApprovedProps {
  onVerDetalhes: () => void
}

export function PixApproved({ onVerDetalhes }: PixApprovedProps) {
  return (
    <div className="flex flex-col items-center gap-2 py-6 text-center">
      <CheckCircle2 className="w-10 h-10 text-green-600" />
      <p className="text-sm font-medium text-cinza-forte">Pagamento confirmado</p>
      <p className="text-xs text-cinza-texto">Sua mensalidade foi quitada com sucesso.</p>
      <Button variant="outline" size="sm" className="mt-2" onClick={onVerDetalhes}>
        Ver detalhes
      </Button>
    </div>
  )
}
