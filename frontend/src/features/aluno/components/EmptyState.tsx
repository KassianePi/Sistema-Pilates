import { Inbox } from 'lucide-react'

interface EmptyStateProps {
  icon?: React.ElementType
  title?: string
  message: string
  action?: React.ReactNode
}

export function EmptyState({ icon: Icon = Inbox, title, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center text-cinza-texto">
      <Icon className="w-10 h-10 mb-3 opacity-30" />
      {title && <p className="text-sm font-medium text-cinza-texto">{title}</p>}
      <p className="text-sm">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
