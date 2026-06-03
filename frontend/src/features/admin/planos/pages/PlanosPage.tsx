import { useState } from 'react'
import { Plus, Pencil, Trash2, CreditCard, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { PlanoFormModal } from '../components/PlanoFormModal'
import { usePlanos, useDeletePlano } from '../hooks/usePlanos'
import type { Plano } from '@/types/domain.types'

function formatarValor(valor: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)
}

export function PlanosPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [planoEditando, setPlanoEditando] = useState<Plano | null>(null)
  const [planoExcluindo, setPlanoExcluindo] = useState<Plano | null>(null)

  const { data, isLoading } = usePlanos({ limite: 50 })
  const deletePlano = useDeletePlano()

  const planos = data?.data ?? []

  function abrirCriar() {
    setPlanoEditando(null)
    setModalOpen(true)
  }

  async function confirmarExclusao() {
    if (!planoExcluindo) return
    await deletePlano.mutateAsync(planoExcluindo.id)
    setPlanoExcluindo(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-cinza-forte">Planos</h1>
          <p className="text-sm text-cinza-texto mt-1">Gerencie os planos disponíveis no studio.</p>
        </div>
        <Button onClick={abrirCriar}>
          <Plus className="w-4 h-4" />
          Novo plano
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          {data && (
            <span className="text-sm text-cinza-medio">{data.total} plano{data.total !== 1 ? 's' : ''} cadastrado{data.total !== 1 ? 's' : ''}</span>
          )}
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-16 text-cinza-medio">Carregando...</div>
          ) : planos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-cinza-medio">
              <CreditCard className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">Nenhum plano cadastrado.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Aulas/semana</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {planos.map((plano) => (
                  <TableRow key={plano.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{plano.nome}</p>
                        {plano.descricao && <p className="text-xs text-cinza-medio mt-0.5">{plano.descricao}</p>}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-cinza-forte">{formatarValor(plano.valor)}</TableCell>
                    <TableCell className="text-cinza-texto">{plano.duracaoMeses} {plano.duracaoMeses === 1 ? 'mês' : 'meses'}</TableCell>
                    <TableCell className="text-cinza-texto">{plano.aulasSemanais}x/semana</TableCell>
                    <TableCell>
                      {plano.ativo
                        ? <Badge variant="success"><CheckCircle2 className="w-3 h-3 mr-1" />Ativo</Badge>
                        : <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Inativo</Badge>
                      }
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => { setPlanoEditando(plano); setModalOpen(true) }} title="Editar">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setPlanoExcluindo(plano)} title="Excluir"
                          className="hover:text-red-600 hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <PlanoFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        plano={planoEditando}
      />

      <AlertDialog open={!!planoExcluindo} onOpenChange={(v) => !v && setPlanoExcluindo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover plano?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá permanentemente o plano <strong>{planoExcluindo?.nome}</strong>. Alunos vinculados a este plano não serão afetados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarExclusao} disabled={deletePlano.isPending}>
              {deletePlano.isPending ? 'Removendo...' : 'Remover'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
