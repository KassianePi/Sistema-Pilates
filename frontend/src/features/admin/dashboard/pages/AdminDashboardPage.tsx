import {
  Users,
  CalendarDays,
  DollarSign,
  TrendingUp,
  UserCheck,
  AlertCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import type { AdminUser } from '@/types/auth.types'

interface KpiCardProps {
  title: string
  value: string
  description: string
  icon: React.ElementType
  iconColor: string
  iconBg: string
}

function KpiCard({ title, value, description, icon: Icon, iconColor, iconBg }: KpiCardProps) {
  return (
    <Card>
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
  )
}

const kpis: KpiCardProps[] = [
  {
    title: 'Total de Alunos',
    value: '—',
    description: 'Alunos ativos no momento',
    icon: Users,
    iconColor: 'text-roxo-profundo',
    iconBg: 'bg-lilas-claro',
  },
  {
    title: 'Aulas Hoje',
    value: '—',
    description: 'Aulas agendadas para hoje',
    icon: CalendarDays,
    iconColor: 'text-rosa-vibrante',
    iconBg: 'bg-rosa-vibrante/10',
  },
  {
    title: 'Receita do Mês',
    value: '—',
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
    value: '—',
    description: 'Alunos com pagamento em atraso',
    icon: AlertCircle,
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-50',
  },
  {
    title: 'Professores Ativos',
    value: '—',
    description: 'Professores cadastrados',
    icon: UserCheck,
    iconColor: 'text-cinza-forte',
    iconBg: 'bg-bege-suave',
  },
]

export function AdminDashboardPage() {
  const { user } = useAuth()
  const adminUser = user as AdminUser | null

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold text-cinza-forte">
          Olá, {adminUser?.nome?.split(' ')[0] ?? 'Administrador'} 👋
        </h1>
        <p className="text-cinza-texto mt-1">
          Aqui está o resumo do studio hoje.
        </p>
      </div>

      {/* KPIs */}
      <section>
        <h2 className="text-sm font-semibold text-cinza-medio uppercase tracking-wider mb-4">
          Visão Geral
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {kpis.map((kpi) => (
            <KpiCard key={kpi.title} {...kpi} />
          ))}
        </div>
      </section>

      {/* Atividade recente */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Próximas Aulas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-10 text-center text-cinza-medio">
              <CalendarDays className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">
                As aulas de hoje aparecerão aqui.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pagamentos Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-10 text-center text-cinza-medio">
              <DollarSign className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">
                Os pagamentos confirmados aparecerão aqui.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
