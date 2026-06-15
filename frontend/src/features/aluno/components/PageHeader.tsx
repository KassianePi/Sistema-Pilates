interface PageHeaderProps {
  title: string
  subtitle?: string
  icon?: React.ElementType
  action?: React.ReactNode
}

export function PageHeader({ title, subtitle, icon: Icon, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <h1 className="text-2xl font-bold text-cinza-forte flex items-center gap-2">
          {Icon && <Icon className="w-6 h-6 text-roxo-profundo" />}
          {title}
        </h1>
        {subtitle && <p className="text-sm text-cinza-texto mt-1">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
