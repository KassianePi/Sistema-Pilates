import { Receipt, Upload, FileCheck, XCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatarDataHora } from '../utils/format'
import type { EventoFinanceiro, TipoEventoFinanceiro } from '../utils/timelineFinanceira'

const META: Record<TipoEventoFinanceiro, { Icon: React.ElementType; color: string; bg: string }> = {
  MENSALIDADE_GERADA: { Icon: Receipt, color: 'text-amber-600', bg: 'bg-amber-50' },
  COMPROVANTE_ENVIADO: { Icon: Upload, color: 'text-roxo-profundo', bg: 'bg-lilas-claro' },
  COMPROVANTE_APROVADO: { Icon: FileCheck, color: 'text-green-600', bg: 'bg-green-50' },
  COMPROVANTE_REJEITADO: { Icon: XCircle, color: 'text-rosa-vibrante', bg: 'bg-rosa-vibrante/10' },
  PAGAMENTO_CONFIRMADO: { Icon: CheckCircle2, color: 'text-green-700', bg: 'bg-green-50' },
}

export function TimelineFinanceira({ eventos }: { eventos: EventoFinanceiro[] }) {
  if (eventos.length === 0) {
    return <p className="text-sm text-cinza-texto py-4 text-center">Nenhum evento financeiro ainda.</p>
  }
  return (
    <ol className="relative border-l border-bege-cartao ml-3 space-y-5 py-1">
      {eventos.map((e) => {
        const m = META[e.tipo]
        return (
          <li key={e.id} className="ml-6">
            <span className={cn('absolute -left-3 flex items-center justify-center w-6 h-6 rounded-full ring-4 ring-branco-puro', m.bg)}>
              <m.Icon className={cn('w-3.5 h-3.5', m.color)} />
            </span>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <p className="text-sm font-medium text-cinza-forte">{e.titulo}</p>
              <span className="text-xs text-cinza-texto">{formatarDataHora(e.data)}</span>
            </div>
            {e.descricao && <p className="text-xs text-cinza-texto mt-0.5">{e.descricao}</p>}
          </li>
        )
      })}
    </ol>
  )
}
