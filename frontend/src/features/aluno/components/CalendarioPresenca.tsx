import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { mapaPresencasPorDia } from '../utils/frequencia'
import type { PresencaAluno } from '@/services/presenca.service'
import type { StatusPresenca } from '@/types/domain.types'

const DIAS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

const COR: Record<StatusPresenca, string> = {
  PRESENTE: 'bg-green-100 text-green-700 border-green-200',
  AUSENTE: 'bg-rosa-vibrante/10 text-rosa-vibrante border-rosa-vibrante/30',
  JUSTIFICADO: 'bg-amber-50 text-amber-700 border-amber-200',
}

const pad = (n: number) => String(n).padStart(2, '0')

export function CalendarioPresenca({ presencas }: { presencas: PresencaAluno[] }) {
  const [ref, setRef] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const mapa = useMemo(() => mapaPresencasPorDia(presencas), [presencas])

  const ano = ref.getFullYear()
  const mes = ref.getMonth()
  const primeiroDiaSemana = new Date(ano, mes, 1).getDay()
  const diasNoMes = new Date(ano, mes + 1, 0).getDate()
  const celulas: (number | null)[] = [
    ...Array(primeiroDiaSemana).fill(null),
    ...Array.from({ length: diasNoMes }, (_, i) => i + 1),
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setRef(new Date(ano, mes - 1, 1))} className="p-1.5 rounded-md hover:bg-bege-suave" aria-label="Mês anterior">
          <ChevronLeft className="w-4 h-4 text-cinza-texto" />
        </button>
        <p className="text-sm font-medium text-cinza-forte">{MESES[mes]} {ano}</p>
        <button onClick={() => setRef(new Date(ano, mes + 1, 1))} className="p-1.5 rounded-md hover:bg-bege-suave" aria-label="Próximo mês">
          <ChevronRight className="w-4 h-4 text-cinza-texto" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {DIAS.map((d, i) => <span key={i} className="text-[11px] text-cinza-texto font-medium py-1">{d}</span>)}
        {celulas.map((dia, i) => {
          if (dia === null) return <span key={i} />
          const status = mapa[`${ano}-${pad(mes + 1)}-${pad(dia)}`]
          return (
            <div
              key={i}
              className={cn(
                'aspect-square flex items-center justify-center text-xs rounded-md border',
                status ? COR[status] : 'border-transparent text-cinza-texto',
              )}
            >
              {dia}
            </div>
          )
        })}
      </div>

      <div className="flex flex-wrap gap-3 mt-3 text-[11px] text-cinza-texto">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block" /> Presente</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rosa-vibrante inline-block" /> Ausente</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> Justificado</span>
      </div>
    </div>
  )
}
