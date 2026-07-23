import { useQuery } from '@tanstack/react-query'
import { HeartPulse, Image as ImageIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '../../components/PageHeader'
import { SectionCard } from '../../components/SectionCard'
import { LoadingState } from '../../components/LoadingState'
import { EmptyState } from '../../components/EmptyState'
import { avaliacoesService } from '@/services/avaliacoes.service'
import { formatarData } from '../../utils/format'

export function AlunoAvaliacoesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['minhas-avaliacoes'],
    queryFn: () => avaliacoesService.listarMinhas({ limit: 50 }),
  })

  const avaliacoes = data?.avaliacoes ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Avaliações Corporais"
        subtitle="Histórico das suas avaliações realizadas pelo studio."
        icon={HeartPulse}
      />

      {isLoading ? (
        <LoadingState />
      ) : (
        <SectionCard title="Histórico" icon={HeartPulse}>
          {avaliacoes.length === 0 ? (
            <EmptyState icon={HeartPulse} message="Nenhuma avaliação registrada ainda." />
          ) : (
            <ul className="divide-y divide-bege-cartao -my-2">
              {avaliacoes.map((a) => (
                <li key={a.id} className="py-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-sm font-medium text-cinza-forte">{formatarData(a.dataAvaliacao)}</span>
                    <span className="flex items-center gap-2 text-sm text-cinza-texto">
                      {a.peso != null && <span>{Number(a.peso)} kg</span>}
                      {a.altura != null && <span>{Number(a.altura)} m</span>}
                      {a.imc != null && <Badge variant="outline">IMC {a.imc}</Badge>}
                    </span>
                  </div>
                  {a.queixaPrincipal && (
                    <p className="text-sm text-cinza-texto mt-1">
                      <strong className="text-cinza-forte">Queixa:</strong> {a.queixaPrincipal}
                    </p>
                  )}
                  {a.observacoesGerais && <p className="text-sm text-cinza-texto mt-1">{a.observacoesGerais}</p>}
                  {a.fotos.length > 0 && (
                    <p className="text-xs text-cinza-medio mt-1 flex items-center gap-1">
                      <ImageIcon className="w-3 h-3" /> {a.fotos.length} foto(s) anexada(s)
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      )}
    </div>
  )
}
