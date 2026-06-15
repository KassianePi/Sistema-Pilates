import { useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useSolicitarReembolso } from '../hooks/useAlunoFinanceiro'

interface ReembolsoModalProps {
  mensalidadeId: string
  onClose: () => void
}

export function ReembolsoModal({ mensalidadeId, onClose }: ReembolsoModalProps) {
  const [motivo, setMotivo] = useState('')
  const solicitar = useSolicitarReembolso()

  function submit() {
    solicitar.mutate({ mensalidadeId, motivo: motivo.trim() || undefined }, { onSuccess: onClose })
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-rosa-vibrante" /> Solicitar Reembolso
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 space-y-1">
            <p className="font-medium">Reembolso proporcional</p>
            <p>O valor é calculado pelos dias contratados no plano menos os dias em que você compareceu no mês.</p>
          </div>
          <div className="space-y-1.5">
            <Label>Motivo <span className="text-cinza-medio text-xs">(opcional)</span></Label>
            <Textarea
              placeholder="Descreva o motivo da solicitação..."
              rows={3}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={submit} disabled={solicitar.isPending} className="bg-rosa-vibrante hover:bg-rosa-vibrante/90">
              {solicitar.isPending ? 'Enviando...' : 'Solicitar reembolso'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
