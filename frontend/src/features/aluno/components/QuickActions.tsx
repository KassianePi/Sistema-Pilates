import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export type QuickActionTone = 'roxo' | 'rosa' | 'verde' | 'lilas'

const TONE: Record<QuickActionTone, { iconColor: string; iconBg: string }> = {
  roxo: { iconColor: 'text-roxo-profundo', iconBg: 'bg-lilas-claro' },
  rosa: { iconColor: 'text-rosa-vibrante', iconBg: 'bg-rosa-vibrante/10' },
  verde: { iconColor: 'text-green-600', iconBg: 'bg-green-50' },
  lilas: { iconColor: 'text-lilas-medio', iconBg: 'bg-lilas-claro' },
}

export interface QuickAction {
  label: string
  description?: string
  icon: React.ElementType
  tone?: QuickActionTone
  to?: string
  onClick?: () => void
}

function ActionBody({ action }: { action: QuickAction }) {
  const t = TONE[action.tone ?? 'roxo']
  return (
    <>
      <div className={cn('p-3 rounded-xl shrink-0', t.iconBg)}>
        <action.icon className={cn('w-5 h-5', t.iconColor)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-cinza-forte text-sm">{action.label}</p>
        {action.description && <p className="text-cinza-texto text-xs mt-0.5">{action.description}</p>}
      </div>
      <ChevronRight className="w-4 h-4 text-cinza-texto group-hover:text-lilas-medio transition-colors" />
    </>
  )
}

const baseClass =
  'flex items-center gap-4 p-4 rounded-xl bg-branco-puro border border-bege-cartao hover:border-lilas-medio hover:shadow-sm transition-all group text-left w-full'

export function QuickActions({ actions }: { actions: QuickAction[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {actions.map((action) =>
        action.to ? (
          <Link key={action.label} to={action.to} className={baseClass}>
            <ActionBody action={action} />
          </Link>
        ) : (
          <button key={action.label} type="button" onClick={action.onClick} className={baseClass}>
            <ActionBody action={action} />
          </button>
        ),
      )}
    </div>
  )
}
