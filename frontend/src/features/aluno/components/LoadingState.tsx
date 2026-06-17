import { cn } from '@/lib/utils'

interface LoadingStateProps {
  label?: string
  className?: string
}

export function LoadingState({ label = 'Carregando...', className }: LoadingStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 gap-3 text-cinza-texto', className)}>
      <div className="w-6 h-6 rounded-full border-2 border-roxo-profundo border-t-transparent animate-spin" />
      <p className="text-sm">{label}</p>
    </div>
  )
}
