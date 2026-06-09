import { useQuery } from '@tanstack/react-query'
import { CalendarDays, Clock, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { agendaService } from '@/services/agenda.service'

function useAulasAluno() {
  return useQuery({
    queryKey: ['aulas-aluno'],
    queryFn: () => agendaService.listarAulasAluno({ limit: 30 }),
  })
}

function formatarData(d: string) {
  return new Date(d).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
}

export function AlunoAgendaPage() {
  const hoje = new Date().toISOString().split('T')[0]
  const { data: aulasData, isLoading } = useAulasAluno()
  const aulas = (aulasData?.data ?? []).filter((a) => a.data >= hoje)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-cinza-forte">Minhas Aulas</h1>
        <p className="text-sm text-cinza-texto mt-1">Próximas aulas agendadas.</p>
      </div>

      {isLoading ? (
        <p className="text-cinza-medio text-sm">Carregando...</p>
      ) : aulas.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-cinza-medio">
            <CalendarDays className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm">Nenhuma aula agendada.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {aulas.map((aula) => (
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
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant="secondary">{aula.modalidade}</Badge>
                    <Badge variant="outline">{aula.tipo}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
