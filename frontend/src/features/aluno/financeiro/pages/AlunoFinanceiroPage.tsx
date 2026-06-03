import { DollarSign, CheckCircle2, Clock, AlertTriangle } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { financeiroService } from '@/services/financeiro.service'
import { useAuth } from '@/hooks/useAuth'
import type { AlunoUser } from '@/types/auth.types'
import type { StatusMensalidade } from '@/types/domain.types'

function formatarValor(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}
function formatarData(d: string) {
  return new Date(d).toLocaleDateString('pt-BR')
}

const STATUS_BADGE: Record<StatusMensalidade, { label: string; variant: 'success' | 'warning' | 'destructive' | 'outline'; Icon: React.ElementType }> = {
  PAGO: { label: 'Pago', variant: 'success', Icon: CheckCircle2 },
  PENDENTE: { label: 'Pendente', variant: 'warning', Icon: Clock },
  VENCIDO: { label: 'Vencido', variant: 'destructive', Icon: AlertTriangle },
  CANCELADO: { label: 'Cancelado', variant: 'outline', Icon: () => null },
}

export function AlunoFinanceiroPage() {
  const { user } = useAuth()
  const alunoUser = user as AlunoUser | null

  const { data: mensalidadesData, isLoading } = useQuery({
    queryKey: ['mensalidades-aluno', alunoUser?.id],
    queryFn: () => financeiroService.listarMensalidades({ limite: 24 }),
    enabled: !!alunoUser,
  })

  const mensalidades = mensalidadesData?.data ?? []
  const pendentes = mensalidades.filter(m => m.status === 'PENDENTE' || m.status === 'VENCIDO')
  const total = mensalidades.reduce((acc, m) => m.status === 'PAGO' ? acc + m.valor : acc, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-cinza-forte">Meu Financeiro</h1>
        <p className="text-sm text-cinza-texto mt-1">Histórico de mensalidades e pagamentos.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-cinza-texto">Total pago</p>
            <p className="text-2xl font-bold text-green-700 mt-1">{formatarValor(total)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-cinza-texto">Pendentes</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{pendentes.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-cinza-texto">Total de registros</p>
            <p className="text-2xl font-bold text-cinza-forte mt-1">{mensalidades.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Mensalidades</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-cinza-medio text-sm py-6 text-center">Carregando...</p>
          ) : mensalidades.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-cinza-medio">
              <DollarSign className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">Nenhuma mensalidade encontrada.</p>
            </div>
          ) : (
            <ul className="divide-y divide-bege-cartao">
              {mensalidades.map((m) => {
                const { label, variant, Icon } = STATUS_BADGE[m.status]
                return (
                  <li key={m.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-cinza-forte">{m.plano.nome}</p>
                      <p className="text-xs text-cinza-medio">Vencimento: {formatarData(m.vencimento)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-cinza-forte">{formatarValor(m.valor)}</span>
                      <Badge variant={variant}>
                        <Icon className="w-3 h-3 mr-1" />
                        {label}
                      </Badge>
                    </div>
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
