import type { ElementType } from 'react'
import { Construction } from 'lucide-react'

interface PlaceholderPageProps {
  title: string
  description: string
  icon?: ElementType
}

export function PlaceholderPage({ title, description, icon: Icon = Construction }: PlaceholderPageProps) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-cinza-forte">{title}</h1>
        <p className="text-cinza-texto mt-1">{description}</p>
      </div>
      <div className="flex flex-col items-center justify-center py-24 bg-branco-puro rounded-xl border border-bege-cartao text-center">
        <div className="w-16 h-16 rounded-2xl bg-bege-suave flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-cinza-medio" />
        </div>
        <h2 className="text-lg font-semibold text-cinza-forte">Em desenvolvimento</h2>
        <p className="text-cinza-texto text-sm mt-2 max-w-xs">
          Esta seção está sendo implementada e estará disponível em breve.
        </p>
      </div>
    </div>
  )
}
