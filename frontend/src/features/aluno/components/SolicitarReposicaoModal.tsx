import { useState } from 'react'
import { CalendarPlus } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useSolicitarReposicao } from '../hooks/useAlunoReposicoes'

interface SolicitarReposicaoModalProps {
  aulaOriginalId: string
  dataAula: string
  onClose: () => void
}

export function SolicitarReposicaoModal({ aulaOriginalId, dataAula, onClose }: SolicitarReposicaoModalProps) {
  const [motivo, setMotivo] = useState('')
  const solicitar = useSolicitarReposicao()

  function submit() {
    if (!motivo.trim()) return
    solicitar.mutate({ aulaOriginalId, motivo: motivo.trim() }, { onSuccess: onClose })
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarPlus className="w-4 h-4 text-roxo-profundo" /> Solicitar Reposição
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <p className="text-sm text-cinza-texto">
            Aula perdida: <strong className="text-cinza-forte">{dataAula}</strong>. A reposição será agendada pelo
            studio dentro do mesmo mês.
          </p>
          <div className="space-y-1.5">
            <Label>Motivo</Label>
            <Textarea
              rows={3}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex: fiquei doente, imprevisto de trabalho..."
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={submit} disabled={solicitar.isPending || !motivo.trim()}>
              {solicitar.isPending ? 'Enviando...' : 'Solicitar'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
