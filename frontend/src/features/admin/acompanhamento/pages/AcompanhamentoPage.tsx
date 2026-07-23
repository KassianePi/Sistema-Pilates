import { useState } from 'react'
import {
  HeartPulse,
  Search,
  X,
  AlertTriangle,
  TrendingDown,
  CheckCircle2,
  CalendarDays,
  Clock,
  User,
  Plus,
  Image as ImageIcon,
  NotebookPen,
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { useDebounce } from '@/hooks/useDebounce'
import { useAcompanhamento, useDetalheAluno } from '../hooks/useAcompanhamento'
import type { RiscoAluno } from '@/services/acompanhamento.service'
import { useAvaliacoesDoAluno } from '../../avaliacoes/hooks/useAvaliacoes'
import { AvaliacaoFormModal } from '../../avaliacoes/components/AvaliacaoFormModal'
import { useEvolucoesDoAluno } from '../../evolucoes/hooks/useEvolucoes'

const RISCO_INFO: Record<RiscoAluno, { label: string; variant: 'destructive' | 'warning' | 'success' }> = {
  EM_RISCO: { label: 'Em risco', variant: 'destructive' },
  ATENCAO: { label: 'Atenção', variant: 'warning' },
  OK: { label: 'Em dia', variant: 'success' },
}

function formatarData(d?: string | null) {
  return d ? new Date(d).toLocaleDateString('pt-BR') : '—'
}
function formatarDataHora(d: string) {
  return new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}
function formatarValor(v: string | number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v))
}

