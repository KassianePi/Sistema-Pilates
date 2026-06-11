import { useState } from 'react'
import { Plus, Search, Pencil, X, CalendarDays, Users, Zap, ClipboardCheck } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { AulaFormModal } from '../components/AulaFormModal'
import { PresencaModal } from '../components/PresencaModal'
import { useAulas, useCancelarAula } from '../hooks/useAgenda'
import { useAlunos } from '@/features/admin/alunos/hooks/useAlunos'
import { useCreateMensalidade } from '@/features/admin/financeiro/hooks/useFinanceiro'
import type { Aula, StatusAula } from '@/types/domain.types'

const avulsoSchema = z.object({
  alunoId: z.string().min(1, 'Selecione um aluno'),
  valor: z.number().positive('Informe o valor'),
  vencimento: z.string().min(1, 'Informe a data'),
})

const STATUS_BADGE: Record<StatusAula, { label: string; variant: 'success' | 'warning' | 'destructive' | 'outline' }> = {
  AGENDADA: { label: 'Agendada', variant: 'secondary' as never },
  REALIZADA: { label: 'Realizada', variant: 'success' },
  CANCELADA: { label: 'Cancelada', variant: 'destructive' },
  ADIADA: { label: 'Adiada', variant: 'warning' },
}

function formatarData(data: string) {
  return new Date(data).toLocaleDateString('pt-BR')
}

