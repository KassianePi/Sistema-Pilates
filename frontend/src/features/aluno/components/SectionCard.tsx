import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface SectionCardProps {
  title?: React.ReactNode
  icon?: React.ElementType
  action?: React.ReactNode
  children: React.ReactNode
  noPadding?: boolean
  className?: string
}

export function SectionCard({ title, icon: Icon, action, children, noPadding, className }: SectionCardProps) {
  return (
    <Card className={className}>
      {(title || action) && (
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            {title && (
              <CardTitle className="text-base flex items-center gap-2">
                {Icon && <Icon className="w-4 h-4 text-roxo-profundo" />}
                {title}
              </CardTitle>
            )}
            {action}
          </div>
        </CardHeader>
      )}
      <CardContent className={cn(noPadding && 'p-0')}>{children}</CardContent>
    </Card>
  )
}
