import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { getStatusMeta, type StatusDomain } from '../constants/status'

interface StatusBadgeProps {
  domain: StatusDomain
  status: string
  showIcon?: boolean
  className?: string
}

/** Badge de status que consome a configuração única em constants/status.ts. */
export function StatusBadge({ domain, status, showIcon = true, className }: StatusBadgeProps) {
  const { label, variant, Icon } = getStatusMeta(domain, status)
  return (
    <Badge variant={variant} className={cn('whitespace-nowrap', className)}>
      {showIcon && <Icon className="w-3 h-3 mr-1" />}
      {label}
    </Badge>
  )
}
