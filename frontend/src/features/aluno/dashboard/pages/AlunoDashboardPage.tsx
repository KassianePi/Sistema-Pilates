import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  ClipboardCheck,
  RotateCcw,
  Upload,
  Zap,
  Bell,
  ChevronRight,
  CalendarClock,
  Wallet,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "../../components/KpiCard";
import { QuickActions, type QuickAction } from "../../components/QuickActions";
import { SectionCard } from "../../components/SectionCard";
import { LoadingState } from "../../components/LoadingState";
import { EmptyState } from "../../components/EmptyState";
import { SolicitarAvulsaModal } from "../../components/SolicitarAvulsaModal";
import { DetalheAulaModal } from "../../components/DetalheAulaModal";
import { useAlunoDashboard } from "../../hooks/useAlunoDashboard";
import { useMarcarLida } from "../../hooks/useAlunoNotificacoes";
import {
  formatarData,
  formatarDataHora,
  formatarValor,
  primeiroNome,
} from "../../utils/format";
import { getNotificacaoMeta, getNotificacaoLink } from "@/lib/notificacaoMeta";
import type { Aula } from "@/types/domain.types";

function AulaLinha({ aula, onClick }: { aula: Aula; onClick: () => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="w-full flex items-center justify-between gap-3 py-2.5 text-left group"
      >
        <div className="min-w-0">
          <p className="text-sm font-medium text-cinza-forte truncate">
            {aula.titulo}
          </p>
          <p className="text-xs text-cinza-texto">
            {formatarData(aula.data)} · {aula.horaInicio} ·{" "}
            {aula.professor.usuario.nomeCompleto}
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-cinza-texto group-hover:text-lilas-medio transition-colors shrink-0" />
      </button>
    </li>
  );
}

