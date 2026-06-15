import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CalendarDays, ClipboardCheck, CreditCard, Receipt, RotateCcw, Upload, Zap,
  Bell, ChevronRight, CalendarClock, Wallet, AlertCircle, CheckCircle2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { KpiCard, type KpiTone } from '../../components/KpiCard'
import { QuickActions, type QuickAction } from '../../components/QuickActions'
import { SectionCard } from '../../components/SectionCard'
import { LoadingState } from '../../components/LoadingState'
import { EmptyState } from '../../components/EmptyState'
import { SolicitarAvulsaModal } from '../../components/SolicitarAvulsaModal'
import { useAlunoDashboard } from '../../hooks/useAlunoDashboard'
import { getStatusMeta } from '../../constants/status'
import { formatarData, formatarValor, primeiroNome } from '../../utils/format'
import { getNotificacaoMeta } from '@/lib/notificacaoMeta'

function toneFromVariant(variant: string): KpiTone {
  if (variant === 'success') return 'success'
  if (variant === 'warning') return 'warning'
  if (variant === 'destructive') return 'danger'
  return 'default'
}

function formatarHora(d: string) {
  return new Date(d).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function AulaLinha({ aula }: { aula: { id: string; titulo: string; data: string; horaInicio: string; professor: { usuario: { nomeCompleto: string } } } }) {
  return (
    <li className="flex items-start justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <p className="text-sm font-medium text-cinza-forte truncate">{aula.titulo}</p>
        <p className="text-xs text-cinza-medio">{formatarData(aula.data)} · {aula.horaInicio} · {aula.professor.usuario.nomeCompleto}</p>
      </div>
    </li>
  )
}

export function AlunoDashboardPage() {
  const [modalAvulso, setModalAvulso] = useState(false)
  const {
    proximaAula, minhasAulas, gradeGeral, aulasRealizadasMes, aulasDisponiveis, mensalidadeAtual,
    proximaCobranca, solicitacoesPendentes, ultimasNotificacoes, perfil, isLoading,
  } = useAlunoDashboard()

  const nome = primeiroNome(perfil?.nome)

  const mensStatus = mensalidadeAtual ? getStatusMeta('mensalidade', mensalidadeAtual.status) : null
  const disponiveisLabel = aulasDisponiveis.semPlano
    ? '—'
    : aulasDisponiveis.ilimitado
      ? 'Ilimitado'
      : String(aulasDisponiveis.disponiveis ?? 0)

  const quickActions: QuickAction[] = [
    { label: 'Ver agenda', description: 'Suas aulas e horários', icon: CalendarDays, tone: 'roxo', to: '/aluno/agenda' },
    { label: 'Ver financeiro', description: 'Mensalidades e pagamentos', icon: CreditCard, tone: 'verde', to: '/aluno/financeiro' },
    { label: 'Solicitar aula avulsa', description: 'Peça uma aula extra', icon: Zap, tone: 'lilas', onClick: () => setModalAvulso(true) },
    { label: 'Enviar comprovante', description: 'Comprove um pagamento', icon: Upload, tone: 'roxo', to: '/aluno/financeiro?tab=comprovantes' },
    { label: 'Solicitar reembolso', description: 'Reembolso proporcional', icon: RotateCcw, tone: 'rosa', to: '/aluno/financeiro?tab=reembolsos' },
    { label: 'Minha frequência', description: 'Presenças e evolução', icon: ClipboardCheck, tone: 'roxo', to: '/aluno/presenca' },
  ]

  return (
    <div className="space-y-8">
      {/* Saudação */}
      <div className="bg-roxo-profundo text-branco-puro rounded-2xl p-6 flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-rosa-vibrante flex items-center justify-center flex-shrink-0 text-xl font-bold">
          {nome.charAt(0)}
        </div>
        <div>
          <p className="text-white/70 text-sm">Bem-vindo de volta,</p>
          <h1 className="text-2xl font-bold mt-0.5">{nome}!</h1>
          {perfil?.plano && (
            <span className="inline-block mt-2 text-xs px-3 py-1 rounded-full bg-white/10 text-white/80">
              Plano: {perfil.plano}
            </span>
          )}
        </div>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : (
        <>
          {/* KPIs */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <KpiCard
              label="Próxima aula"
              icon={CalendarClock}
              tone="roxo"
              value={proximaAula ? formatarData(proximaAula.data) : '—'}
              hint={proximaAula ? `${proximaAula.horaInicio} · ${proximaAula.professor.usuario.nomeCompleto}` : 'Nenhuma aula agendada'}
            />
            <KpiCard
              label="Aulas realizadas no mês"
              icon={CheckCircle2}
              tone="success"
              value={aulasRealizadasMes}
            />
            <KpiCard
              label="Aulas disponíveis"
              icon={ClipboardCheck}
              value={disponiveisLabel}
              hint={!aulasDisponiveis.semPlano && !aulasDisponiveis.ilimitado ? `de ${aulasDisponiveis.cota} no plano` : undefined}
            />
            <KpiCard
              label="Situação da mensalidade"
              icon={Receipt}
              tone={mensStatus ? toneFromVariant(mensStatus.variant) : 'default'}
              value={mensStatus ? mensStatus.label : 'Em dia'}
            />
            <KpiCard
              label="Próximo vencimento"
              icon={Wallet}
              tone={proximaCobranca ? 'warning' : 'default'}
              value={proximaCobranca ? formatarValor(proximaCobranca.valor) : '—'}
              hint={proximaCobranca ? `Vence em ${formatarData(proximaCobranca.vencimento)}` : 'Nada em aberto'}
            />
            <KpiCard
              label="Solicitações pendentes"
              icon={AlertCircle}
              tone={solicitacoesPendentes > 0 ? 'warning' : 'default'}
              value={solicitacoesPendentes}
              hint="Reembolsos e comprovantes em análise"
            />
          </section>

          {/* Ações rápidas */}
          <section>
            <h2 className="text-sm font-semibold text-cinza-medio uppercase tracking-wider mb-4">Ações rápidas</h2>
            <QuickActions actions={quickActions} />
          </section>

          {/* Minha agenda — Próxima aula / Minhas aulas / Grade geral */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-cinza-medio uppercase tracking-wider">Minha agenda</h2>

            {/* Próxima aula (destaque) */}
            <SectionCard title="Próxima aula" icon={CalendarClock}>
              {proximaAula ? (
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-cinza-forte">{proximaAula.titulo}</p>
                    <p className="text-sm text-cinza-texto capitalize">{formatarData(proximaAula.data)} · {proximaAula.horaInicio}</p>
                    <p className="text-xs text-cinza-medio mt-0.5">{proximaAula.professor.usuario.nomeCompleto}</p>
                  </div>
                  {proximaAula.matriculado && <Badge variant="secondary">Matriculado</Badge>}
                </div>
              ) : (
                <EmptyState icon={CalendarDays} message="Você não tem aulas agendadas." />
              )}
            </SectionCard>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SectionCard
                title="Minhas aulas"
                icon={ClipboardCheck}
                action={<Link to="/aluno/agenda" className="text-xs text-lilas-medio hover:underline flex items-center gap-1">Ver agenda <ChevronRight className="w-3 h-3" /></Link>}
              >
                {minhasAulas.length === 0 ? (
                  <EmptyState icon={CalendarDays} message="Você não está matriculado em aulas futuras." />
                ) : (
                  <ul className="divide-y divide-bege-cartao -my-2">
                    {minhasAulas.slice(0, 5).map((a) => <AulaLinha key={a.id} aula={a} />)}
                  </ul>
                )}
              </SectionCard>

              <SectionCard
                title="Grade geral"
                icon={CalendarDays}
                action={<Link to="/aluno/agenda" className="text-xs text-lilas-medio hover:underline flex items-center gap-1">Ver grade <ChevronRight className="w-3 h-3" /></Link>}
              >
                {gradeGeral.length === 0 ? (
                  <EmptyState icon={CalendarDays} message="Nenhuma aula na grade aberta." />
                ) : (
                  <ul className="divide-y divide-bege-cartao -my-2">
                    {gradeGeral.slice(0, 5).map((a) => <AulaLinha key={a.id} aula={a} />)}
                  </ul>
                )}
              </SectionCard>
            </div>
          </section>

          {/* Últimas notificações */}
          <SectionCard
            title="Últimas notificações"
            icon={Bell}
            action={<Link to="/aluno/notificacoes" className="text-xs text-lilas-medio hover:underline flex items-center gap-1">Ver todas <ChevronRight className="w-3 h-3" /></Link>}
          >
            {ultimasNotificacoes.length === 0 ? (
              <EmptyState icon={Bell} message="Nenhuma notificação por aqui." />
            ) : (
              <ul className="divide-y divide-bege-cartao -my-2">
                {ultimasNotificacoes.map((n) => {
                  const meta = getNotificacaoMeta(n.tipo)
                  return (
                    <li key={n.id} className="flex items-start gap-3 py-3">
                      <span className={`p-2 rounded-lg shrink-0 ${meta.iconBg}`}>
                        <meta.Icon className={`w-4 h-4 ${meta.iconColor}`} />
                      </span>
                      <div className="min-w-0">
                        <p className={`text-sm ${!n.lida ? 'font-medium text-cinza-forte' : 'text-cinza-texto'}`}>{n.titulo}</p>
                        <p className="text-xs text-cinza-texto line-clamp-2">{n.mensagem}</p>
                        <p className="text-xs text-cinza-medio mt-0.5">{formatarHora(n.createdAt)}</p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </SectionCard>
        </>
      )}

      {modalAvulso && <SolicitarAvulsaModal onClose={() => setModalAvulso(false)} />}
    </div>
  )
}
