import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export type KpiTone = 'default' | 'roxo' | 'success' | 'warning' | 'danger'

const TONE: Record<KpiTone, { value: string; iconColor: string; iconBg: string }> = {
  default: { value: 'text-cinza-forte', iconColor: 'text-roxo-profundo', iconBg: 'bg-lilas-claro' },
  roxo: { value: 'text-roxo-profundo', iconColor: 'text-roxo-profundo', iconBg: 'bg-lilas-claro' },
  success: { value: 'text-green-700', iconColor: 'text-green-600', iconBg: 'bg-green-50' },
  warning: { value: 'text-amber-600', iconColor: 'text-amber-600', iconBg: 'bg-amber-50' },
  danger: { value: 'text-rosa-vibrante', iconColor: 'text-rosa-vibrante', iconBg: 'bg-rosa-vibrante/10' },
}

interface KpiCardProps {
  label: string
  value: React.ReactNode
  icon?: React.ElementType
  hint?: React.ReactNode
  tone?: KpiTone
  onClick?: () => void
}

export function KpiCard({ label, value, icon: Icon, hint, tone = 'default', onClick }: KpiCardProps) {
  const t = TONE[tone]
  return (
    <Card
      className={cn('transition-all', onClick && 'cursor-pointer hover:shadow-sm hover:border-lilas-medio')}
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-cinza-texto">{label}</p>
          {Icon && (
            <span className={cn('p-2 rounded-lg shrink-0', t.iconBg)}>
              <Icon className={cn('w-4 h-4', t.iconColor)} />
            </span>
          )}
        </div>
        <p className={cn('text-2xl font-bold mt-2 leading-tight', t.value)}>{value}</p>
        {hint && <p className="text-xs text-cinza-medio mt-1">{hint}</p>}
      </CardContent>
    </Card>
  )
}
