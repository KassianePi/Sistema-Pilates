import { useState } from 'react'
import { NotebookPen } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useCriarEvolucao } from '../hooks/useEvolucoes'

interface EvolucaoNotaModalProps {
  alunoId: string
  alunoNome: string
  aulaId: string
  onClose: () => void
}

export function EvolucaoNotaModal({ alunoId, alunoNome, aulaId, onClose }: EvolucaoNotaModalProps) {
  const [observacao, setObservacao] = useState('')
  const criar = useCriarEvolucao()

  function submit() {
    if (!observacao.trim()) return
    criar.mutate({ alunoId, aulaId, observacao: observacao.trim() }, { onSuccess: onClose })
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <NotebookPen className="w-4 h-4 text-roxo-profundo" /> Evolução — {alunoNome}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label>Observação da aula</Label>
            <Textarea
              rows={4}
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Como o aluno se saiu nesta aula, evolução observada, orientações..."
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={submit} disabled={criar.isPending || !observacao.trim()}>
              {criar.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
