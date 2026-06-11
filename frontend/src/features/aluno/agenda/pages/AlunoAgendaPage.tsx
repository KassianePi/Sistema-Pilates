import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CalendarDays, Clock, Users, Sparkles, History } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { agendaService } from '@/services/agenda.service'
import type { CategoriaAula } from '@/types/domain.types'

type Escopo = 'minhas' | 'gerais' | 'historico'

const FILTROS: { value: Escopo; label: string; Icon: React.ElementType }[] = [
  { value: 'minhas', label: 'Minhas aulas', Icon: CalendarDays },
  { value: 'gerais', label: 'Aulas gerais disponíveis', Icon: Sparkles },
  { value: 'historico', label: 'Histórico', Icon: History },
]

const CATEGORIA_TAG: Record<CategoriaAula, { label: string; className: string }> = {
  GERAL: { label: 'Grade regular', className: 'bg-lilas-claro text-roxo-profundo border-lilas-medio/30' },
  SOB_DEMANDA: { label: 'Sob demanda', className: 'bg-rosa-vibrante/10 text-rosa-vibrante border-rosa-vibrante/30' },
}

const VAZIO: Record<Escopo, string> = {
  minhas: 'Você não tem aulas agendadas.',
  gerais: 'Nenhuma aula geral disponível no momento.',
  historico: 'Nenhuma aula no seu histórico ainda.',
}

function formatarData(d: string) {
  return new Date(d).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
}

export function AlunoAgendaPage() {
  const [escopo, setEscopo] = useState<Escopo>('minhas')

  const { data: aulasData, isLoading } = useQuery({
    queryKey: ['aulas-aluno', escopo],
    queryFn: () => agendaService.listarAulasAluno({ escopo, limit: 50 }),
  })
  const aulas = aulasData?.data ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-cinza-forte">Minhas Aulas</h1>
        <p className="text-sm text-cinza-texto mt-1">Aulas agendadas, grade aberta e histórico.</p>
      </div>

      {/* Filtros de escopo */}
      <div className="flex flex-wrap gap-2">
        {FILTROS.map((f) => (
          <button
            key={f.value}
            onClick={() => setEscopo(f.value)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors border',
              escopo === f.value
                ? 'bg-roxo-profundo text-branco-puro border-roxo-profundo'
                : 'bg-branco-puro text-cinza-texto border-bege-cartao hover:bg-lilas-claro/40',
            )}
          >
            <f.Icon className="w-4 h-4" /> {f.label}
          </button>
        ))}
      </div>

      {/* Legenda de segmentação */}
      <div className="flex flex-wrap gap-4 text-xs text-cinza-medio">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-lilas-medio inline-block" /> Grade regular
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rosa-vibrante inline-block" /> Sob demanda (particular/reposição)
        </span>
      </div>

      {isLoading ? (
        <p className="text-cinza-medio text-sm">Carregando...</p>
      ) : aulas.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-cinza-medio">
            <CalendarDays className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm">{VAZIO[escopo]}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {aulas.map((aula) => {
            const tag = CATEGORIA_TAG[aula.categoria ?? 'GERAL']
            return (
              <Card key={aula.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <p className="font-semibold text-cinza-forte">{aula.titulo}</p>
                      <p className="text-sm text-cinza-texto capitalize">{formatarData(aula.data)}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-cinza-medio">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {aula.horaInicio} – {aula.horaFim}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {aula.professor.usuario.nomeCompleto}
                        </span>
                        <span>{aula.vagasOcupadas}/{aula.vagas} vagas</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={cn('text-[11px] px-2 py-0.5 rounded-full border font-medium', tag.className)}>{tag.label}</span>
                      {aula.modalidade?.nome && <Badge variant="secondary">{aula.modalidade.nome}</Badge>}
                      <Badge variant="outline">{aula.tipo}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