export function AgendaPage() {
  const [filtroData, setFiltroData] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [pagina, setPagina] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [aulaEditando, setAulaEditando] = useState<Aula | null>(null)
  const [aulaCancelando, setAulaCancelando] = useState<Aula | null>(null)
  const [modalAvulso, setModalAvulso] = useState(false)
  const [aulaPresenca, setAulaPresenca] = useState<Aula | null>(null)

  const { data, isLoading } = useAulas({
    data: filtroData || undefined,
    status: filtroStatus || undefined,
    pagina,
    limite: 15,
  })
  const cancelarAula = useCancelarAula()
  const createMensalidade = useCreateMensalidade()
  const { data: alunosData } = useAlunos({ limite: 200 })
  const alunos = (alunosData?.data ?? []).filter((a) => a.status !== 'INATIVO' && a.status !== 'FORMADO')

  const [alunoIdAvulso, setAlunoIdAvulso] = useState('')

  const formAvulso = useForm<z.infer<typeof avulsoSchema>>({
    resolver: zodResolver(avulsoSchema),
    defaultValues: { alunoId: '', valor: 0, vencimento: new Date().toISOString().split('T')[0] },
  })

  const aulas = data?.data ?? []
  const totalPaginas = data?.totalPaginas ?? 1

  function abrirCriar() {
    setAulaEditando(null)
    setModalOpen(true)
  }

  async function confirmarCancelamento() {
    if (!aulaCancelando) return
    await cancelarAula.mutateAsync({ id: aulaCancelando.id })
    setAulaCancelando(null)
  }

  function fecharModalAvulso() {
    setModalAvulso(false)
    setAlunoIdAvulso('')
    formAvulso.reset({ alunoId: undefined, valor: 0, vencimento: new Date().toISOString().split('T')[0] })
  }

  async function onCriarAvulso(values: z.infer<typeof avulsoSchema>) {
    await createMensalidade.mutateAsync({
      tipo: 'AVULSO',
      alunoId: values.alunoId,
      valor: values.valor,
      vencimento: values.vencimento,
    })
    fecharModalAvulso()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-cinza-forte">Agenda</h1>
          <p className="text-sm text-cinza-texto mt-1">Gerencie as aulas do studio.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setModalAvulso(true)}>
            <Zap className="w-4 h-4" />
            Aula avulsa
          </Button>
          <Button onClick={abrirCriar}>
            <Plus className="w-4 h-4" />
            Nova aula
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cinza-medio" />
              <Input
                type="date"
                className="pl-9 w-48"
                value={filtroData}
                onChange={(e) => { setFiltroData(e.target.value); setPagina(1) }}
                title="Filtrar por data"
              />
            </div>

            <Select value={filtroStatus || 'all'} onValueChange={(v) => { setFiltroStatus(v === 'all' ? '' : v); setPagina(1) }}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="AGENDADA">Agendada</SelectItem>
                <SelectItem value="REALIZADA">Realizada</SelectItem>
                <SelectItem value="CANCELADA">Cancelada</SelectItem>
              </SelectContent>
            </Select>

            {(filtroData || filtroStatus) && (
              <Button variant="ghost" size="sm" onClick={() => { setFiltroData(''); setFiltroStatus('') }}>
                <X className="w-3 h-3 mr-1" />Limpar filtros
              </Button>
            )}

            {data && <span className="text-sm text-cinza-medio ml-auto">{data.total} aula{data.total !== 1 ? 's' : ''}</span>}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-16 text-cinza-medio">Carregando...</div>
          ) : aulas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-cinza-medio">
              <CalendarDays className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">Nenhuma aula encontrada.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Horário</TableHead>
                  <TableHead>Professor</TableHead>
                  <TableHead>Vagas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {aulas.map((aula) => (
                  <TableRow key={aula.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{aula.titulo}</p>
                        <p className="text-xs text-cinza-medio">
                          {aula.modalidade?.nome ? `${aula.modalidade.nome} · ` : ''}{aula.tipo}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-cinza-texto">{formatarData(aula.data)}</TableCell>
                    <TableCell className="text-cinza-texto">{aula.horaInicio} – {aula.horaFim}</TableCell>
                    <TableCell className="text-cinza-texto">{aula.professor.usuario.nomeCompleto}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Users className="w-3.5 h-3.5 text-cinza-medio" />
                        <span className={aula.vagasOcupadas >= aula.vagas ? 'text-red-600 font-medium' : ''}>
                          {aula.vagasOcupadas}/{aula.vagas}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_BADGE[aula.status].variant}>
                        {STATUS_BADGE[aula.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {(aula.status === 'AGENDADA' || aula.status === 'REALIZADA') && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setAulaPresenca(aula)}
                            title="Registrar presenças"
                            className="hover:text-green-700 hover:bg-green-50"
                          >
                            <ClipboardCheck className="w-4 h-4" />
                          </Button>
                        )}
                        {aula.status === 'AGENDADA' && (
                          <>
                            <Button size="icon" variant="ghost" onClick={() => { setAulaEditando(aula); setModalOpen(true) }} title="Editar">
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => setAulaCancelando(aula)} title="Cancelar aula"
                              className="hover:text-red-600 hover:bg-red-50">
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
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

      <AulaFormModal open={modalOpen} onClose={() => setModalOpen(false)} aula={aulaEditando} />

      <PresencaModal aula={aulaPresenca} onClose={() => setAulaPresenca(null)} />

      {/* Modal: Cobrança Avulsa */}
      <Dialog open={modalAvulso} onOpenChange={(v) => !v && fecharModalAvulso()}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-lilas-medio" /> Registrar Aula Avulsa
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-cinza-texto -mt-2 mb-2">
            Cria uma cobrança avulsa para aluno sem plano mensal.
          </p>
          <form onSubmit={formAvulso.handleSubmit(onCriarAvulso as never)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Aluno *</Label>
              <Select
                value={alunoIdAvulso}
                onValueChange={(v) => {
                  setAlunoIdAvulso(v)
                  formAvulso.setValue('alunoId', v, { shouldValidate: true })
                }}
              >
                <SelectTrigger><SelectValue placeholder="Selecione o aluno" /></SelectTrigger>
                <SelectContent>
                  {alunos.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.usuario.nomeCompleto}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formAvulso.formState.errors.alunoId && (
                <p className="text-xs text-rosa-vibrante">{formAvulso.formState.errors.alunoId.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Valor (R$) *</Label>
                <Input type="number" step="0.01" min="0" {...formAvulso.register('valor', { valueAsNumber: true })} />
                {formAvulso.formState.errors.valor && (
                  <p className="text-xs text-rosa-vibrante">{formAvulso.formState.errors.valor.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Data *</Label>
                <Input type="date" {...formAvulso.register('vencimento')} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={fecharModalAvulso}>Cancelar</Button>
              <Button type="submit" disabled={createMensalidade.isPending}>Registrar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!aulaCancelando} onOpenChange={(v) => !v && setAulaCancelando(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar aula?</AlertDialogTitle>
            <AlertDialogDescription>
              A aula <strong>{aulaCancelando?.titulo}</strong> do dia {aulaCancelando ? formatarData(aulaCancelando.data) : ''} será cancelada. Os alunos inscritos serão notificados automaticamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarCancelamento} disabled={cancelarAula.isPending}>
              {cancelarAula.isPending ? 'Cancelando...' : 'Cancelar aula'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
