import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertCircle,
  XCircle,
  Ban,
  PauseCircle,
  CalendarClock,
  Trash2,
  MinusCircle,
  RotateCcw,
  FileCheck,
  Loader2,
} from 'lucide-react'
import type { StatusAula, StatusMensalidade, StatusComprovante, StatusPresenca } from '@/types/domain.types'
import type { StatusEstorno } from '@/services/estornos.service'

export type BadgeVariant = 'success' | 'warning' | 'destructive' | 'outline' | 'secondary'

export interface StatusMeta {
  label: string
  variant: BadgeVariant
  Icon: React.ElementType
}

/**
 * Fonte ÚNICA de configuração de status da Área do Aluno.
 * Namespaced por domínio para evitar colisão de chaves (ex.: PENDENTE em mensalidade e comprovante).
 * Nenhum outro arquivo deve declarar mapas de status — todos consomem daqui (via StatusBadge).
 */
export const STATUS_CONFIG = {
  aula: {
    AGENDADA: { label: 'Agendada', variant: 'secondary', Icon: CalendarClock },
    REALIZADA: { label: 'Realizada', variant: 'success', Icon: CheckCircle2 },
    CANCELADA: { label: 'Cancelada', variant: 'destructive', Icon: Ban },
    ADIADA: { label: 'Adiada', variant: 'warning', Icon: CalendarClock },
    SUSPENSA: { label: 'Suspensa', variant: 'warning', Icon: PauseCircle },
    EXCLUIDA: { label: 'Removida', variant: 'outline', Icon: Trash2 },
  } satisfies Record<StatusAula, StatusMeta>,

  mensalidade: {
    PAGO: { label: 'Pago', variant: 'success', Icon: CheckCircle2 },
    PARCIAL: { label: 'Parcial', variant: 'warning', Icon: Clock },
    PENDENTE: { label: 'Pendente', variant: 'warning', Icon: Clock },
    VENCIDO: { label: 'Atrasado', variant: 'destructive', Icon: AlertTriangle },
    CANCELADO: { label: 'Cancelado', variant: 'outline', Icon: XCircle },
  } satisfies Record<StatusMensalidade, StatusMeta>,

  comprovante: {
    PENDENTE: { label: 'Em análise', variant: 'warning', Icon: Loader2 },
    APROVADO: { label: 'Aprovado', variant: 'success', Icon: FileCheck },
    REJEITADO: { label: 'Rejeitado', variant: 'destructive', Icon: XCircle },
  } satisfies Record<StatusComprovante, StatusMeta>,

  estorno: {
    SOLICITADO: { label: 'Em análise', variant: 'warning', Icon: Loader2 },
    APROVADO: { label: 'Aprovado', variant: 'success', Icon: CheckCircle2 },
    PROCESSADO: { label: 'Processado', variant: 'success', Icon: RotateCcw },
    NEGADO: { label: 'Rejeitado', variant: 'destructive', Icon: XCircle },
  } satisfies Record<StatusEstorno, StatusMeta>,

  presenca: {
    PRESENTE: { label: 'Presente', variant: 'success', Icon: CheckCircle2 },
    AUSENTE: { label: 'Ausente', variant: 'destructive', Icon: XCircle },
    JUSTIFICADO: {
      label: 'Justificado',
      variant: 'warning',
      Icon: MinusCircle,
    },
  } satisfies Record<StatusPresenca, StatusMeta>,
} as const

export type StatusDomain = keyof typeof STATUS_CONFIG

const FALLBACK: StatusMeta = {
  label: '—',
  variant: 'outline',
  Icon: AlertCircle,
}

/** Retorna a config de um status, com fallback seguro para valores desconhecidos. */
export function getStatusMeta(domain: StatusDomain, status: string): StatusMeta {
  const grupo = STATUS_CONFIG[domain] as Record<string, StatusMeta>
  return grupo[status] ?? FALLBACK
}
