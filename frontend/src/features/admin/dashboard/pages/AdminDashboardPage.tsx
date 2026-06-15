import {
  Users, CalendarDays, DollarSign, TrendingUp,
  UserCheck, AlertCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/useAuth'
import { useAlunos } from '@/features/admin/alunos/hooks/useAlunos'
import { useProfessores } from '@/features/admin/professores/hooks/useProfessores'
import { useAulas } from '@/features/admin/agenda/hooks/useAgenda'
import { useMensalidades, usePagamentos } from '@/features/admin/financeiro/hooks/useFinanceiro'
import { formatarData } from '@/lib/datetime'
import type { AdminUser } from '@/types/auth.types'

function formatarValor(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

export function AdminDashboardPage() {
  const { user } = useAuth()
  const adminUser = user as AdminUser | null

  const hoje = new Date().toISOString().split('T')[0]
  const mesAtual = new Date().toISOString().slice(0, 7)

  const { data: alunosData } = useAlunos({ status: 'ATIVO', limite: 1 })
  const { data: professoresData } = useProfessores({ limite: 1 })
  const { data: aulasHoje } = useAulas({ data: hoje, limite: 50 })
  const { data: inadimplentes } = useMensalidades({ status: 'VENCIDO', limite: 1 })
  const { data: pagamentosData } = usePagamentos({ limite: 5 })
  const { data: aulasHojeAll } = useAulas({ data: hoje, limite: 10 })

  const totalAlunos = alunosData?.total ?? 0
  const totalProfessores = professoresData?.total ?? 0
  const totalAulasHoje = aulasHoje?.total ?? 0
  const totalInadimplentes = inadimplentes?.total ?? 0
  const receitaMes = (pagamentosData?.data ?? [])
    .filter(p => p.dataPagamento?.startsWith(mesAtual))
    .reduce((acc, p) => acc + p.valor, 0)

  const kpis = [
    {
      title: 'Total de Alunos',
      value: String(totalAlunos),
      description: 'Alunos ativos no momento',
      icon: Users,
      iconColor: 'text-roxo-profundo',
      iconBg: 'bg-lilas-claro',
    },
    {
      title: 'Aulas Hoje',
      value: String(totalAulasHoje),
      description: 'Aulas agendadas para hoje',
      icon: CalendarDays,
      iconColor: 'text-rosa-vibrante',
      iconBg: 'bg-rosa-vibrante/10',
    },
    {
      title: 'Receita do Mês',
      value: formatarValor(receitaMes),
      description: 'Pagamentos confirmados',
      icon: DollarSign,
      iconColor: 'text-green-600',
      iconBg: 'bg-green-50',
    },
    {
      title: 'Taxa de Presença',
      value: '—',
      description: 'Média dos últimos 30 dias',
      icon: TrendingUp,
      iconColor: 'text-lilas-medio',
      iconBg: 'bg-lilas-claro',
    },
    {
      title: 'Inadimplentes',
      value: String(totalInadimplentes),
      description: 'Alunos com pagamento vencido',
      icon: AlertCircle,
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-50',
    },
    {
      title: 'Professores Ativos',
      value: String(totalProfessores),
      description: 'Professores cadastrados',
      icon: UserCheck,
      iconColor: 'text-cinza-forte',
      iconBg: 'bg-bege-suave',
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-cinza-forte">
          Olá, {adminUser?.nome?.split(' ')[0] ?? 'Administrador'} 👋
        </h1>
        <p className="text-cinza-texto mt-1">Aqui está o resumo do studio hoje.</p>
      </div>

      <section>
        <h2 className="text-sm font-semibold text-cinza-medio uppercase tracking-wider mb-4">Visão Geral</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {kpis.map(({ title, value, description, icon: Icon, iconColor, iconBg }) => (
            <Card key={title}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-cinza-texto font-medium">{title}</p>
                    <p className="text-3xl font-bold text-cinza-forte">{value}</p>
                    <p className="text-xs text-cinza-medio">{description}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${iconBg}`}>
                    <Icon className={`w-6 h-6 ${iconColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Aulas de Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            {(aulasHojeAll?.data ?? []).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-cinza-medio">
                <CalendarDays className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">Nenhuma aula hoje.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {(aulasHojeAll?.data ?? []).map((aula) => (
                  <li key={aula.id} className="flex items-center justify-between py-2 border-b border-bege-cartao last:border-0">
                    <div>
                      <p className="text-sm font-medium text-cinza-forte">{aula.titulo}</p>
                      <p className="text-xs text-cinza-medio">{aula.professor.usuario.nomeCompleto} · {aula.horaInicio} – {aula.horaFim}</p>
                    </div>
                    <Badge variant={aula.status === 'AGENDADA' ? 'secondary' : aula.status === 'REALIZADA' ? 'success' : 'destructive'}>
                      {aula.status === 'AGENDADA' ? 'Agendada' : aula.status === 'REALIZADA' ? 'Realizada' : 'Cancelada'}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pagamentos Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {(pagamentosData?.data ?? []).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-cinza-medio">
                <DollarSign className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">Nenhum pagamento registrado.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {(pagamentosData?.data ?? []).map((p) => (
                  <li key={p.id} className="flex items-center justify-between py-2 border-b border-bege-cartao last:border-0">
                    <div>
                      <p className="text-sm font-medium text-cinza-forte">{p.mensalidade.aluno.usuario.nomeCompleto}</p>
                      <p className="text-xs text-cinza-medio">{p.mensalidade.plano.nome} · {formatarData(p.dataPagamento)}</p>
                    </div>
                    <span className="text-sm font-semibold text-green-700">{formatarValor(p.valor)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
