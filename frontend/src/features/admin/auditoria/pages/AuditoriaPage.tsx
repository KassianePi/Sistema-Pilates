import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ShieldCheck, Search } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { auditoriaService } from '@/services/auditoria.service'
import { useDebounce } from '@/hooks/useDebounce'

function useAuditoria(params?: { pagina?: number; limite?: number; acao?: string; entidade?: string }) {
  return useQuery({
    queryKey: ['auditoria', params],
    queryFn: () => auditoriaService.listar(params),
  })
}

function formatarData(d: string) {
  return new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' })
}

export function AuditoriaPage() {
  const [filtroAcao, setFiltroAcao] = useState('')
  const [pagina, setPagina] = useState(1)
  const filtroDebounced = useDebounce(filtroAcao, 400)

  const { data, isLoading } = useAuditoria({ acao: filtroDebounced || undefined, pagina, limite: 20 })
  const logs = data?.data ?? []
  const totalPaginas = data?.totalPaginas ?? 1

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-cinza-forte">Auditoria</h1>
        <p className="text-sm text-cinza-texto mt-1">Trilha de auditoria e logs de atividades do sistema.</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cinza-medio" />
            <Input
              placeholder="Filtrar por ação..."
              className="pl-9"
              value={filtroAcao}
              onChange={(e) => { setFiltroAcao(e.target.value); setPagina(1) }}
            />
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-cinza-texto text-xs">{formatarData(log.createdAt)}</TableCell>
                    <TableCell className="text-sm">{log.usuario?.nomeCompleto ?? log.usuarioId ?? '—'}</TableCell>
                    <TableCell>
                      <span className="font-mono text-xs bg-bege-suave text-cinza-forte px-2 py-0.5 rounded">
                        {log.acao}
                      </span>
                    </TableCell>
                    <TableCell className="text-cinza-texto text-sm">{log.entidade}{log.entidadeId ? ` (${log.entidadeId.slice(0, 8)}...)` : ''}</TableCell>
                    <TableCell className="text-cinza-texto text-xs max-w-xs truncate">{log.detalhes ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {totalPaginas > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-bege-cartao">
              <Button variant="outline" size="sm" onClick={() => setPagina(p => p - 1)} disabled={pagina === 1}>Anterior</Button>
              <span className="text-sm text-cinza-texto">Página {pagina} de {totalPaginas}</span>
              <Button variant="outline" size="sm" onClick={() => setPagina(p => p + 1)} disabled={pagina === totalPaginas}>Próxima</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
