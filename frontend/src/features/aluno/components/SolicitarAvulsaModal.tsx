import { useState } from 'react'
import { Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useSolicitarAvulsa } from '../hooks/useAlunoFinanceiro'

export function SolicitarAvulsaModal({ onClose }: { onClose: () => void }) {
  const [dataDesejada, setDataDesejada] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const solicitar = useSolicitarAvulsa()

  function submit() {
    solicitar.mutate(
      { dataDesejada: dataDesejada || undefined, observacoes: observacoes.trim() || undefined },
      { onSuccess: onClose },
    )
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-lilas-medio" /> Solicitar Aula Avulsa
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <p className="text-sm text-cinza-texto">
            Solicite uma aula avulsa ao studio. O administrador criará a cobrança e confirmará a data.
          </p>
          <div className="space-y-1.5">
            <Label>
              Data desejada <span className="text-cinza-texto text-xs">(opcional)</span>
            </Label>
            <Input
              type="date"
              value={dataDesejada}
              onChange={(e) => setDataDesejada(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div className="space-y-1.5">
            <Label>
              Observação <span className="text-cinza-texto text-xs">(opcional)</span>
            </Label>
            <Textarea
              placeholder="Ex: horário preferido, modalidade, professor..."
              rows={3}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              onClick={submit}
              disabled={solicitar.isPending}
              className="bg-lilas-medio hover:bg-roxo-profundo text-branco-puro"
            >
              {solicitar.isPending ? 'Enviando...' : 'Enviar solicitação'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
