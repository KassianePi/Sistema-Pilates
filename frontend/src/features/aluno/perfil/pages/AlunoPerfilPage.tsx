import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { User, Mail, CreditCard } from 'lucide-react'
import type { AlunoUser } from '@/types/auth.types'

export function AlunoPerfilPage() {
  const { user } = useAuth()
  const alunoUser = user as AlunoUser | null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-cinza-forte">Meu Perfil</h1>
        <p className="text-sm text-cinza-texto mt-1">Seus dados cadastrais.</p>
      </div>

      <Card className="max-w-xl">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-lilas-claro flex items-center justify-center">
              <User className="w-8 h-8 text-roxo-profundo" />
            </div>
            <div>
              <CardTitle>{alunoUser?.nome}</CardTitle>
              {alunoUser?.plano && (
                <Badge variant="secondary" className="mt-1">{alunoUser.plano}</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 text-sm">
            <Mail className="w-4 h-4 text-cinza-medio" />
            <span className="text-cinza-forte">{alunoUser?.email}</span>
          </div>
          {alunoUser?.plano && (
            <div className="flex items-center gap-3 text-sm">
              <CreditCard className="w-4 h-4 text-cinza-medio" />
              <span className="text-cinza-forte">{alunoUser.plano}</span>
            </div>
          )}
          <p className="text-xs text-cinza-medio mt-4">
            Para alterar seus dados, entre em contato com a recepção do studio.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
