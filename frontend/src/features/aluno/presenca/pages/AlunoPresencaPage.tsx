import { useQuery } from '@tanstack/react-query'
import { ClipboardList, CheckCircle2, XCircle, MinusCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { api } from '@/services/api'
import type { ApiResponse, PaginatedResponse, Presenca, StatusPresenca } from '@/types/domain.types'

function useMinhasPresencas() {
  return useQuery({
    queryKey: ['presencas-aluno'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<PaginatedResponse<Presenca>>>('/presencas', { params: { limite: 50 } })
      return data.data
    },
  })
}

function formatarData(d: string) {
  return new Date(d).toLocaleDateString('pt-BR')
}

const STATUS_PRESENCA: Record<StatusPresenca, { label: string; variant: 'success' | 'destructive' | 'warning'; Icon: React.ElementType }> = {
  PRESENTE: { label: 'Presente', variant: 'success', Icon: CheckCircle2 },
  AUSENTE: { label: 'Ausente', variant: 'destructive', Icon: XCircle },
  JUSTIFICADO: { label: 'Justificado', variant: 'warning', Icon: MinusCircle },
}

export function AlunoPresencaPage() {
  const { data, isLoading } = useMinhasPresencas()
  const presencas = data?.data ?? []

  const totalPresente = presencas.filter(p => p.status === 'PRESENTE').length
  const percentual = presencas.length > 0 ? Math.round((totalPresente / presencas.length) * 100) : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-cinza-forte">Minha Presença</h1>
        <p className="text-sm text-cinza-texto mt-1">Histórico de frequência nas aulas.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-cinza-texto">Taxa de presença</p>
            <p className={`text-2xl font-bold mt-1 ${percentual >= 75 ? 'text-green-700' : 'text-amber-600'}`}>{percentual}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-cinza-texto">Aulas presentes</p>
            <p className="text-2xl font-bold text-cinza-forte mt-1">{totalPresente}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-cinza-texto">Total registrado</p>
            <p className="text-2xl font-bold text-cinza-forte mt-1">{presencas.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Frequência</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-cinza-medio text-sm py-6 text-center">Carregando...</p>
          ) : presencas.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-cinza-medio">
              <ClipboardList className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">Nenhum registro de presença.</p>
            </div>
          ) : (
            <ul className="divide-y divide-bege-cartao">
              {presencas.map((p) => {
                const { label, variant, Icon } = STATUS_PRESENCA[p.status]
                return (
                  <li key={p.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-cinza-forte">{p.aula.titulo}</p>
                      <p className="text-xs text-cinza-medio">{formatarData(p.aula.data)} — {p.aula.horaInicio}</p>
                    </div>
                    <Badge variant={variant}>
                      <Icon className="w-3 h-3 mr-1" />
                      {label}
                    </Badge>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
