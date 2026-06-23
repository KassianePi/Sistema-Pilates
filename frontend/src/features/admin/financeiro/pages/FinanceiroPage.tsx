import { useState } from 'react'
import {
  ArrowDownCircle,
  ArrowUpCircle,
  CheckCircle2,
  Clock,
  AlertTriangle,
  X,
  RotateCcw,
  FileCheck,
  FileX,
  Loader2,
  Eye,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useMensalidades, useCreateMensalidade, usePagamentos, useRegistrarPagamento } from '../hooks/useFinanceiro'
import { useAlunos } from '@/features/admin/alunos/hooks/useAlunos'
import { usePlanos } from '@/features/admin/planos/hooks/usePlanos'
import { estornosService } from '@/services/estornos.service'
import { financeiroService } from '@/services/financeiro.service'
import type { Mensalidade, StatusMensalidade, MetodoPagamento, StatusComprovante } from '@/types/domain.types'
import type { StatusEstorno } from '@/services/estornos.service'

function formatarValor(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}
function formatarData(d: string) {
  return new Date(d).toLocaleDateString('pt-BR')
}

const STATUS_MENSALIDADE: Record<
  StatusMensalidade,
  { label: string; variant: 'success' | 'warning' | 'destructive' | 'outline' }
> = {
  PAGO: { label: 'Pago', variant: 'success' },
  PENDENTE: { label: 'Pendente', variant: 'warning' },
  VENCIDO: { label: 'Vencido', variant: 'destructive' },
  CANCELADO: { label: 'Cancelado', variant: 'outline' },
  PARCIAL: { label: 'Parcial', variant: 'warning' },
}

const STATUS_ESTORNO: Record<
  StatusEstorno,
  { label: string; variant: 'success' | 'warning' | 'destructive' | 'outline' }
> = {
  SOLICITADO: { label: 'Solicitado', variant: 'warning' },
  APROVADO: { label: 'Aprovado', variant: 'success' },
  PROCESSADO: { label: 'Processado', variant: 'outline' },
  NEGADO: { label: 'Negado', variant: 'destructive' },
}

const STATUS_COMPROVANTE: Record<
  StatusComprovante,
  { label: string; variant: 'success' | 'warning' | 'destructive' | 'outline' }
> = {
  PENDENTE: { label: 'Pendente', variant: 'warning' },
  APROVADO: { label: 'Aprovado', variant: 'success' },
  REJEITADO: { label: 'Rejeitado', variant: 'destructive' },
}

const METODOS_PAGAMENTO: { value: MetodoPagamento; label: string }[] = [
  { value: 'DINHEIRO', label: 'Dinheiro' },
  { value: 'PIX', label: 'PIX' },
  { value: 'CARTAO_DEBITO', label: 'Cartão de Débito' },
  { value: 'CARTAO_CREDITO', label: 'Cartão de Crédito' },
  { value: 'TRANSFERENCIA', label: 'Transferência' },
]

const mensalidadeSchema = z
  .object({
    tipo: z.enum(['MENSAL', 'AVULSO']),
    alunoId: z.string().min(1, 'Selecione um aluno'),
    planoId: z.string().optional(),
    valor: z.number().positive('Valor deve ser positivo'),
    vencimento: z.string().min(1, 'Informe o vencimento'),
  })
  .superRefine((data, ctx) => {
    if (data.tipo === 'MENSAL' && !data.planoId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Selecione um plano', path: ['planoId'] })
    }
  })

const pagamentoSchema = z.object({
  mensalidadeId: z.string().min(1, 'Selecione uma mensalidade'),
  valor: z.number().positive('Valor deve ser positivo'),
  metodo: z.enum(['DINHEIRO', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'PIX', 'TRANSFERENCIA']),
  dataPagamento: z.string().min(1, 'Informe a data'),
  observacoes: z.string().optional(),
})

