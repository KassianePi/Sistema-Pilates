import { useMemo, useState } from 'react'
import { ClipboardList, CheckCircle2, Percent, CalendarCheck, X, CalendarDays, TrendingUp } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { PageHeader } from '../../components/PageHeader'
import { KpiCard } from '../../components/KpiCard'
import { SectionCard } from '../../components/SectionCard'
import { LoadingState } from '../../components/LoadingState'
import { EmptyState } from '../../components/EmptyState'
import { StatusBadge } from '../../components/StatusBadge'
import { CalendarioPresenca } from '../../components/CalendarioPresenca'
import { EvolucaoFrequencia } from '../../components/EvolucaoFrequencia'
import { useAlunoFrequencia } from '../../hooks/useAlunoFrequencia'
import { calcularKpisFrequencia, calcularEvolucaoMensal } from '../../utils/frequencia'
import { formatarData } from '../../utils/format'

export function AlunoPresencaPage() {
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')

  const { data, isLoading } = useAlunoFrequencia()
  const presencas = useMemo(() => data ?? [], [data])

  const kpis = useMemo(() => calcularKpisFrequencia(presencas), [presencas])
  const evolucao = useMemo(() => calcularEvolucaoMensal(presencas, 6), [presencas])

  const lista = useMemo(
    () =>
      presencas.filter((p) => {
        if (dataInicio && p.aula.data < dataInicio) return false
        if (dataFim && p.aula.data > dataFim) return false
        return true
      }),
    [presencas, dataInicio, dataFim],
  )

  const temFiltro = !!dataInicio || !!dataFim

  return (
    <div className="space-y-6">
      <PageHeader title="Frequência" subtitle="Acompanhe sua presença e evolução nas aulas." icon={ClipboardList} />

      {isLoading ? (
        <LoadingState />
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiCard label="Aulas realizadas" icon={CheckCircle2} tone="success" value={kpis.totalPresente} />
            <KpiCard
              label="Taxa de presença"
              icon={Percent}
              tone={kpis.percentual >= 75 ? 'success' : 'warning'}
              value={`${kpis.percentual}%`}
            />
            <KpiCard label="Presenças no mês" icon={CalendarCheck} tone="roxo" value={kpis.presencasMes} />
          </div>

          {/* Calendário + Evolução */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SectionCard title="Calendário de comparecimento" icon={CalendarDays}>
              <CalendarioPresenca presencas={presencas} />
            </SectionCard>
            <SectionCard title="Evolução mensal" icon={TrendingUp}>
              <EvolucaoFrequencia pontos={evolucao} />
            </SectionCard>
          </div>

          {/* Histórico filtrável */}
          <SectionCard
            title="Histórico de frequência"
            icon={ClipboardList}
            action={
              <div className="flex items-end gap-2 flex-wrap">
                <div className="space-y-1">
                  <Label className="text-[11px] text-cinza-texto">De</Label>
                  <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="w-36 h-8" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-cinza-texto">Até</Label>
                  <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="w-36 h-8" />
                </div>
                {temFiltro && (
                  <Button variant="ghost" size="sm" aria-label="Limpar filtros de período" onClick={() => { setDataInicio(''); setDataFim('') }}>
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>
            }
          >
            {lista.length === 0 ? (
              <EmptyState icon={ClipboardList} message="Nenhum registro de presença no período." />
            ) : (
              <ul className="divide-y divide-bege-cartao -my-2">
                {lista.map((p) => (
                  <li key={p.id} className="flex items-center justify-between py-3 gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-cinza-forte">{p.aula.titulo}</p>
                      <p className="text-xs text-cinza-texto">{formatarData(p.aula.data)}{p.aula.horaInicio ? ` — ${p.aula.horaInicio}` : ''}</p>
                    </div>
                    <StatusBadge domain="presenca" status={p.status} />
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </>
      )}
    </div>
  )
}
