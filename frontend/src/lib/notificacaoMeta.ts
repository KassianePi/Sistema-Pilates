import {
  CalendarDays, AlertTriangle, CheckCircle2, Receipt, RotateCcw,
  ClipboardCheck, CalendarPlus, Bell,
} from 'lucide-react'
import type { TipoNotificacao } from '@/types/domain.types'

export interface NotificacaoMeta {
  Icon: React.ElementType
  /** Cor do ícone (texto) */
  iconColor: string
  /** Fundo do ícone */
  iconBg: string
  /** Rótulo curto da categoria */
  label: string
}

export const NOTIFICACAO_META: Record<TipoNotificacao, NotificacaoMeta> = {
  PAGAMENTO_CONFIRMADO: { Icon: CheckCircle2, iconColor: 'text-green-600', iconBg: 'bg-green-50', label: 'Pagamento confirmado' },
  PAGAMENTO_VENCIDO: { Icon: AlertTriangle, iconColor: 'text-red-600', iconBg: 'bg-red-50', label: 'Pagamento vencido' },
  MENSALIDADE_CRIADA: { Icon: Receipt, iconColor: 'text-amber-600', iconBg: 'bg-amber-50', label: 'Nova cobrança' },
  ESTORNO_ATUALIZADO: { Icon: RotateCcw, iconColor: 'text-rosa-vibrante', iconBg: 'bg-rosa-vibrante/10', label: 'Reembolso' },
  AULA_AGENDADA: { Icon: CalendarDays, iconColor: 'text-roxo-profundo', iconBg: 'bg-lilas-claro', label: 'Agenda' },
  PRESENCA_REGISTRADA: { Icon: ClipboardCheck, iconColor: 'text-roxo-profundo', iconBg: 'bg-lilas-claro', label: 'Presença' },
  REPOSICAO_OFERECIDA: { Icon: CalendarPlus, iconColor: 'text-lilas-medio', iconBg: 'bg-lilas-claro', label: 'Reposição' },
  MENSAGEM_ADMIN: { Icon: Bell, iconColor: 'text-cinza-forte', iconBg: 'bg-bege-cartao', label: 'Aviso' },
}

export function getNotificacaoMeta(tipo: TipoNotificacao): NotificacaoMeta {
  return NOTIFICACAO_META[tipo] ?? NOTIFICACAO_META.MENSAGEM_ADMIN
}

/**
 * Destino de deep-link de uma notificação (área relevante do portal do aluno).
 * Retorna `null` quando o tipo não tem uma tela específica para abrir.
 */
export function getNotificacaoLink(tipo: TipoNotificacao): string | null {
  switch (tipo) {
    case 'PAGAMENTO_VENCIDO':
    case 'MENSALIDADE_CRIADA':
      return '/aluno/financeiro?tab=comprovantes'
    case 'PAGAMENTO_CONFIRMADO':
      return '/aluno/financeiro'
    case 'ESTORNO_ATUALIZADO':
      return '/aluno/financeiro?tab=reembolsos'
    case 'AULA_AGENDADA':
    case 'REPOSICAO_OFERECIDA':
      return '/aluno/agenda'
    case 'PRESENCA_REGISTRADA':
      return '/aluno/presenca'
    case 'MENSAGEM_ADMIN':
    default:
      return null
  }
}
