import { AlertTriangle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PixErrorProps {
  titulo: string
  motivo?: string | null
  textoBotao?: string
  carregando?: boolean
  onTentarNovamente: () => void
}

/** Cobre REJECTED, CANCELED e ERROR — visualmente idênticos, só o texto muda por props. */
export function PixError({
  titulo,
  motivo,
  textoBotao = 'Tentar novamente',
  carregando,
  onTentarNovamente,
}: PixErrorProps) {
  return (
    <div className="flex flex-col items-center gap-2 py-6 text-center">
      <AlertTriangle className="w-10 h-10 text-rosa-vibrante" />
      <p className="text-sm font-medium text-cinza-forte">{titulo}</p>
      {motivo && <p className="text-xs text-cinza-texto">{motivo}</p>}
      <Button
        onClick={onTentarNovamente}
        disabled={carregando}
        variant="outline"
        className="mt-2 border-rosa-vibrante/30 text-rosa-vibrante hover:bg-rosa-vibrante/5"
      >
        {carregando && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {textoBotao}
      </Button>
    </div>
  )
}
