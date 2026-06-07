import { useState } from 'react'
import { BarChart3, FileText, Eye, TrendingUp, DollarSign, AlertCircle, Users, X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useRelatorios, useGerarRelatorio } from '../hooks/useRelatorios'
import { useProfessores } from '@/features/admin/professores/hooks/useProfessores'
import type { Relatorio, TipoRelatorio } from '@/types/domain.types'

function formatarValor(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}
function formatarData(d: string) {
  return new Date(d).toLocaleDateString('pt-BR')
}
function formatarDataHora(d: string) {
  return new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const TIPOS_RELATORIO: { value: TipoRelatorio; label: string; descricao: string; icon: React.ElementType }[] = [
  { value: 'FREQUENCIA', label: 'Frequência', descricao: 'Presenças e ausências no período', icon: Users },
  { value: 'FINANCEIRO', label: 'Financeiro', descricao: 'Pagamentos realizados no período', icon: DollarSign },
  { value: 'RECEITA_MENSAL', label: 'Receita Mensal', descricao: 'Mensalidades e receita do período', icon: TrendingUp },
  { value: 'PENDENCIAS_PAGAMENTO', label: 'Pendências', descricao: 'Mensalidades em aberto', icon: AlertCircle },
]

const TIPO_BADGE: Record<TipoRelatorio, { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline' }> = {
  FREQUENCIA: { label: 'Frequência', variant: 'secondary' },
  FINANCEIRO: { label: 'Financeiro', variant: 'success' },
  RECEITA_MENSAL: { label: 'Receita Mensal', variant: 'default' },
  PENDENCIAS_PAGAMENTO: { label: 'Pendências', variant: 'warning' },
  PRESENCA_ALUNO: { label: 'Presença Aluno', variant: 'outline' },
}

const STATUS_PRESENCA_LABEL: Record<string, string> = {
  PRESENTE: 'Presente',
  AUSENTE: 'Ausente',
  JUSTIFICADO: 'Justificado',
}

const gerarSchema = z.object({
  professorId: z.string().min(1, 'Selecione um professor'),
  tipo: z.enum(['FREQUENCIA', 'FINANCEIRO', 'RECEITA_MENSAL', 'PENDENCIAS_PAGAMENTO', 'PRESENCA_ALUNO'] as const),
  titulo: z.string().min(3, 'Título deve ter pelo menos 3 caracteres'),
  descricao: z.string().optional(),
  dataPeriodoInicio: z.string().min(1, 'Informe a data inicial'),
  dataPeriodoFim: z.string().min(1, 'Informe a data final'),
})

type GerarForm = z.infer<typeof gerarSchema>

function ConteudoRelatorio({ relatorio }: { relatorio: Relatorio }) {
  let conteudo: Record<string, unknown>
  try {
    conteudo = JSON.parse(relatorio.conteudo) as Record<string, unknown>
  } catch {
    return <p className="text-cinza-medio text-sm">Conteúdo não pôde ser lido.</p>
  }

  if (relatorio.tipo === 'FREQUENCIA') {
    const presencas = (conteudo.presencas ?? []) as { status: string; _count: { id: number } }[]
    const chartData = presencas.map(p => ({
      name: STATUS_PRESENCA_LABEL[p.status] ?? p.status,
      quantidade: p._count.id,
    }))
    const total = presencas.reduce((acc, p) => acc + p._count.id, 0)
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {presencas.map(p => (
            <div key={p.status} className="bg-bege-suave rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-cinza-forte">{p._count.id}</p>
              <p className="text-xs text-cinza-texto mt-0.5">{STATUS_PRESENCA_LABEL[p.status] ?? p.status}</p>
            </div>
          ))}
          <div className="bg-lilas-claro rounded-lg p-3 text-center col-span-3">
            <p className="text-xl font-bold text-roxo-profundo">{total}</p>
            <p className="text-xs text-roxo-profundo mt-0.5">Total de registros</p>
          </div>
        </div>
        {chartData.length > 0 && (
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--cinza-medio)" opacity={0.3} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--cinza-texto)' }} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--cinza-texto)' }} />
                <Tooltip formatter={(v) => [v, 'Registros']} />
                <Bar dataKey="quantidade" fill="var(--roxo-profundo)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    )
  }

  if (relatorio.tipo === 'FINANCEIRO') {
    const pagamentos = conteudo.pagamentos as number ?? 0
    const totalArrecadado = conteudo.totalArrecadado as number ?? 0
    return (
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-bege-suave rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-cinza-forte">{pagamentos}</p>
          <p className="text-sm text-cinza-texto mt-1">Pagamentos realizados</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-green-700">{formatarValor(totalArrecadado)}</p>
          <p className="text-sm text-cinza-texto mt-1">Total arrecadado</p>
        </div>
      </div>
    )
  }

  if (relatorio.tipo === 'RECEITA_MENSAL') {
    const totalMensalidades = conteudo.totalMensalidades as number ?? 0
    const totalBruto = conteudo.totalBruto as number ?? 0
    const totalDesconto = conteudo.totalDesconto as number ?? 0
    const totalLiquido = conteudo.totalLiquido as number ?? 0
    const chartData = [
      { name: 'Bruto', valor: totalBruto },
      { name: 'Desconto', valor: totalDesconto },
      { name: 'Líquido', valor: totalLiquido },
    ]
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-bege-suave rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-cinza-forte">{totalMensalidades}</p>
            <p className="text-xs text-cinza-texto mt-0.5">Mensalidades</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <p className="text-xl font-bold text-green-700">{formatarValor(totalLiquido)}</p>
            <p className="text-xs text-cinza-texto mt-0.5">Receita líquida</p>
          </div>
          <div className="bg-bege-cartao rounded-lg p-3 text-center">
            <p className="text-lg font-semibold text-cinza-forte">{formatarValor(totalBruto)}</p>
            <p className="text-xs text-cinza-texto mt-0.5">Total bruto</p>
          </div>
          <div className="bg-amber-50 rounded-lg p-3 text-center">
            <p className="text-lg font-semibold text-amber-700">{formatarValor(totalDesconto)}</p>
            <p className="text-xs text-cinza-texto mt-0.5">Descontos</p>
          </div>
        </div>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--cinza-medio)" opacity={0.3} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--cinza-texto)' }} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--cinza-texto)' }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => [formatarValor(Number(v)), 'Valor']} />
              <Bar dataKey="valor" fill="var(--lilas-medio)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    )
  }

  if (relatorio.tipo === 'PENDENCIAS_PAGAMENTO') {
    const totalPendencias = conteudo.totalPendencias as number ?? 0
    return (
      <div className="flex justify-center py-4">
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-12 py-8 text-center">
          <p className="text-5xl font-bold text-amber-700">{totalPendencias}</p>
          <p className="text-sm text-cinza-texto mt-2">Mensalidades pendentes ou vencidas</p>
        </div>
      </div>
    )
  }

  return <p className="text-cinza-medio text-sm">Visualização não disponível para este tipo.</p>
}

export function RelatoriosPage() {
  const [modalRelatorio, setModalRelatorio] = useState<Relatorio | null>(null)
  const [filtroTipo, setFiltroTipo] = useState('')

  const { data, isLoading } = useRelatorios({ tipo: filtroTipo || undefined })
  const gerarRelatorio = useGerarRelatorio()
  const { data: professoresData } = useProfessores({ limite: 100 })
  const professores = (professoresData?.data ?? []).filter((p) => p.status === 'ATIVO')

  const relatorios = data?.relatorios ?? []

  const form = useForm<GerarForm>({
    resolver: zodResolver(gerarSchema),
    defaultValues: {
      tipo: undefined,
      titulo: '',
      descricao: '',
      professorId: '',
      dataPeriodoInicio: '',
      dataPeriodoFim: '',
    },
  })

  function onTipoChange(value: string) {
    form.setValue('tipo', value as TipoRelatorio, { shouldValidate: false })
    const tipoLabel = TIPOS_RELATORIO.find((t) => t.value === value)?.label ?? ''
    const hoje = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    form.setValue('titulo', `Relatório de ${tipoLabel} — ${hoje}`)
  }

  async function onGerar(values: GerarForm) {
    await gerarRelatorio.mutateAsync(values)
    form.reset()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-cinza-forte">Relatórios</h1>
        <p className="text-sm text-cinza-texto mt-1">Gere e visualize relatórios de frequência, financeiro e mensalidades.</p>
      </div>

      {/* Formulário para gerar relatório */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="w-4 h-4" />
            Gerar Novo Relatório
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onGerar)} className="space-y-4">
            {/* Tipo + Professor */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Tipo de relatório *</Label>
                <Select onValueChange={onTipoChange} value={form.watch('tipo') ?? ''}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_RELATORIO.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label} — {t.descricao}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.tipo && (
                  <p className="text-xs text-rosa-vibrante">{form.formState.errors.tipo.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Professor responsável *</Label>
                <Select onValueChange={(v) => form.setValue('professorId', v, { shouldValidate: true })} value={form.watch('professorId')}>
                  <SelectTrigger>
                    <SelectValue placeholder={professores.length === 0 ? 'Nenhum professor ativo' : 'Selecione'} />
                  </SelectTrigger>
                  <SelectContent>
                    {professores.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.usuario.nomeCompleto}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.professorId && (
                  <p className="text-xs text-rosa-vibrante">{form.formState.errors.professorId.message}</p>
                )}
              </div>
            </div>

            {/* Período */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Data inicial *</Label>
                <Input type="date" {...form.register('dataPeriodoInicio')} />
                {form.formState.errors.dataPeriodoInicio && (
                  <p className="text-xs text-rosa-vibrante">{form.formState.errors.dataPeriodoInicio.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Data final *</Label>
                <Input type="date" {...form.register('dataPeriodoFim')} />
                {form.formState.errors.dataPeriodoFim && (
                  <p className="text-xs text-rosa-vibrante">{form.formState.errors.dataPeriodoFim.message}</p>
                )}
              </div>
            </div>

            {/* Título + Descrição */}
            <div className="space-y-1.5">
              <Label>Título *</Label>
              <Input placeholder="Ex: Relatório de Frequência — Junho 2026" {...form.register('titulo')} />
              {form.formState.errors.titulo && (
                <p className="text-xs text-rosa-vibrante">{form.formState.errors.titulo.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Descrição <span className="text-cinza-medio text-xs">(opcional)</span></Label>
              <Textarea rows={2} placeholder="Observações sobre o relatório..." {...form.register('descricao')} />
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={gerarRelatorio.isPending}>
                <BarChart3 className="w-4 h-4" />
                {gerarRelatorio.isPending ? 'Gerando...' : 'Gerar relatório'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Histórico de relatórios */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="w-4 h-4" />
              Relatórios Gerados
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={filtroTipo || 'all'} onValueChange={(v) => setFiltroTipo(v === 'all' ? '' : v)}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {TIPOS_RELATORIO.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {filtroTipo && (
                <Button variant="ghost" size="sm" onClick={() => setFiltroTipo('')}>
                  <X className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-12 text-center text-cinza-medio">Carregando...</div>
          ) : relatorios.length === 0 ? (
            <div className="py-12 text-center text-cinza-medio">
              <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Nenhum relatório gerado ainda.</p>
              <p className="text-xs mt-1">Use o formulário acima para criar o primeiro relatório.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Professor</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Gerado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {relatorios.map((r) => {
                  const badge = TIPO_BADGE[r.tipo] ?? { label: r.tipo, variant: 'outline' as const }
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium max-w-48 truncate">{r.titulo}</TableCell>
                      <TableCell>
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </TableCell>
                      <TableCell className="text-cinza-texto">
                        {r.professor?.usuario.nomeCompleto ?? '—'}
                      </TableCell>
                      <TableCell className="text-cinza-texto text-sm">
                        {formatarData(r.dataPeriodoInicio)} – {formatarData(r.dataPeriodoFim)}
                      </TableCell>
                      <TableCell className="text-cinza-texto text-sm">
                        {formatarDataHora(r.criadoEm)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => setModalRelatorio(r)}>
                          <Eye className="w-3.5 h-3.5" />
                          Ver
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal: detalhes do relatório */}
      <Dialog open={!!modalRelatorio} onOpenChange={(v) => !v && setModalRelatorio(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {modalRelatorio && (
                <>
                  <Badge variant={TIPO_BADGE[modalRelatorio.tipo]?.variant ?? 'outline'}>
                    {TIPO_BADGE[modalRelatorio.tipo]?.label ?? modalRelatorio.tipo}
                  </Badge>
                  <span className="text-base font-semibold text-cinza-forte truncate">{modalRelatorio.titulo}</span>
                </>
              )}
            </DialogTitle>
            {modalRelatorio && (
              <p className="text-xs text-cinza-medio mt-0.5">
                Período: {formatarData(modalRelatorio.dataPeriodoInicio)} a {formatarData(modalRelatorio.dataPeriodoFim)}
                {modalRelatorio.professor && ` · ${modalRelatorio.professor.usuario.nomeCompleto}`}
              </p>
            )}
          </DialogHeader>
          {modalRelatorio && (
            <div className="mt-2">
              {modalRelatorio.descricao && (
                <p className="text-sm text-cinza-texto mb-4 italic">{modalRelatorio.descricao}</p>
              )}
              <ConteudoRelatorio relatorio={modalRelatorio} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
