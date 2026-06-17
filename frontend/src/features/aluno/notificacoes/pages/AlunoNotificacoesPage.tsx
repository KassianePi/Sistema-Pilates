import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, Archive, CheckCircle2, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader } from '../../components/PageHeader'
import { SectionCard } from '../../components/SectionCard'
import { LoadingState } from '../../components/LoadingState'
import { EmptyState } from '../../components/EmptyState'
import {
  useNotificacoes, useMarcarLida, useArquivarNotificacao, useMarcarTodasLidas,
} from '../../hooks/useAlunoNotificacoes'
import { NOTIFICACAO_META, getNotificacaoMeta, getNotificacaoLink } from '@/lib/notificacaoMeta'
import { formatarDataHora } from '../../utils/format'
import type { TipoNotificacao } from '@/types/domain.types'

const TIPOS = Object.entries(NOTIFICACAO_META).map(([value, meta]) => ({ value, label: meta.label }))

export function AlunoNotificacoesPage() {
  const [filtroTipo, setFiltroTipo] = useState('all')
  const [filtroStatus, setFiltroStatus] = useState('all') // all | NAO_LIDA | LIDA

  const navigate = useNavigate()
  const { data, isLoading } = useNotificacoes()
  const marcarLida = useMarcarLida()
  const arquivar = useArquivarNotificacao()
  const marcarTodas = useMarcarTodasLidas()

  // Abrir uma notificação: marca como lida e leva à área relevante (se houver).
  function abrir(n: { id: string; lida: boolean; tipo: string }) {
    if (!n.lida) marcarLida.mutate(n.id)
    const link = getNotificacaoLink(n.tipo as TipoNotificacao)
    if (link) navigate(link)
  }

  const todas = useMemo(() => (data?.data ?? []).filter((n) => !n.arquivada), [data])

  const lista = useMemo(
    () =>
      todas.filter((n) => {
        if (filtroTipo !== 'all' && n.tipo !== filtroTipo) return false
        if (filtroStatus === 'NAO_LIDA' && n.lida) return false
        if (filtroStatus === 'LIDA' && !n.lida) return false
        return true
      }),
    [todas, filtroTipo, filtroStatus],
  )

  const naoLidasIds = todas.filter((n) => !n.lida).map((n) => n.id)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notificações"
        subtitle={naoLidasIds.length > 0 ? `${naoLidasIds.length} não lida${naoLidasIds.length !== 1 ? 's' : ''}` : 'Tudo lido'}
        icon={Bell}
        action={
          <Button
            variant="outline"
            size="sm"
            disabled={naoLidasIds.length === 0 || marcarTodas.isPending}
            onClick={() => marcarTodas.mutate(naoLidasIds)}
          >
            <CheckCheck className="w-4 h-4 mr-1.5" />
            {marcarTodas.isPending ? 'Marcando...' : 'Marcar todas como lidas'}
          </Button>
        }
      />

      <SectionCard noPadding>
        <div className="flex flex-wrap items-end gap-3 p-4 border-b border-bege-cartao">
          <div className="space-y-1">
            <Label className="text-xs text-cinza-texto">Tipo</Label>
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {TIPOS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-cinza-texto">Status</Label>
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="NAO_LIDA">Não lidas</SelectItem>
                <SelectItem value="LIDA">Lidas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <LoadingState />
        ) : lista.length === 0 ? (
          <EmptyState icon={Bell} message="Nenhuma notificação encontrada." />
        ) : (
          <ul className="divide-y divide-bege-cartao">
            {lista.map((n) => {
              const meta = getNotificacaoMeta(n.tipo as TipoNotificacao)
              const temLink = getNotificacaoLink(n.tipo as TipoNotificacao) !== null
              return (
                <li key={n.id} className={`flex items-start gap-2 px-3 sm:px-6 py-4 ${!n.lida ? 'bg-lilas-claro/30' : ''}`}>
                  <button
                    type="button"
                    onClick={() => abrir(n)}
                    className="flex items-start gap-4 flex-1 min-w-0 text-left rounded-lg p-1 -m-1 hover:bg-bege-suave/50 transition-colors"
                  >
                    <span className={`p-2 rounded-lg shrink-0 ${meta.iconBg}`}>
                      <meta.Icon className={`w-4 h-4 ${meta.iconColor}`} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`text-sm ${!n.lida ? 'font-medium text-cinza-forte' : 'text-cinza-texto'}`}>{n.titulo}</p>
                        {!n.lida && <Badge variant="secondary" className="text-xs">Nova</Badge>}
                      </div>
                      <p className="text-sm text-cinza-texto mt-0.5">{n.mensagem}</p>
                      <p className="text-xs text-cinza-texto mt-1 flex items-center gap-1">
                        {formatarDataHora(n.createdAt)}
                        {temLink && (
                          <span className="text-lilas-medio flex items-center gap-0.5">
                            · Ver detalhes <ChevronRight className="w-3 h-3" />
                          </span>
                        )}
                      </p>
                    </div>
                  </button>
                  <div className="flex items-center gap-1 shrink-0">
                    {!n.lida && (
                      <Button size="icon" variant="ghost" title="Marcar como lida" aria-label="Marcar como lida" className="h-11 w-11" onClick={() => marcarLida.mutate(n.id)}>
                        <CheckCircle2 className="w-4 h-4" />
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" title="Arquivar" aria-label="Arquivar notificação" className="h-11 w-11 hover:text-cinza-forte" onClick={() => arquivar.mutate(n.id)}>
                      <Archive className="w-4 h-4" />
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </SectionCard>
    </div>
  )
}