export function AcompanhamentoPage() {
  const [filtroRisco, setFiltroRisco] = useState<RiscoAluno | ''>('')
  const [busca, setBusca] = useState('')
  const [alunoSelecionado, setAlunoSelecionado] = useState<string | null>(null)
  const [modalAvaliacaoAberto, setModalAvaliacaoAberto] = useState(false)
  const buscaDebounced = useDebounce(busca, 400)

  const { data, isLoading } = useAcompanhamento({ risco: filtroRisco || undefined, busca: buscaDebounced || undefined })
  const { data: detalhe, isLoading: loadingDetalhe } = useDetalheAluno(alunoSelecionado)
  const { data: avaliacoes } = useAvaliacoesDoAluno(alunoSelecionado)
  const { data: evolucoes } = useEvolucoesDoAluno(alunoSelecionado)

  const alunos = data?.alunos ?? []
  const resumo = data?.resumo

  const cards = [
    {
      key: 'EM_RISCO' as const,
      label: 'Em risco de evasão',
      valor: resumo?.emRisco ?? 0,
      Icon: TrendingDown,
      cor: 'text-rosa-vibrante',
      borda: 'border-rosa-vibrante/30',
    },
    {
      key: 'ATENCAO' as const,
      label: 'Requer atenção',
      valor: resumo?.atencao ?? 0,
      Icon: AlertTriangle,
      cor: 'text-amber-600',
      borda: 'border-amber-200',
    },
    {
      key: 'OK' as const,
      label: 'Em dia',
      valor: resumo?.ok ?? 0,
      Icon: CheckCircle2,
      cor: 'text-green-600',
      borda: 'border-green-200',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-cinza-forte flex items-center gap-2">
          <HeartPulse className="w-6 h-6 text-rosa-vibrante" /> Acompanhamento de Alunos
        </h1>
        <p className="text-sm text-cinza-texto mt-1">
          Frequência, situação financeira e risco de evasão — para agir na retenção.
        </p>
      </div>

      {/* Cards de resumo (clicáveis para filtrar) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map(({ key, label, valor, Icon, cor, borda }) => (
          <button
            key={key}
            onClick={() => setFiltroRisco((atual) => (atual === key ? '' : key))}
            className={cn(
              'text-left rounded-xl border bg-branco-puro p-4 transition-all hover:shadow-sm',
              borda,
              filtroRisco === key && 'ring-2 ring-lilas-medio',
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-cinza-texto">{label}</span>
              <Icon className={cn('w-5 h-5', cor)} />
            </div>
            <p className={cn('text-3xl font-bold mt-2', cor)}>{valor}</p>
          </button>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cinza-medio" />
              <Input
                placeholder="Buscar aluno por nome ou e-mail"
                className="pl-9 w-72"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
            {(filtroRisco || busca) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFiltroRisco('')
                  setBusca('')
                }}
              >
                <X className="w-3 h-3 mr-1" /> Limpar filtros
              </Button>
            )}
            {data && (
              <span className="text-sm text-cinza-medio ml-auto">
                {alunos.length} aluno{alunos.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-16 text-center text-cinza-medio">Carregando...</div>
          ) : alunos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-cinza-medio">
              <HeartPulse className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">Nenhum aluno encontrado.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Última presença</TableHead>
                  <TableHead className="text-center">Frequência (30d)</TableHead>
                  <TableHead>Financeiro</TableHead>
                  <TableHead>Risco</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alunos.map((a) => (
                  <TableRow
                    key={a.id}
                    className="cursor-pointer hover:bg-bege-suave/60"
                    onClick={() => setAlunoSelecionado(a.id)}
                  >
                    <TableCell>
                      <p className="font-medium text-cinza-forte">{a.nome}</p>
                      {a.motivosRisco.length > 0 && (
                        <p className="text-xs text-cinza-medio">{a.motivosRisco.join(' · ')}</p>
                      )}
                    </TableCell>
                    <TableCell className="text-cinza-texto">{a.plano ?? '—'}</TableCell>
                    <TableCell className="text-cinza-texto">
                      {formatarData(a.ultimaPresenca)}
                      {a.diasSemPresenca != null && a.ultimaPresenca && (
                        <span className="text-xs text-cinza-medio ml-1">({a.diasSemPresenca}d)</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={cn('font-medium', a.taxaPresenca < 50 ? 'text-rosa-vibrante' : 'text-cinza-forte')}
                      >
                        {a.taxaPresenca}%
                      </span>
                    </TableCell>
                    <TableCell>
                      {a.mensalidadeVencida ? (
                        <Badge variant="destructive">Inadimplente</Badge>
                      ) : a.mensalidadesPendentes > 0 ? (
                        <Badge variant="warning">{a.mensalidadesPendentes} pendente(s)</Badge>
                      ) : (
                        <Badge variant="success">Em dia</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={RISCO_INFO[a.risco].variant}>{RISCO_INFO[a.risco].label}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detalhe 360º */}
      <Dialog open={!!alunoSelecionado} onOpenChange={(v) => !v && setAlunoSelecionado(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-4 h-4 text-roxo-profundo" />
              {detalhe?.nome ?? 'Aluno'}
            </DialogTitle>
          </DialogHeader>

          {loadingDetalhe || !detalhe ? (
            <p className="py-8 text-center text-cinza-medio text-sm">Carregando...</p>
          ) : (
            <div className="space-y-5">
              {/* Indicadores */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-lg bg-bege-suave p-3">
                  <p className="text-xs text-cinza-medio">Risco</p>
                  <Badge variant={RISCO_INFO[detalhe.risco].variant} className="mt-1">
                    {RISCO_INFO[detalhe.risco].label}
                  </Badge>
                </div>
                <div className="rounded-lg bg-bege-suave p-3">
                  <p className="text-xs text-cinza-medio">Frequência (30d)</p>
                  <p className="font-semibold text-cinza-forte mt-1">{detalhe.taxaPresenca}%</p>
                </div>
                <div className="rounded-lg bg-bege-suave p-3">
                  <p className="text-xs text-cinza-medio">Última presença</p>
                  <p className="font-semibold text-cinza-forte mt-1">{formatarData(detalhe.ultimaPresenca)}</p>
                </div>
                <div className="rounded-lg bg-bege-suave p-3">
                  <p className="text-xs text-cinza-medio">Plano</p>
                  <p className="font-semibold text-cinza-forte mt-1">{detalhe.plano ?? '—'}</p>
                </div>
              </div>

              {(detalhe.email || detalhe.telefone) && (
                <p className="text-sm text-cinza-texto">
                  {detalhe.email && <span>{detalhe.email}</span>}
                  {detalhe.email && detalhe.telefone && <span> · </span>}
                  {detalhe.telefone && <span>{detalhe.telefone}</span>}
                </p>
              )}

              {/* Próximas aulas */}
              <div>
                <h3 className="text-sm font-semibold text-cinza-forte mb-2 flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4" /> Próximas aulas
                </h3>
                {detalhe.proximasAulas.length === 0 ? (
                  <p className="text-sm text-cinza-medio">Nenhuma aula futura agendada.</p>
                ) : (
                  <ul className="space-y-1">
                    {detalhe.proximasAulas.map((a) => (
                      <li key={a.id} className="text-sm text-cinza-texto flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-cinza-medio" /> {formatarDataHora(a.dataHoraInicio)} —{' '}
                        {a.sala}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Mensalidades */}
              <div>
                <h3 className="text-sm font-semibold text-cinza-forte mb-2">Mensalidades recentes</h3>
                {detalhe.mensalidades.length === 0 ? (
                  <p className="text-sm text-cinza-medio">Nenhuma mensalidade registrada.</p>
                ) : (
                  <div className="space-y-1">
                    {detalhe.mensalidades.slice(0, 6).map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between text-sm border-b border-bege-cartao py-1"
                      >
                        <span className="text-cinza-texto">
                          {m.plano ?? 'Avulso'} · venc. {formatarData(m.dataVencimento)}
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="text-cinza-forte">{formatarValor(m.valor)}</span>
                          <Badge
                            variant={
                              m.status === 'PAGO' ? 'success' : m.status === 'VENCIDO' ? 'destructive' : 'warning'
                            }
                          >
                            {m.status}
                          </Badge>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Histórico de presença */}
              <div>
                <h3 className="text-sm font-semibold text-cinza-forte mb-2">Histórico de presença</h3>
                {detalhe.presencas.length === 0 ? (
                  <p className="text-sm text-cinza-medio">Sem registros de presença.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {detalhe.presencas.slice(0, 20).map((p) => (
                      <span
                        key={p.id}
                        title={`${formatarData(p.dataRegistro)} — ${p.status}`}
                        className={cn(
                          'text-[11px] px-2 py-0.5 rounded-full border',
                          p.status === 'PRESENTE'
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : p.status === 'AUSENTE'
                              ? 'bg-rosa-vibrante/10 text-rosa-vibrante border-rosa-vibrante/30'
                              : 'bg-bege-suave text-cinza-texto border-bege-cartao',
                        )}
                      >
                        {formatarData(p.dataRegistro)}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Avaliações corporais */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-cinza-forte flex items-center gap-1.5">
                    <HeartPulse className="w-4 h-4" /> Avaliações corporais
                  </h3>
                  <Button variant="outline" size="sm" onClick={() => setModalAvaliacaoAberto(true)}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> Nova avaliação
                  </Button>
                </div>
                {!avaliacoes || avaliacoes.avaliacoes.length === 0 ? (
                  <p className="text-sm text-cinza-medio">Nenhuma avaliação registrada.</p>
                ) : (
                  <div className="space-y-2">
                    {avaliacoes.avaliacoes.map((a) => (
                      <div key={a.id} className="rounded-lg border border-bege-cartao p-3 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-cinza-forte">{formatarData(a.dataAvaliacao)}</span>
                          <span className="flex items-center gap-2 text-cinza-texto">
                            {a.peso != null && <span>{Number(a.peso)} kg</span>}
                            {a.altura != null && <span>{Number(a.altura)} m</span>}
                            {a.imc != null && <Badge variant="outline">IMC {a.imc}</Badge>}
                          </span>
                        </div>
                        {a.queixaPrincipal && (
                          <p className="text-cinza-texto mt-1">
                            <strong className="text-cinza-forte">Queixa:</strong> {a.queixaPrincipal}
                          </p>
                        )}
                        {a.fotos.length > 0 && (
                          <p className="text-xs text-cinza-medio mt-1 flex items-center gap-1">
                            <ImageIcon className="w-3 h-3" /> {a.fotos.length} foto(s)
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Timeline de evolução */}
              <div>
                <h3 className="text-sm font-semibold text-cinza-forte mb-2 flex items-center gap-1.5">
                  <NotebookPen className="w-4 h-4" /> Evolução por aula
                </h3>
                {!evolucoes || evolucoes.evolucoes.length === 0 ? (
                  <p className="text-sm text-cinza-medio">Nenhuma nota de evolução registrada.</p>
                ) : (
                  <div className="space-y-2">
                    {evolucoes.evolucoes.map((e) => (
                      <div key={e.id} className="rounded-lg border border-bege-cartao p-3 text-sm">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="font-medium text-cinza-forte">
                            {e.aula ? formatarDataHora(e.aula.dataHoraInicio) : '—'}
                          </span>
                          {e.registradoPor && (
                            <span className="text-xs text-cinza-medio">{e.registradoPor.nomeCompleto}</span>
                          )}
                        </div>
                        <p className="text-cinza-texto mt-1">{e.observacao}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {modalAvaliacaoAberto && alunoSelecionado && (
        <AvaliacaoFormModal alunoId={alunoSelecionado} onClose={() => setModalAvaliacaoAberto(false)} />
      )}
    </div>
  )
}
