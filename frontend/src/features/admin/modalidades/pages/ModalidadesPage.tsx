import { useState } from 'react'
import { Plus, Pencil, Trash2, CheckCircle, XCircle, Layers } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { modalidadesService } from '@/services/modalidades.service'
import type { Modalidade } from '@/types/domain.types'

function ModalModalidade({
  modalidade,
  onClose,
}: {
  modalidade?: Modalidade | null
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const isEditing = !!modalidade
  const [nome, setNome] = useState(modalidade?.nome ?? '')
  const [descricao, setDescricao] = useState(modalidade?.descricao ?? '')

  const mutation = useMutation({
    mutationFn: () =>
      isEditing
        ? modalidadesService.atualizar(modalidade!.id, { nome: nome.trim(), descricao: descricao.trim() || null })
        : modalidadesService.criar({ nome: nome.trim(), descricao: descricao.trim() || null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modalidades'] })
      queryClient.invalidateQueries({ queryKey: ['modalidades-ativas'] })
      toast.success(isEditing ? 'Modalidade atualizada!' : 'Modalidade criada!')
      onClose()
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Erro ao salvar modalidade')
    },
  })

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Modalidade' : 'Nova Modalidade'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label>Nome *</Label>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Reformer, Mat, Cadillac..."
            />
          </div>
          <div className="space-y-1.5">
            <Label>Descrição <span className="text-cinza-medio text-xs">(opcional)</span></Label>
            <Textarea
              rows={2}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Breve descrição da modalidade..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || !nome.trim()}
            >
              {mutation.isPending ? 'Salvando...' : isEditing ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function ModalidadesPage() {
  const queryClient = useQueryClient()
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<Modalidade | null>(null)
  const [excluindo, setExcluindo] = useState<Modalidade | null>(null)

  const { data: modalidades = [], isLoading } = useQuery({
    queryKey: ['modalidades'],
    queryFn: () => modalidadesService.listar(),
  })

  const toggleAtivo = useMutation({
    mutationFn: (m: Modalidade) => modalidadesService.atualizar(m.id, { ativo: !m.ativo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modalidades'] })
      queryClient.invalidateQueries({ queryKey: ['modalidades-ativas'] })
      toast.success('Status atualizado!')
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Erro ao atualizar status'),
  })

  const excluirMutation = useMutation({
    mutationFn: (id: string) => modalidadesService.excluir(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modalidades'] })
      queryClient.invalidateQueries({ queryKey: ['modalidades-ativas'] })
      toast.success('Modalidade excluída!')
      setExcluindo(null)
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Erro ao excluir modalidade')
      setExcluindo(null)
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-cinza-forte">Modalidades de Aula</h1>
          <p className="text-sm text-cinza-texto mt-1">Gerencie os tipos de aula oferecidos pelo studio.</p>
        </div>
        <Button onClick={() => { setEditando(null); setModalAberto(true) }}>
          <Plus className="w-4 h-4 mr-2" /> Nova Modalidade
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Layers className="w-4 h-4 text-roxo-profundo" /> Modalidades cadastradas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-cinza-medio text-sm py-6 text-center">Carregando...</p>
          ) : modalidades.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-cinza-medio">
              <Layers className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">Nenhuma modalidade cadastrada.</p>
            </div>
          ) : (
            <ul className="divide-y divide-bege-cartao">
              {modalidades.map((m) => (
                <li key={m.id} className="flex items-center justify-between py-3 gap-3 flex-wrap">
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-cinza-forte truncate">{m.nome}</p>
                      <Badge variant={m.ativo ? 'success' : 'outline'}>
                        {m.ativo ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </div>
                    {m.descricao && <p className="text-xs text-cinza-texto truncate">{m.descricao}</p>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-cinza-medio hover:text-cinza-forte"
                      onClick={() => toggleAtivo.mutate(m)}
                      title={m.ativo ? 'Desativar' : 'Ativar'}
                    >
                      {m.ativo
                        ? <XCircle className="w-4 h-4 text-amber-500" />
                        : <CheckCircle className="w-4 h-4 text-green-600" />
                      }
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-cinza-medio hover:text-cinza-forte"
                      onClick={() => { setEditando(m); setModalAberto(true) }}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-cinza-medio hover:text-red-600"
                      onClick={() => setExcluindo(m)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {modalAberto && (
        <ModalModalidade
          modalidade={editando}
          onClose={() => { setModalAberto(false); setEditando(null) }}
        />
      )}

      <AlertDialog open={!!excluindo} onOpenChange={(v) => !v && setExcluindo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir modalidade?</AlertDialogTitle>
            <AlertDialogDescription>
              A modalidade <strong>{excluindo?.nome}</strong> será excluída permanentemente. Isso só é possível se nenhuma aula usar esta modalidade.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => excluindo && excluirMutation.mutate(excluindo.id)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
