import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ShieldCheck, Download, RefreshCw, ChevronDown, ChevronRight, X } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { auditoriaService } from '@/services/auditoria.service'
import { useDebounce } from '@/hooks/useDebounce'
import type { LogAuditoria } from '@/types/domain.types'

const ACAO_VARIANT: Record<string, 'success' | 'destructive' | 'warning' | 'outline'> = {
  CREATE: 'success',
  DELETE: 'destructive',
  UPDATE: 'warning',
  LOGIN: 'outline',
  LOGOUT: 'outline',
}

function formatarData(d: string) {
  return new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' })
}

function JsonDiff({ titulo, json }: { titulo: string; json: string | null | undefined }) {
  if (!json) return <p className="text-cinza-medio text-xs italic">—</p>
  let parsed: unknown
  try { parsed = JSON.parse(json) } catch { return <p className="text-xs font-mono text-cinza-forte break-all">{json}</p> }
  return (
    <div>
      <p className="text-xs font-semibold text-cinza-forte mb-1">{titulo}</p>
      <pre className="text-xs bg-bege-suave rounded p-2 overflow-auto max-h-40 text-cinza-forte whitespace-pre-wrap break-all">
        {JSON.stringify(parsed, null, 2)}
      </pre>
    </div>
  )
}

function LinhaLog({ log }: { log: LogAuditoria }) {
  const [expandido, setExpandido] = useState(false)
  const temDiff = !!(log.dadosAntigos || log.dadosNovos)
  const variantAcao = ACAO_VARIANT[log.acao] ?? 'outline'

  return (
    <>
      <TableRow
        className={temDiff ? 'cursor-pointer hover:bg-bege-suave/60' : undefined}
        onClick={temDiff ? () => setExpandido((v) => !v) : undefined}
      >
        <TableCell className="text-cinza-texto text-xs w-36">{formatarData(log.criadoEm)}</TableCell>
        <TableCell className="text-sm">{log.usuario?.nomeCompleto ?? log.usuarioId?.slice(0, 8) ?? '—'}</TableCell>
        <TableCell>
          <Badge variant={variantAcao} className="font-mono text-xs">{log.acao}</Badge>
        </TableCell>
        <TableCell className="text-cinza-texto text-sm">
          {log.entidade}
          {log.entidadeId && <span className="text-cinza-medio ml-1 text-xs">({log.entidadeId.slice(0, 8)}…)</span>}
        </TableCell>
        <TableCell className="text-cinza-texto text-xs max-w-xs truncate">{log.detalhes ?? '—'}</TableCell>
        <TableCell className="w-8">
          {temDiff && (
            expandido
              ? <ChevronDown className="w-3.5 h-3.5 text-cinza-medio" />
              : <ChevronRight className="w-3.5 h-3.5 text-cinza-medio" />
          )}
        </TableCell>
      </TableRow>
      {expandido && temDiff && (
        <TableRow>
          <TableCell colSpan={6} className="bg-bege-suave/40 px-4 py-3">
            <div className={`grid gap-4 ${log.dadosAntigos && log.dadosNovos ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {log.dadosAntigos && <JsonDiff titulo="Antes" json={log.dadosAntigos} />}
              {log.dadosNovos && <JsonDiff titulo="Depois" json={log.dadosNovos} />}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  )
}

export function AuditoriaPage() {
  const [filtroAcao, setFiltroAcao] = useState('')
  const [filtroEntidade, setFiltroEntidade] = useState('')
  const [filtroUsuario, setFiltroUsuario] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [pagina, setPagina] = useState(1)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [exportando, setExportando] = useState(false)

  const acaoDebounced = useDebounce(filtroAcao, 400)
  const entidadeDebounced = useDebounce(filtroEntidade, 400)
  const usuarioDebounced = useDebounce(filtroUsuario, 400)

  const filtros = {
    acao: acaoDebounced || undefined,
    entidade: entidadeDebounced || undefined,
    usuarioId: usuarioDebounced || undefined,
    dataInicio: dataInicio || undefined,
    dataFim: dataFim || undefined,
  }

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['auditoria', filtros, pagina],
    queryFn: () => auditoriaService.listar({ ...filtros, pagina, limite: 20 }),
    refetchInterval: autoRefresh ? 15000 : false,
  })

  useEffect(() => { setPagina(1) }, [acaoDebounced, entidadeDebounced, usuarioDebounced, dataInicio, dataFim])

  const logs = data?.data ?? []
  const totalPaginas = data?.totalPaginas ?? 1

  const temFiltroAtivo = !!(filtroAcao || filtroEntidade || filtroUsuario || dataInicio || dataFim)

  function limparFiltros() {
    setFiltroAcao('')
    setFiltroEntidade('')
    setFiltroUsuario('')
    setDataInicio('')
    setDataFim('')
  }

  async function exportarCsv() {
    setExportando(true)
    try {
      await auditoriaService.exportarCsv(filtros)
      toast.success('CSV exportado com sucesso.')
    } catch {
      toast.error('Erro ao exportar CSV.')
    } finally {
      setExportando(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-cinza-forte">Auditoria</h1>
          <p className="text-sm text-cinza-texto mt-1">Trilha de auditoria e logs de atividades do sistema.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh((v) => !v)}
            className={autoRefresh ? 'border-green-400 text-green-700 bg-green-50' : ''}
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isFetching ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh'}
          </Button>
          <Button variant="outline" size="sm" onClick={exportarCsv} disabled={exportando}>
            <Download className="w-3.5 h-3.5 mr-1.5" />
            {exportando ? 'Exportando...' : 'Exportar CSV'}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-cinza-medio">Ação</Label>
              <Input
                placeholder="Ex: CREATE, UPDATE, DELETE"
                value={filtroAcao}
                onChange={(e) => setFiltroAcao(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-cinza-medio">Entidade</Label>
              <Input
                placeholder="Ex: Aluno, Mensalidade"
                value={filtroEntidade}
                onChange={(e) => setFiltroEntidade(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-cinza-medio">Usuário (ID)</Label>
              <Input
                placeholder="UUID do usuário"
                value={filtroUsuario}
                onChange={(e) => setFiltroUsuario(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-cinza-medio">Data início</Label>
              <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-cinza-medio">Data fim</Label>
              <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
            </div>
            {temFiltroAtivo && (
              <div className="flex items-end">
                <Button variant="ghost" size="sm" onClick={limparFiltros} className="text-cinza-texto">
                  <X className="w-3 h-3 mr-1" /> Limpar filtros
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-12 text-center text-cinza-medio">Carregando...</div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-cinza-medio">
              <ShieldCheck className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">Nenhum log encontrado.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Entidade</TableHead>
                  <TableHead>Detalhes</TableHead>
                  <TableHead className="w-8" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => <LinhaLog key={log.id} log={log} />)}
              </TableBody>
            </Table>
          )}

          {totalPaginas > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-bege-cartao">
              <Button variant="outline" size="sm" onClick={() => setPagina((p) => p - 1)} disabled={pagina === 1}>
                Anterior
              </Button>
              <span className="text-sm text-cinza-texto">Página {pagina} de {totalPaginas}</span>
              <Button variant="outline" size="sm" onClick={() => setPagina((p) => p + 1)} disabled={pagina === totalPaginas}>
                Próxima
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