export function AlunoDashboardPage() {
  const navigate = useNavigate();
  const marcarLida = useMarcarLida();
  const [modalAvulso, setModalAvulso] = useState(false);
  const [detalhe, setDetalhe] = useState<Aula | null>(null);
  const {
    proximaAula,
    minhasAulas,
    gradeGeral,
    aulasRealizadasMes,
    aulasDisponiveis,
    totalEmAberto,
    qtdEmAberto,
    temVencido,
    solicitacoesPendentes,
    ultimasNotificacoes,
    perfil,
    isLoading,
  } = useAlunoDashboard();

  const nome = primeiroNome(perfil?.nome);

  // Abrir notificação: marca como lida e leva à área relevante (se houver).
  function abrirNotificacao(n: (typeof ultimasNotificacoes)[number]) {
    if (!n.lida) marcarLida.mutate(n.id);
    const link = getNotificacaoLink(n.tipo);
    if (link) navigate(link);
  }

  // Situação financeira consolidada (a pendência urgente aparece no banner acima).
  const financeiro = temVencido
    ? { value: formatarValor(totalEmAberto), tone: "danger" as const, hint: "Mensalidade vencida" }
    : qtdEmAberto > 0
      ? {
          value: formatarValor(totalEmAberto),
          tone: "warning" as const,
          hint: qtdEmAberto > 1 ? `${qtdEmAberto} cobranças em aberto` : "1 cobrança em aberto",
        }
      : { value: "Em dia", tone: "success" as const, hint: "Nada pendente" };

  const disponiveisLabel = aulasDisponiveis.semPlano
    ? "—"
    : aulasDisponiveis.ilimitado
      ? "Ilimitado"
      : String(aulasDisponiveis.disponiveis ?? 0);

  // Ações que executam tarefas — a navegação entre áreas fica no menu superior.
  const quickActions: QuickAction[] = [
    {
      label: "Solicitar aula avulsa",
      description: "Peça uma aula extra",
      icon: Zap,
      tone: "lilas",
      onClick: () => setModalAvulso(true),
    },
    {
      label: "Enviar comprovante",
      description: "Comprove um pagamento",
      icon: Upload,
      tone: "roxo",
      to: "/aluno/financeiro?tab=comprovantes",
    },
    {
      label: "Solicitar reembolso",
      description: "Reembolso proporcional",
      icon: RotateCcw,
      tone: "rosa",
      to: "/aluno/financeiro?tab=reembolsos",
    },
  ];

  return (
    <div className="space-y-6">
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
          {/* Banner de ação — pendência financeira em destaque */}
          {qtdEmAberto > 0 && (
            <Link
              to="/aluno/financeiro?tab=comprovantes"
              className={cn(
                "flex items-center gap-4 rounded-2xl p-5 border transition-colors",
                temVencido
                  ? "bg-rosa-vibrante/10 border-rosa-vibrante/30 hover:bg-rosa-vibrante/15"
                  : "bg-amber-50 border-amber-200 hover:bg-amber-100/70",
              )}
            >
              <span
                className={cn(
                  "p-3 rounded-xl shrink-0",
                  temVencido
                    ? "bg-rosa-vibrante/15 text-rosa-vibrante"
                    : "bg-amber-100 text-amber-600",
                )}
              >
                <AlertTriangle className="w-5 h-5" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-cinza-forte">
                  {temVencido
                    ? "Você tem mensalidade vencida"
                    : "Mensalidade em aberto"}
                </p>
                <p className="text-sm text-cinza-texto">
                  {qtdEmAberto > 1 ? `${qtdEmAberto} cobranças` : "1 cobrança"} ·{" "}
                  {formatarValor(totalEmAberto)} — envie o comprovante para
                  regularizar.
                </p>
              </div>
              <span className="shrink-0 inline-flex items-center gap-1 text-sm font-medium text-roxo-profundo">
                Resolver <ChevronRight className="w-4 h-4" />
              </span>
            </Link>
          )}

          {/* Resumo (KPIs) */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-cinza-texto uppercase tracking-wider">
              Resumo
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                hint={
                  !aulasDisponiveis.semPlano && !aulasDisponiveis.ilimitado
                    ? `de ${aulasDisponiveis.cota} no plano`
                    : undefined
                }
              />
              <KpiCard
                label="Situação financeira"
                icon={Wallet}
                tone={financeiro.tone}
                value={financeiro.value}
                hint={financeiro.hint}
              />
              <KpiCard
                label="Solicitações pendentes"
                icon={AlertCircle}
                tone={solicitacoesPendentes > 0 ? "warning" : "default"}
                value={solicitacoesPendentes}
                hint="Reembolsos e comprovantes em análise"
              />
            </div>
          </section>

          {/* Ações rápidas */}
          <section>
            <h2 className="text-sm font-semibold text-cinza-texto uppercase tracking-wider mb-4">
              Ações rápidas
            </h2>
            <QuickActions actions={quickActions} />
          </section>

          {/* Minha agenda — Próxima aula / Minhas aulas / Grade geral */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-cinza-texto uppercase tracking-wider">
              Minha agenda
            </h2>

            {/* Próxima aula (destaque) */}
            <SectionCard title="Próxima aula" icon={CalendarClock}>
              {proximaAula ? (
                <button
                  type="button"
                  onClick={() => setDetalhe(proximaAula)}
                  className="w-full flex items-start justify-between gap-3 text-left group"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-cinza-forte">
                      {proximaAula.titulo}
                    </p>
                    <p className="text-sm text-cinza-texto capitalize">
                      {formatarData(proximaAula.data)} ·{" "}
                      {proximaAula.horaInicio}
                    </p>
                    <p className="text-xs text-cinza-texto mt-0.5">
                      {proximaAula.professor.usuario.nomeCompleto}
                    </p>
                  </div>
                  <span className="flex items-center gap-2 shrink-0">
                    {proximaAula.matriculado && (
                      <Badge variant="secondary">Matriculado</Badge>
                    )}
                    <ChevronRight className="w-4 h-4 text-cinza-texto group-hover:text-lilas-medio transition-colors" />
                  </span>
                </button>
              ) : (
                <EmptyState
                  icon={CalendarDays}
                  message="Você não tem aulas agendadas."
                />
              )}
            </SectionCard>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SectionCard
                title="Minhas aulas"
                icon={ClipboardCheck}
                action={
                  <Link
                    to="/aluno/agenda"
                    className="text-xs text-lilas-medio hover:underline flex items-center gap-1"
                  >
                    Ver agenda <ChevronRight className="w-3 h-3" />
                  </Link>
                }
              >
                {minhasAulas.length === 0 ? (
                  <EmptyState
                    icon={CalendarDays}
                    message="Você não está matriculado em aulas futuras."
                  />
                ) : (
                  <ul className="divide-y divide-bege-cartao -my-2">
                    {minhasAulas.slice(0, 5).map((a) => (
                      <AulaLinha key={a.id} aula={a} onClick={() => setDetalhe(a)} />
                    ))}
                  </ul>
                )}
              </SectionCard>

              <SectionCard
                title="Grade geral"
                icon={CalendarDays}
                action={
                  <Link
                    to="/aluno/agenda"
                    className="text-xs text-lilas-medio hover:underline flex items-center gap-1"
                  >
                    Ver grade <ChevronRight className="w-3 h-3" />
                  </Link>
                }
              >
                {gradeGeral.length === 0 ? (
                  <EmptyState
                    icon={CalendarDays}
                    message="Nenhuma aula na grade aberta."
                  />
                ) : (
                  <ul className="divide-y divide-bege-cartao -my-2">
                    {gradeGeral.slice(0, 5).map((a) => (
                      <AulaLinha key={a.id} aula={a} onClick={() => setDetalhe(a)} />
                    ))}
                  </ul>
                )}
              </SectionCard>
            </div>
          </section>

          {/* Últimas notificações */}
          <SectionCard
            title="Últimas notificações"
            icon={Bell}
            action={
              <Link
                to="/aluno/notificacoes"
                className="text-xs text-lilas-medio hover:underline flex items-center gap-1"
              >
                Ver todas <ChevronRight className="w-3 h-3" />
              </Link>
            }
          >
            {ultimasNotificacoes.length === 0 ? (
              <EmptyState icon={Bell} message="Nenhuma notificação por aqui." />
            ) : (
              <ul className="divide-y divide-bege-cartao -my-2">
                {ultimasNotificacoes.map((n) => {
                  const meta = getNotificacaoMeta(n.tipo);
                  return (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => abrirNotificacao(n)}
                        className="w-full flex items-start gap-3 py-3 px-2 -mx-2 text-left rounded-lg hover:bg-bege-suave/50 transition-colors"
                      >
                        <span
                          className={`p-2 rounded-lg shrink-0 ${meta.iconBg}`}
                        >
                          <meta.Icon className={`w-4 h-4 ${meta.iconColor}`} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-sm ${!n.lida ? "font-medium text-cinza-forte" : "text-cinza-texto"}`}
                          >
                            {n.titulo}
                          </p>
                          <p className="text-xs text-cinza-texto line-clamp-2">
                            {n.mensagem}
                          </p>
                          <p className="text-xs text-cinza-texto mt-0.5">
                            {formatarDataHora(n.createdAt)}
                          </p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </SectionCard>
        </>
      )}

      <DetalheAulaModal aula={detalhe} onClose={() => setDetalhe(null)} />

      {modalAvulso && (
        <SolicitarAvulsaModal onClose={() => setModalAvulso(false)} />
      )}
    </div>
  );
}
