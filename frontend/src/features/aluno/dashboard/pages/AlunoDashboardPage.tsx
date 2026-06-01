import { CalendarDays, ClipboardCheck, CreditCard, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import type { AlunoUser } from '@/types/auth.types'

interface QuickLinkProps {
  to: string
  icon: React.ElementType
  label: string
  description: string
  iconColor: string
  iconBg: string
}

function QuickLink({ to, icon: Icon, label, description, iconColor, iconBg }: QuickLinkProps) {
  return (
    <Link
      to={to}
      className="flex items-center gap-4 p-4 rounded-xl bg-branco-puro border border-bege-cartao hover:border-lilas-medio hover:shadow-sm transition-all group"
    >
      <div className={`p-3 rounded-xl ${iconBg} flex-shrink-0`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-cinza-forte text-sm">{label}</p>
        <p className="text-cinza-texto text-xs mt-0.5">{description}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-cinza-medio group-hover:text-lilas-medio transition-colors" />
    </Link>
  )
}

const quickLinks: QuickLinkProps[] = [
  {
    to: '/aluno/agenda',
    icon: CalendarDays,
    label: 'Minhas Aulas',
    description: 'Veja seus horários e próximas aulas',
    iconColor: 'text-roxo-profundo',
    iconBg: 'bg-lilas-claro',
  },
  {
    to: '/aluno/presenca',
    icon: ClipboardCheck,
    label: 'Minha Presença',
    description: 'Acompanhe sua frequência nas aulas',
    iconColor: 'text-rosa-vibrante',
    iconBg: 'bg-rosa-vibrante/10',
  },
  {
    to: '/aluno/financeiro',
    icon: CreditCard,
    label: 'Financeiro',
    description: 'Visualize seus pagamentos e mensalidades',
    iconColor: 'text-green-600',
    iconBg: 'bg-green-50',
  },
]

export function AlunoDashboardPage() {
  const { user } = useAuth()
  const alunoUser = user as AlunoUser | null
  const firstName = alunoUser?.nome?.split(' ')[0] ?? 'Aluno'

  return (
    <div className="space-y-8">
      {/* Saudação */}
      <div className="bg-roxo-profundo text-branco-puro rounded-2xl p-6 flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-rosa-vibrante flex items-center justify-center flex-shrink-0 text-xl font-bold">
          {firstName.charAt(0)}
        </div>
        <div>
          <p className="text-white/70 text-sm">Bem-vindo de volta,</p>
          <h1 className="text-2xl font-bold mt-0.5">{firstName}!</h1>
          {alunoUser?.plano && (
            <span className="inline-block mt-2 text-xs px-3 py-1 rounded-full bg-white/10 text-white/80">
              Plano: {alunoUser.plano}
            </span>
          )}
        </div>
      </div>

      {/* Acesso rápido */}
      <section>
        <h2 className="text-sm font-semibold text-cinza-medio uppercase tracking-wider mb-4">
          Acesso Rápido
        </h2>
        <div className="space-y-3">
          {quickLinks.map((link) => (
            <QuickLink key={link.to} {...link} />
          ))}
        </div>
      </section>

      {/* Resumo */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Próxima Aula</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-6 text-center text-cinza-medio">
              <CalendarDays className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm">Nenhuma aula agendada</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Situação Financeira</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-6 text-center text-cinza-medio">
              <CreditCard className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm">Carregando informações...</p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
