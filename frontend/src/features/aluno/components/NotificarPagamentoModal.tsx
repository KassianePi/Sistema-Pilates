import { useState } from 'react'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useNotificarPagamento } from '../hooks/useAlunoFinanceiro'

interface NotificarPagamentoModalProps {
  mensalidadeId: string
  nomePlano: string
  onClose: () => void
}

export function NotificarPagamentoModal({ mensalidadeId, nomePlano, onClose }: NotificarPagamentoModalProps) {
  const [observacoes, setObservacoes] = useState('')
  const notificar = useNotificarPagamento()

  function submit() {
    notificar.mutate({ mensalidadeId, observacoes: observacoes.trim() || undefined }, { onSuccess: onClose })
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-4 h-4 text-roxo-profundo" /> Avisar que paguei
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="bg-lilas-claro/40 border border-lilas-medio/20 rounded-lg p-3 space-y-1 text-sm">
            <p className="font-medium text-cinza-forte">{nomePlano}</p>
            <p className="text-cinza-texto">Após pagar via PIX, avise o studio. A confirmação é feita manualmente.</p>
          </div>
          <div className="space-y-1.5">
            <Label>
              Observação <span className="text-cinza-texto text-xs">(opcional)</span>
            </Label>
            <Textarea
              placeholder="Ex: PIX enviado às 14h30 de R$ 120,00..."
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
              disabled={notificar.isPending}
              className="bg-roxo-profundo hover:bg-roxo-profundo/90"
            >
              {notificar.isPending ? 'Enviando...' : 'Enviar aviso'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
