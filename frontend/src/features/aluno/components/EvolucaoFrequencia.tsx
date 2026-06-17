import { cn } from '@/lib/utils'
import type { PontoEvolucao } from '../utils/frequencia'

export function EvolucaoFrequencia({ pontos }: { pontos: PontoEvolucao[] }) {
  const temDados = pontos.some((p) => p.totalRegistros > 0)
  if (!temDados) {
    return <p className="text-sm text-cinza-texto py-4 text-center">Sem dados de frequência ainda.</p>
  }

  return (
    <div className="flex items-end justify-between gap-2 h-36">
      {pontos.map((p) => {
        const cor =
          p.totalRegistros === 0 ? 'bg-bege-cartao'
            : p.percentual >= 75 ? 'bg-green-400'
            : p.percentual >= 50 ? 'bg-amber-400'
            : 'bg-rosa-vibrante'
        return (
          <div key={`${p.ano}-${p.mes}`} className="flex-1 flex flex-col items-center justify-end gap-1 h-full">
            <span className="text-[11px] font-medium text-cinza-texto">{p.totalRegistros > 0 ? `${p.percentual}%` : '—'}</span>
            <div className="w-full flex items-end justify-center flex-1">
              <div
                className={cn('w-full max-w-[36px] rounded-t-md transition-all', cor)}
                style={{ height: `${Math.max(p.totalRegistros > 0 ? p.percentual : 0, 3)}%` }}
              />
            </div>
            <span className="text-[11px] text-cinza-texto capitalize">{p.label}</span>
          </div>
        )
      })}
    </div>
  )
}
