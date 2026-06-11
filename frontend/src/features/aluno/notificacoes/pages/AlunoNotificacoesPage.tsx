import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, CheckCheck, Archive } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { notificacoesService } from '@/services/notificacoes.service'
import { getNotificacaoMeta } from '@/lib/notificacaoMeta'

function formatarData(d: string) {
  return new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

export function AlunoNotificacoesPage() {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['notificacoes-aluno'],
    queryFn: () => notificacoesService.listar({ limite: 50 }),
  })

  const marcarLida = useMutation({
    mutationFn: (id: string) => notificacoesService.marcarLida(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notificacoes-aluno'] }),
    onError: () => toast.error('Erro ao marcar notificação.'),
  })

  const arquivar = useMutation({
    mutationFn: (id: string) => notificacoesService.arquivar(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notificacoes-aluno'] })
      toast.success('Notificação arquivada.')
    },
    onError: () => toast.error('Erro ao arquivar notificação.'),
  })

  const notificacoes = (data?.data ?? []).filter((n) => !n.arquivada)
  const naoLidas = notificacoes.filter((n) => !n.lida).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-cinza-forte">Notificações</h1>
        <p className="text-sm text-cinza-texto mt-1">
          {naoLidas > 0 ? `${naoLidas} não lida${naoLidas !== 1 ? 's' : ''}` : 'Tudo lido'}
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="w-5 h-5 text-roxo-profundo" /> Central de Notificações
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-cinza-medio py-8 text-center text-sm">Carregando...</p>
          ) : notificacoes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-cinza-medio">
              <Bell className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">Nenhuma notificação.</p>
            </div>
          ) : (
            <ul className="divide-y divide-bege-cartao">
              {notificacoes.map((n) => {
                const meta = getNotificacaoMeta(n.tipo)
                return (
                  <li key={n.id} className={`flex items-start gap-4 py-4 ${!n.lida ? 'bg-lilas-claro/30 -mx-6 px-6' : ''}`}>
                    <div className={`p-2 rounded-lg shrink-0 ${meta.iconBg}`}>
                      <meta.Icon className={`w-4 h-4 ${meta.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`text-sm font-medium ${!n.lida ? 'text-cinza-forte' : 'text-cinza-texto'}`}>{n.titulo}</p>
                        {!n.lida && <Badge variant="secondary" className="text-xs">Nova</Badge>}
                      </div>
                      <p className="text-sm text-cinza-texto mt-0.5">{n.mensagem}</p>
                      <p className="text-xs text-cinza-medio mt-1">{formatarData(n.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {!n.lida && (
                        <Button size="icon" variant="ghost" title="Marcar como lida" onClick={() => marcarLida.mutate(n.id)}>
                          <CheckCheck className="w-4 h-4" />
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" title="Arquivar" onClick={() => arquivar.mutate(n.id)} className="hover:text-cinza-forte">
                        <Archive className="w-4 h-4" />
                      </Button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
