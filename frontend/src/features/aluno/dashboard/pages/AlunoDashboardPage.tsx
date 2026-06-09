import { useState } from 'react'
import { CalendarDays, ClipboardCheck, CreditCard, ChevronRight, Clock, CheckCircle2, AlertTriangle, AlertCircle, Send, RotateCcw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { useAulas } from '@/features/admin/agenda/hooks/useAgenda'
import { financeiroService } from '@/services/financeiro.service'
import type { AlunoUser } from '@/types/auth.types'
import type { StatusMensalidade } from '@/types/domain.types'

function formatarData(d: string) {
  return new Date(d).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })
}
function formatarValor(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

const STATUS_MENSALIDADE: Record<StatusMensalidade, { label: string; variant: 'success' | 'warning' | 'destructive' | 'outline'; Icon: React.ElementType }> = {
  PAGO: { label: 'Em dia', variant: 'success', Icon: CheckCircle2 },
  PENDENTE: { label: 'Pendente', variant: 'warning', Icon: AlertTriangle },
  VENCIDO: { label: 'Vencido', variant: 'destructive', Icon: AlertCircle },
  CANCELADO: { label: 'Cancelado', variant: 'outline', Icon: () => null },
  PARCIAL: { label: 'Parcial', variant: 'warning', Icon: AlertTriangle },
}

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
    description: 'Mensalidades, pagamentos e estornos',
    iconColor: 'text-green-600',
    iconBg: 'bg-green-50',
  },
]

export function AlunoDashboardPage() {
  const { user } = useAuth()
  const alunoUser = user as AlunoUser | null
  const firstName = alunoUser?.nome?.split(' ')[0] ?? 'Aluno'

  const [notificandoId, setNotificandoId] = useState<string | null>(null)

  const hoje = new Date().toISOString().split('T')[0]
  const { data: aulasData, isLoading: loadingAulas } = useAulas({ status: 'AGENDADA', limite: 30 })
  const proximaAula = (aulasData?.data ?? []).filter(a => a.data >= hoje)[0] ?? null

  const { data: mensalidadesData, isLoading: loadingMensalidades } = useQuery({
    queryKey: ['mensalidades-aluno-dashboard'],
    queryFn: () => financeiroService.listarMinhasMensalidades({ limite: 3 }),
  })
  const ultimaMensalidade = (mensalidadesData?.data ?? [])[0] ?? null

  const notificarPagamento = useMutation({
    mutationFn: (mensalidadeId: string) => financeiroService.notificarPagamento(mensalidadeId),
    onSuccess: () => {
      toast.success('Studio notificado! Aguarde a confirmação do pagamento.')
      setNotificandoId(null)
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Erro ao notificar pagamento.')
      setNotificandoId(null)
    },
  })

  function handleNotificar(mensalidadeId: string) {
    setNotificandoId(mensalidadeId)
    notificarPagamento.mutate(mensalidadeId)
  }

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
        {/* Próxima Aula */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Próxima Aula</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAulas ? (
              <p className="text-cinza-medio text-sm py-4 text-center">Carregando...</p>
            ) : proximaAula ? (
              <div className="space-y-3">
                <div>
                  <p className="font-semibold text-cinza-forte">{proximaAula.titulo}</p>
                  <p className="text-sm text-cinza-texto mt-0.5 capitalize">{formatarData(proximaAula.data)}</p>
                </div>
                <div className="flex items-center gap-3 text-sm text-cinza-medio">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {proximaAula.horaInicio} – {proximaAula.horaFim}
                  </span>
                </div>
                <p className="text-xs text-cinza-texto">{proximaAula.professor.usuario.nomeCompleto}</p>
                <Link
                  to="/aluno/agenda"
                  className="inline-flex items-center gap-1 text-xs text-lilas-medio hover:underline mt-1"
                >
                  Ver todas as aulas <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center text-cinza-medio">
                <CalendarDays className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">Nenhuma aula agendada</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Situação Financeira */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Situação Financeira</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingMensalidades ? (
              <p className="text-cinza-medio text-sm py-4 text-center">Carregando...</p>
            ) : ultimaMensalidade ? (
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-cinza-forte">{ultimaMensalidade.plano?.nome ?? 'Aula avulsa'}</p>
                    <p className="text-sm text-cinza-texto mt-0.5">
                      Vencimento: {new Date(ultimaMensalidade.vencimento).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  {(() => {
                    const info = STATUS_MENSALIDADE[ultimaMensalidade.status] ?? STATUS_MENSALIDADE.PENDENTE
                    return (
                      <Badge variant={info.variant}>
                        <info.Icon className="w-3 h-3 mr-1" />
                        {info.label}
                      </Badge>
                    )
                  })()}
                </div>
                <p className="text-2xl font-bold text-cinza-forte">{formatarValor(ultimaMensalidade.valor)}</p>

                {/* Ações rápidas */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {(ultimaMensalidade.status === 'PENDENTE' || ultimaMensalidade.status === 'VENCIDO') && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs text-roxo-profundo border-roxo-profundo/30 hover:bg-roxo-profundo/5"
                      onClick={() => handleNotificar(ultimaMensalidade.id)}
                      disabled={notificarPagamento.isPending && notificandoId === ultimaMensalidade.id}
                    >
                      <Send className="w-3.5 h-3.5 mr-1" />
                      {notificarPagamento.isPending && notificandoId === ultimaMensalidade.id ? 'Enviando...' : 'Notificar pagamento'}
                    </Button>
                  )}
                  {(ultimaMensalidade.status === 'PAGO' || ultimaMensalidade.status === 'PARCIAL') && (
                    <Link to="/aluno/financeiro">
                      <Button size="sm" variant="outline" className="text-xs text-rosa-vibrante border-rosa-vibrante/30 hover:bg-rosa-vibrante/5">
                        <RotateCcw className="w-3.5 h-3.5 mr-1" /> Solicitar estorno
                      </Button>
                    </Link>
                  )}
                </div>

                <Link
                  to="/aluno/financeiro"
                  className="inline-flex items-center gap-1 text-xs text-lilas-medio hover:underline"
                >
                  Ver histórico completo <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center text-cinza-medio">
                <CreditCard className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">Nenhuma mensalidade encontrada</p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
