import { DollarSign } from 'lucide-react'
import { PlaceholderPage } from '@/components/PlaceholderPage'

export function FinanceiroPage() {
  return (
    <PlaceholderPage
      title="Financeiro"
      description="Controle de caixa, contas a pagar e receber."
      icon={DollarSign}
    />
  )
}
