import { useState } from 'react'
import { DollarSign, ArrowDownCircle, ArrowUpCircle, CheckCircle2, Clock, AlertTriangle, X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  useCaixaAtivo, useAbrirCaixa, useFecharCaixa,
  useMensalidades, useCreateMensalidade,
  usePagamentos, useRegistrarPagamento,
} from '../hooks/useFinanceiro'
import { useAlunos } from '@/features/admin/alunos/hooks/useAlunos'
import { usePlanos } from '@/features/admin/planos/hooks/usePlanos'
import type { Mensalidade, StatusMensalidade, MetodoPagamento } from '@/types/domain.types'

function formatarValor(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}
function formatarData(d: string) {
  return new Date(d).toLocaleDateString('pt-BR')
}

const STATUS_MENSALIDADE: Record<StatusMensalidade, { label: string; variant: 'success' | 'warning' | 'destructive' | 'outline' }> = {
  PAGO: { label: 'Pago', variant: 'success' },
  PENDENTE: { label: 'Pendente', variant: 'warning' },
  VENCIDO: { label: 'Vencido', variant: 'destructive' },
  CANCELADO: { label: 'Cancelado', variant: 'outline' },
}

const METODOS_PAGAMENTO: { value: MetodoPagamento; label: string }[] = [
  { value: 'DINHEIRO', label: 'Dinheiro' },
  { value: 'PIX', label: 'PIX' },
  { value: 'CARTAO_DEBITO', label: 'Cartão de Débito' },
  { value: 'CARTAO_CREDITO', label: 'Cartão de Crédito' },
  { value: 'TRANSFERENCIA', label: 'Transferência' },
]

const abrirCaixaSchema = z.object({
  saldoAbertura: z.number().min(0, 'Saldo deve ser positivo'),
})

const mensalidadeSchema = z.object({
  alunoId: z.string().min(1, 'Selecione um aluno'),
  planoId: z.string().min(1, 'Selecione um plano'),
  valor: z.number().positive('Valor deve ser positivo'),
  vencimento: z.string().min(1, 'Informe o vencimento'),
})

const pagamentoSchema = z.object({
  mensalidadeId: z.string().min(1, 'Selecione uma mensalidade'),
  valor: z.number().positive('Valor deve ser positivo'),
  metodo: z.enum(['DINHEIRO', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'PIX', 'TRANSFERENCIA']),
  dataPagamento: z.string().min(1, 'Informe a data'),
  observacoes: z.string().optional(),
})