export function FinanceiroPage() {
  const [abaSelecionada, setAbaSelecionada] = useState<'mensalidades' | 'pagamentos' | 'estornos' | 'comprovantes'>(
    'mensalidades',
  )
  const [filtroStatusMensalidade, setFiltroStatusMensalidade] = useState('')
  const [filtroStatusEstorno, setFiltroStatusEstorno] = useState<StatusEstorno | ''>('SOLICITADO')
  const [filtroStatusComprovante, setFiltroStatusComprovante] = useState<StatusComprovante | ''>('PENDENTE')
  const [modalRejeitarId, setModalRejeitarId] = useState<string | null>(null)
  const [motivoRejeicao, setMotivoRejeicao] = useState('')
  const [modalVisualizarComprovante, setModalVisualizarComprovante] = useState<{
    arquivo: string
    nomeArquivo: string
    tipoArquivo: string
  } | null>(null)
  const [modalMensalidade, setModalMensalidade] = useState(false)
  const [modalPagamento, setModalPagamento] = useState<Mensalidade | null>(null)

  const { data: mensalidadesData, isLoading: loadingMensalidades } = useMensalidades({
    status: filtroStatusMensalidade || undefined,
    limite: 20,
  })
  const { data: pagamentosData, isLoading: loadingPagamentos } = usePagamentos({ limite: 20 })
  const createMensalidade = useCreateMensalidade()
  const registrarPagamento = useRegistrarPagamento()

  const { data: alunosData } = useAlunos({ limite: 200 })
  const { data: planosData } = usePlanos({ limite: 100 })

  const queryClient = useQueryClient()
  const { data: estornosData, isLoading: loadingEstornos } = useQuery({
    queryKey: ['estornos-admin', filtroStatusEstorno],
    queryFn: () => estornosService.listar({ status: filtroStatusEstorno || undefined, limit: 50 }),
    enabled: abaSelecionada === 'estornos',
  })
  const aprovarEstorno = useMutation({
    mutationFn: estornosService.aprovar,
    onSuccess: () => {
      toast.success('Reembolso aprovado.')
      queryClient.invalidateQueries({ queryKey: ['estornos-admin'] })
    },
    onError: () => toast.error('Erro ao aprovar reembolso.'),
  })
  const negarEstorno = useMutation({
    mutationFn: estornosService.negar,
    onSuccess: () => {
      toast.success('Reembolso negado.')
      queryClient.invalidateQueries({ queryKey: ['estornos-admin'] })
    },
    onError: () => toast.error('Erro ao negar reembolso.'),
  })
  const processarEstorno = useMutation({
    mutationFn: estornosService.processar,
    onSuccess: () => {
      toast.success('Reembolso marcado como processado.')
      queryClient.invalidateQueries({ queryKey: ['estornos-admin'] })
    },
    onError: () => toast.error('Erro ao processar reembolso.'),
  })

  const { data: comprovantesData, isLoading: loadingComprovantes } = useQuery({
    queryKey: ['comprovantes-admin', filtroStatusComprovante],
    queryFn: () => financeiroService.listarComprovantes({ status: filtroStatusComprovante || undefined, limit: 50 }),
    enabled: abaSelecionada === 'comprovantes',
  })
  const analisarComprovante = useMutation({
    mutationFn: ({ id, acao, observacoes }: { id: string; acao: 'APROVADO' | 'REJEITADO'; observacoes?: string }) =>
      financeiroService.analisarComprovante(id, acao, observacoes),
    onSuccess: (_data, vars) => {
      toast.success(vars.acao === 'APROVADO' ? 'Comprovante aprovado! Mensalidade quitada.' : 'Comprovante rejeitado.')
      queryClient.invalidateQueries({ queryKey: ['comprovantes-admin'] })
      // Aprovação baixa a mensalidade e registra a movimentação de pagamento
      queryClient.invalidateQueries({ queryKey: ['mensalidades'] })
      queryClient.invalidateQueries({ queryKey: ['pagamentos'] })
      setModalRejeitarId(null)
      setMotivoRejeicao('')
    },
    onError: () => toast.error('Erro ao analisar comprovante.'),
  })

  const alunos = alunosData?.data ?? []
  const planos = planosData?.data ?? []

  const formMensalidade = useForm<z.infer<typeof mensalidadeSchema>>({
    resolver: zodResolver(mensalidadeSchema),
    defaultValues: { tipo: 'MENSAL', alunoId: '', planoId: '', vencimento: '', valor: 0 },
  })
  const formPagamento = useForm<z.infer<typeof pagamentoSchema>>({
    resolver: zodResolver(pagamentoSchema),
    defaultValues: { metodo: 'PIX', dataPagamento: new Date().toISOString().split('T')[0] },
  })

  async function onCriarMensalidade(values: z.infer<typeof mensalidadeSchema>) {
    await createMensalidade.mutateAsync({
      ...values,
      planoId: values.tipo === 'AVULSO' ? undefined : values.planoId,
    })
    setModalMensalidade(false)
    formMensalidade.reset({ tipo: 'MENSAL', alunoId: '', planoId: '', vencimento: '', valor: 0 })
  }

  async function onRegistrarPagamento(values: z.infer<typeof pagamentoSchema>) {
    await registrarPagamento.mutateAsync(values)
    setModalPagamento(null)
    formPagamento.reset()
  }

  function abrirModalPagamento(mensalidade: Mensalidade) {
    setModalPagamento(mensalidade)
    formPagamento.setValue('mensalidadeId', mensalidade.id)
    formPagamento.setValue('valor', mensalidade.valor)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-cinza-forte">Financeiro</h1>
        <p className="text-sm text-cinza-texto mt-1">Mensalidades, pagamentos, reembolsos e comprovantes.</p>
      </div>

      {/* Abas Mensalidades / Pagamentos */}
      <div>
        <div className="flex gap-1 bg-bege-suave p-1 rounded-lg w-fit mb-6 flex-wrap">
          {(
            [
              { key: 'mensalidades', label: 'Mensalidades' },
              { key: 'pagamentos', label: 'Pagamentos' },
              { key: 'estornos', label: 'Reembolsos' },
              { key: 'comprovantes', label: 'Comprovantes' },
            ] as const
          ).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setAbaSelecionada(key)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                abaSelecionada === key
                  ? 'bg-branco-puro text-cinza-forte shadow-sm'
                  : 'text-cinza-texto hover:text-cinza-forte'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {abaSelecionada === 'mensalidades' && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Select
                    value={filtroStatusMensalidade || 'all'}
                    onValueChange={(v) => setFiltroStatusMensalidade(v === 'all' ? '' : v)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="PENDENTE">Pendente</SelectItem>
                      <SelectItem value="PAGO">Pago</SelectItem>
                      <SelectItem value="VENCIDO">Vencido</SelectItem>
                    </SelectContent>
                  </Select>
                  {filtroStatusMensalidade && (
                    <Button variant="ghost" size="sm" onClick={() => setFiltroStatusMensalidade('')}>
                      <X className="w-3 h-3 mr-1" />
                      Limpar
                    </Button>
                  )}
                </div>
                <Button size="sm" onClick={() => setModalMensalidade(true)}>
                  <ArrowUpCircle className="w-4 h-4" />
                  Nova mensalidade
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loadingMensalidades ? (
                <div className="py-12 text-center text-cinza-medio">Carregando...</div>
              ) : (mensalidadesData?.data ?? []).length === 0 ? (
                <div className="py-12 text-center text-cinza-medio">
                  <ArrowUpCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Nenhuma mensalidade encontrada.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Aluno</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(mensalidadesData?.data ?? []).map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">{m.aluno.usuario.nomeCompleto}</TableCell>
                        <TableCell className="text-cinza-texto">{(m as any).plano?.nome ?? 'Avulso'}</TableCell>
                        <TableCell className="font-semibold">{formatarValor(m.valor)}</TableCell>
                        <TableCell className="text-cinza-texto">{formatarData(m.vencimento)}</TableCell>
                        <TableCell>
                          <Badge variant={STATUS_MENSALIDADE[m.status]?.variant ?? 'outline'}>
                            {m.status === 'PAGO' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                            {m.status === 'PENDENTE' && <Clock className="w-3 h-3 mr-1" />}
                            {m.status === 'VENCIDO' && <AlertTriangle className="w-3 h-3 mr-1" />}
                            {STATUS_MENSALIDADE[m.status]?.label ?? m.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {(m.status === 'PENDENTE' || m.status === 'VENCIDO') && (
                            <Button size="sm" variant="outline" onClick={() => abrirModalPagamento(m)}>
                              <ArrowDownCircle className="w-3.5 h-3.5" />
                              Registrar pagamento
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {abaSelecionada === 'pagamentos' && (
          <Card>
            <CardContent className="p-0 pt-4">
              {loadingPagamentos ? (
                <div className="py-12 text-center text-cinza-medio">Carregando...</div>
              ) : (pagamentosData?.data ?? []).length === 0 ? (
                <div className="py-12 text-center text-cinza-medio">
                  <ArrowDownCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Nenhum pagamento registrado.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Aluno</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(pagamentosData?.data ?? []).map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">
                          {p.mensalidade?.aluno?.usuario?.nomeCompleto ?? '—'}
                        </TableCell>
                        <TableCell className="text-cinza-texto">{p.mensalidade?.plano?.nome ?? '—'}</TableCell>
                        <TableCell className="font-semibold text-green-700">{formatarValor(p.valor)}</TableCell>
                        <TableCell className="text-cinza-texto">
                          {METODOS_PAGAMENTO.find((m) => m.value === p.metodoPagamento)?.label ?? p.metodoPagamento}
                        </TableCell>
                        <TableCell className="text-cinza-texto">{formatarData(p.dataPagamento)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {abaSelecionada === 'estornos' && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <Select
                  value={filtroStatusEstorno || 'all'}
                  onValueChange={(v) => setFiltroStatusEstorno(v === 'all' ? '' : (v as StatusEstorno))}
                >
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="SOLICITADO">Solicitado</SelectItem>
                    <SelectItem value="APROVADO">Aprovado</SelectItem>
                    <SelectItem value="PROCESSADO">Processado</SelectItem>
                    <SelectItem value="NEGADO">Negado</SelectItem>
                  </SelectContent>
                </Select>
                {filtroStatusEstorno && (
                  <Button variant="ghost" size="sm" onClick={() => setFiltroStatusEstorno('')}>
                    <X className="w-3 h-3 mr-1" />
                    Limpar
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loadingEstornos ? (
                <div className="py-12 text-center text-cinza-medio">Carregando...</div>
              ) : (estornosData?.estornos ?? []).length === 0 ? (
                <div className="py-12 text-center text-cinza-medio">
                  <RotateCcw className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Nenhuma solicitação de reembolso encontrada.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Aluno</TableHead>
                      <TableHead>Referência</TableHead>
                      <TableHead className="text-center">Contratado</TableHead>
                      <TableHead className="text-center">Compareceu</TableHead>
                      <TableHead className="text-center">A reembolsar</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(estornosData?.estornos ?? []).map((e: any) => {
                      const statusInfo = STATUS_ESTORNO[e.status as StatusEstorno] ?? STATUS_ESTORNO.SOLICITADO
                      const pendente = e.status === 'SOLICITADO'
                      const aprovado = e.status === 'APROVADO'
                      return (
                        <TableRow key={e.id}>
                          <TableCell className="font-medium">{e.aluno?.usuario?.nomeCompleto ?? '—'}</TableCell>
                          <TableCell className="text-cinza-texto text-sm">
                            <div>{e.mensalidade?.plano?.nome ?? 'Avulso'}</div>
                            {e.mensalidade?.mesReferencia && (
                              <div className="text-xs text-cinza-medio">
                                {formatarData(e.mensalidade.mesReferencia)}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-center">{e.diasContratados}</TableCell>
                          <TableCell className="text-center">{e.diasComparecidos}</TableCell>
                          <TableCell className="text-center font-semibold text-rosa-vibrante">
                            {e.diasEstornados}
                          </TableCell>
                          <TableCell className="font-semibold text-cinza-forte">
                            {formatarValor(Number(e.valorEstorno))}
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {pendente && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-green-700 border-green-300 hover:bg-green-50 text-xs"
                                    onClick={() => aprovarEstorno.mutate(e.id)}
                                    disabled={aprovarEstorno.isPending}
                                  >
                                    Aprovar
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-rosa-vibrante border-rosa-vibrante/30 hover:bg-rosa-vibrante/5 text-xs"
                                    onClick={() => negarEstorno.mutate(e.id)}
                                    disabled={negarEstorno.isPending}
                                  >
                                    Negar
                                  </Button>
                                </>
                              )}
                              {aprovado && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs"
                                  onClick={() => processarEstorno.mutate(e.id)}
                                  disabled={processarEstorno.isPending}
                                >
                                  Marcar processado
                                </Button>
                              )}
                              {e.motivo && (
                                <span
                                  className="text-xs text-cinza-medio italic max-w-[120px] truncate"
                                  title={e.motivo}
                                >
                                  {e.motivo}
                                </span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {abaSelecionada === 'comprovantes' && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-roxo-profundo" /> Comprovantes de Pagamento
                </CardTitle>
                <Select
                  value={filtroStatusComprovante || 'all'}
                  onValueChange={(v) => setFiltroStatusComprovante(v === 'all' ? '' : (v as StatusComprovante))}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="PENDENTE">Pendente</SelectItem>
                    <SelectItem value="APROVADO">Aprovado</SelectItem>
                    <SelectItem value="REJEITADO">Rejeitado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loadingComprovantes ? (
                <div className="py-12 text-center text-cinza-medio">Carregando...</div>
              ) : (comprovantesData?.comprovantes ?? []).length === 0 ? (
                <div className="py-12 text-center text-cinza-medio">
                  <FileCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Nenhum comprovante encontrado.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Aluno</TableHead>
                      <TableHead>Plano / Mensalidade</TableHead>
                      <TableHead>Arquivo</TableHead>
                      <TableHead>Enviado em</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(comprovantesData?.comprovantes ?? []).map((c: any) => {
                      const st = STATUS_COMPROVANTE[c.status as StatusComprovante] ?? {
                        label: c.status,
                        variant: 'outline' as const,
                      }
                      return (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium">{c.aluno?.usuario?.nomeCompleto ?? '—'}</TableCell>
                          <TableCell className="text-sm text-cinza-texto">
                            {c.mensalidade?.plano?.nome ?? 'Avulso'}
                          </TableCell>
                          <TableCell className="text-sm text-cinza-texto max-w-[160px] truncate" title={c.nomeArquivo}>
                            {c.nomeArquivo}
                          </TableCell>
                          <TableCell className="text-sm">{formatarData(c.dataEnvio)}</TableCell>
                          <TableCell>
                            <Badge variant={st.variant}>{st.label}</Badge>
                            {c.status === 'REJEITADO' && c.observacoes && (
                              <p
                                className="text-xs text-cinza-medio mt-0.5 max-w-[160px] truncate"
                                title={c.observacoes}
                              >
                                {c.observacoes}
                              </p>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1 flex-wrap">
                              {c.arquivo && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-roxo-profundo border-roxo-profundo/30 hover:bg-roxo-profundo/5 text-xs"
                                  onClick={() =>
                                    setModalVisualizarComprovante({
                                      arquivo: c.arquivo,
                                      nomeArquivo: c.nomeArquivo,
                                      tipoArquivo: c.tipoArquivo,
                                    })
                                  }
                                >
                                  <Eye className="w-3 h-3 mr-1" /> Ver
                                </Button>
                              )}
                              {c.status === 'PENDENTE' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-green-700 border-green-300 hover:bg-green-50 text-xs"
                                    onClick={() => analisarComprovante.mutate({ id: c.id, acao: 'APROVADO' })}
                                    disabled={analisarComprovante.isPending}
                                  >
                                    <FileCheck className="w-3 h-3 mr-1" /> Aprovar
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-red-600 border-red-300 hover:bg-red-50 text-xs"
                                    onClick={() => {
                                      setModalRejeitarId(c.id)
                                      setMotivoRejeicao('')
                                    }}
                                    disabled={analisarComprovante.isPending}
                                  >
                                    <FileX className="w-3 h-3 mr-1" /> Rejeitar
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal: Rejeitar Comprovante */}
      <Dialog
        open={!!modalRejeitarId}
        onOpenChange={(v) => {
          if (!v) {
            setModalRejeitarId(null)
            setMotivoRejeicao('')
          }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Rejeitar comprovante</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="space-y-1.5">
              <Label>
                Motivo da rejeição <span className="text-cinza-medio text-xs">(opcional)</span>
              </Label>
              <Textarea
                rows={3}
                value={motivoRejeicao}
                onChange={(e) => setMotivoRejeicao(e.target.value)}
                placeholder="Ex: imagem ilegível, valor incorreto..."
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setModalRejeitarId(null)
                setMotivoRejeicao('')
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                modalRejeitarId &&
                analisarComprovante.mutate({
                  id: modalRejeitarId,
                  acao: 'REJEITADO',
                  observacoes: motivoRejeicao || undefined,
                })
              }
              disabled={analisarComprovante.isPending}
            >
              {analisarComprovante.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar rejeição'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Visualizar Comprovante */}
      <Dialog open={!!modalVisualizarComprovante} onOpenChange={(v) => !v && setModalVisualizarComprovante(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-roxo-profundo" />
              {modalVisualizarComprovante?.nomeArquivo ?? 'Comprovante'}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-2 flex justify-center">
            {modalVisualizarComprovante?.tipoArquivo === 'application/pdf' ? (
              <iframe
                src={modalVisualizarComprovante.arquivo}
                title="Comprovante PDF"
                className="w-full h-[480px] rounded border border-bege-cartao"
              />
            ) : modalVisualizarComprovante ? (
              <img
                src={modalVisualizarComprovante.arquivo}
                alt="Comprovante"
                className="max-h-[480px] max-w-full object-contain rounded border border-bege-cartao"
              />
            ) : null}
          </div>
          <DialogFooter className="mt-3">
            <Button variant="outline" onClick={() => setModalVisualizarComprovante(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Nova Mensalidade */}
      <Dialog open={modalMensalidade} onOpenChange={(v) => !v && setModalMensalidade(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Mensalidade</DialogTitle>
          </DialogHeader>
          <form onSubmit={formMensalidade.handleSubmit(onCriarMensalidade as never)} className="space-y-4">
            <div className="flex gap-1 bg-bege-suave p-1 rounded-lg w-fit">
              {(['MENSAL', 'AVULSO'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => formMensalidade.setValue('tipo', t, { shouldValidate: false })}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    formMensalidade.watch('tipo') === t
                      ? 'bg-branco-puro text-cinza-forte shadow-sm'
                      : 'text-cinza-texto hover:text-cinza-forte'
                  }`}
                >
                  {t === 'MENSAL' ? 'Mensalidade' : 'Aula Avulsa'}
                </button>
              ))}
            </div>

            {formMensalidade.watch('tipo') === 'AVULSO' && (
              <p className="text-xs text-cinza-texto bg-lilas-claro/30 rounded-lg px-3 py-2">
                Cobrança avulsa — sem plano vinculado. Ideal para alunos eventuais.
              </p>
            )}

            <div className="space-y-1.5">
              <Label>Aluno *</Label>
              <Select
                value={formMensalidade.watch('alunoId') || undefined}
                onValueChange={(v) => formMensalidade.setValue('alunoId', v, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o aluno" />
                </SelectTrigger>
                <SelectContent>
                  {alunos
                    .filter((a) => a.status === 'ATIVO')
                    .map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.usuario.nomeCompleto}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {formMensalidade.formState.errors.alunoId && (
                <p className="text-xs text-rosa-vibrante">{formMensalidade.formState.errors.alunoId.message}</p>
              )}
            </div>

            {formMensalidade.watch('tipo') === 'MENSAL' && (
              <div className="space-y-1.5">
                <Label>Plano *</Label>
                <Select
                  value={formMensalidade.watch('planoId') || undefined}
                  onValueChange={(v) => formMensalidade.setValue('planoId', v, { shouldValidate: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o plano" />
                  </SelectTrigger>
                  <SelectContent>
                    {planos
                      .filter((p) => p.ativo)
                      .map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nome} — {formatarValor(p.valor)}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {formMensalidade.formState.errors.planoId && (
                  <p className="text-xs text-rosa-vibrante">{formMensalidade.formState.errors.planoId.message}</p>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Valor (R$) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  {...formMensalidade.register('valor', { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Vencimento *</Label>
                <Input type="date" {...formMensalidade.register('vencimento')} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalMensalidade(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMensalidade.isPending}>
                Criar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Registrar Pagamento */}
      <Dialog open={!!modalPagamento} onOpenChange={(v) => !v && setModalPagamento(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Pagamento</DialogTitle>
            {modalPagamento && (
              <p className="text-sm text-cinza-texto mt-1">
                {modalPagamento.aluno.usuario.nomeCompleto} — {(modalPagamento as any).plano?.nome ?? 'Avulso'}
              </p>
            )}
          </DialogHeader>
          <form onSubmit={formPagamento.handleSubmit(onRegistrarPagamento as never)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Valor (R$) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  {...formPagamento.register('valor', { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Data do pagamento *</Label>
                <Input type="date" {...formPagamento.register('dataPagamento')} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Método *</Label>
              <Select
                value={formPagamento.watch('metodo')}
                onValueChange={(v) => formPagamento.setValue('metodo', v as MetodoPagamento)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {METODOS_PAGAMENTO.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalPagamento(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={registrarPagamento.isPending}>
                Confirmar pagamento
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