export function FinanceiroPage() {
  const [abaSelecionada, setAbaSelecionada] = useState<'mensalidades' | 'pagamentos'>('mensalidades')
  const [filtroStatusMensalidade, setFiltroStatusMensalidade] = useState('')
  const [modalCaixaAbrir, setModalCaixaAbrir] = useState(false)
  const [modalFecharCaixa, setModalFecharCaixa] = useState(false)
  const [modalMensalidade, setModalMensalidade] = useState(false)
  const [modalPagamento, setModalPagamento] = useState<Mensalidade | null>(null)

  const { data: caixa, isLoading: loadingCaixa } = useCaixaAtivo()
  const abrirCaixa = useAbrirCaixa()
  const fecharCaixa = useFecharCaixa()
  const { data: mensalidadesData, isLoading: loadingMensalidades } = useMensalidades({ status: filtroStatusMensalidade || undefined, limite: 20 })
  const { data: pagamentosData, isLoading: loadingPagamentos } = usePagamentos({ limite: 20 })
  const createMensalidade = useCreateMensalidade()
  const registrarPagamento = useRegistrarPagamento()

  const { data: alunosData } = useAlunos({ limite: 200 })
  const { data: planosData } = usePlanos({ limite: 100 })
  const alunos = alunosData?.data ?? []
  const planos = planosData?.data ?? []

  const formCaixa = useForm<z.infer<typeof abrirCaixaSchema>>({ resolver: zodResolver(abrirCaixaSchema), defaultValues: { saldoAbertura: 0 } })
  const formMensalidade = useForm<z.infer<typeof mensalidadeSchema>>({ resolver: zodResolver(mensalidadeSchema) })
  const formPagamento = useForm<z.infer<typeof pagamentoSchema>>({
    resolver: zodResolver(pagamentoSchema),
    defaultValues: { metodo: 'PIX', dataPagamento: new Date().toISOString().split('T')[0] },
  })

  async function onAbrirCaixa(values: z.infer<typeof abrirCaixaSchema>) {
    await abrirCaixa.mutateAsync(values.saldoAbertura)
    setModalCaixaAbrir(false)
    formCaixa.reset()
  }

  async function onCriarMensalidade(values: z.infer<typeof mensalidadeSchema>) {
    await createMensalidade.mutateAsync(values)
    setModalMensalidade(false)
    formMensalidade.reset()
  }

  async function onRegistrarPagamento(values: z.infer<typeof pagamentoSchema>) {
    if (!caixa) return
    await registrarPagamento.mutateAsync({ ...values, caixaId: caixa.id })
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
        <p className="text-sm text-cinza-texto mt-1">Controle de caixa, mensalidades e pagamentos.</p>
      </div>

      {/* Caixa */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Caixa
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingCaixa ? (
            <p className="text-cinza-medio text-sm">Verificando caixa...</p>
          ) : caixa ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                <div>
                  <p className="font-medium text-cinza-forte">Caixa aberto</p>
                  <p className="text-sm text-cinza-texto">
                    Desde {formatarData(caixa.dataAbertura)} — Saldo inicial: {formatarValor(Number(caixa.saldoAbertura))}
                  </p>
                </div>
              </div>
              <Button variant="outline" onClick={() => setModalFecharCaixa(true)}>Fechar caixa</Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-cinza-medio" />
                <p className="text-cinza-texto">Caixa fechado</p>
              </div>
              <Button onClick={() => setModalCaixaAbrir(true)}>Abrir caixa</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Abas Mensalidades / Pagamentos */}
      <div>
        <div className="flex gap-1 bg-bege-suave p-1 rounded-lg w-fit mb-6">
          {(['mensalidades', 'pagamentos'] as const).map((aba) => (
            <button
              key={aba}
              onClick={() => setAbaSelecionada(aba)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${
                abaSelecionada === aba
                  ? 'bg-branco-puro text-cinza-forte shadow-sm'
                  : 'text-cinza-texto hover:text-cinza-forte'
              }`}
            >
              {aba.charAt(0).toUpperCase() + aba.slice(1)}
            </button>
          ))}
        </div>

        {abaSelecionada === 'mensalidades' && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Select value={filtroStatusMensalidade || 'all'} onValueChange={(v) => setFiltroStatusMensalidade(v === 'all' ? '' : v)}>
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
                      <X className="w-3 h-3 mr-1" />Limpar
                    </Button>
                  )}
                </div>
                <Button size="sm" onClick={() => setModalMensalidade(true)}>
                  <ArrowUpCircle className="w-4 h-4" />Nova mensalidade
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
                        <TableCell className="text-cinza-texto">{m.plano.nome}</TableCell>
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
                            <Button size="sm" variant="outline" onClick={() => abrirModalPagamento(m)} disabled={!caixa}>
                              <ArrowDownCircle className="w-3.5 h-3.5" />Registrar pagamento
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
                        <TableCell className="font-medium">{p.mensalidade?.aluno?.usuario?.nomeCompleto ?? '—'}</TableCell>
                        <TableCell className="text-cinza-texto">{p.mensalidade?.plano?.nome ?? '—'}</TableCell>
                        <TableCell className="font-semibold text-green-700">{formatarValor(p.valor)}</TableCell>
                        <TableCell className="text-cinza-texto">{METODOS_PAGAMENTO.find(m => m.value === p.metodoPagamento)?.label ?? p.metodoPagamento}</TableCell>
                        <TableCell className="text-cinza-texto">{formatarData(p.dataPagamento)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal: Abrir Caixa */}
      <Dialog open={modalCaixaAbrir} onOpenChange={(v) => !v && setModalCaixaAbrir(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Abrir Caixa</DialogTitle></DialogHeader>
          <form onSubmit={formCaixa.handleSubmit(onAbrirCaixa)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Saldo inicial (R$)</Label>
              <Input type="number" step="0.01" min="0" {...formCaixa.register('saldoAbertura', { valueAsNumber: true })} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalCaixaAbrir(false)}>Cancelar</Button>
              <Button type="submit" disabled={abrirCaixa.isPending}>Abrir</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmar fechar caixa */}
      <AlertDialog open={modalFecharCaixa} onOpenChange={setModalFecharCaixa}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Fechar caixa?</AlertDialogTitle>
            <AlertDialogDescription>O caixa será fechado e o saldo final será calculado automaticamente.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (caixa) fecharCaixa.mutate(caixa.id); setModalFecharCaixa(false) }} disabled={fecharCaixa.isPending}>
              Fechar caixa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal: Nova Mensalidade */}
      <Dialog open={modalMensalidade} onOpenChange={(v) => !v && setModalMensalidade(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nova Mensalidade</DialogTitle></DialogHeader>
          <form onSubmit={formMensalidade.handleSubmit(onCriarMensalidade as never)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Aluno *</Label>
              <Select onValueChange={(v) => formMensalidade.setValue('alunoId', v)}>
                <SelectTrigger><SelectValue placeholder="Selecione o aluno" /></SelectTrigger>
                <SelectContent>
                  {alunos.filter(a => a.status === 'ATIVO').map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.usuario.nomeCompleto}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Plano *</Label>
              <Select onValueChange={(v) => formMensalidade.setValue('planoId', v)}>
                <SelectTrigger><SelectValue placeholder="Selecione o plano" /></SelectTrigger>
                <SelectContent>
                  {planos.filter(p => p.ativo).map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.nome} — {formatarValor(p.valor)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Valor (R$) *</Label>
                <Input type="number" step="0.01" min="0" {...formMensalidade.register('valor', { valueAsNumber: true })} />
              </div>
              <div className="space-y-1.5">
                <Label>Vencimento *</Label>
                <Input type="date" {...formMensalidade.register('vencimento')} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalMensalidade(false)}>Cancelar</Button>
              <Button type="submit" disabled={createMensalidade.isPending}>Criar</Button>
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
                {modalPagamento.aluno.usuario.nomeCompleto} — {modalPagamento.plano.nome}
              </p>
            )}
          </DialogHeader>
          {!caixa && (
            <p className="text-sm text-amber-600 bg-amber-50 rounded p-2">Abra o caixa antes de registrar pagamentos.</p>
          )}
          <form onSubmit={formPagamento.handleSubmit(onRegistrarPagamento as never)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Valor (R$) *</Label>
                <Input type="number" step="0.01" min="0" {...formPagamento.register('valor', { valueAsNumber: true })} />
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
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {METODOS_PAGAMENTO.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalPagamento(null)}>Cancelar</Button>
              <Button type="submit" disabled={registrarPagamento.isPending || !caixa}>Confirmar pagamento</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
