import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'

interface JustificativaModalProps {
  open: boolean
  onClose: () => void
  titulo: string
  descricao?: string
  confirmLabel: string
  destructive?: boolean
  pending?: boolean
  onConfirm: (justificativa: string) => void
}

const MIN_CHARS = 5

/**
 * Modal genérico para ações de agenda que exigem justificativa
 * (suspender, cancelar, excluir). A justificativa é obrigatória.
 */
export function JustificativaModal({
  open, onClose, titulo, descricao, confirmLabel, destructive, pending, onConfirm,
}: JustificativaModalProps) {
  const [justificativa, setJustificativa] = useState('')
  const [tocado, setTocado] = useState(false)

  useEffect(() => {
    if (open) { setJustificativa(''); setTocado(false) }
  }, [open])

  const invalido = justificativa.trim().length < MIN_CHARS

  function confirmar() {
    setTocado(true)
    if (invalido) return
    onConfirm(justificativa.trim())
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
        </DialogHeader>
        {descricao && <p className="text-sm text-cinza-texto -mt-1">{descricao}</p>}
        <div className="space-y-1.5 mt-2">
          <Label>Justificativa <span className="text-rosa-vibrante">*</span></Label>
          <Textarea
            rows={3}
            value={justificativa}
            onChange={(e) => setJustificativa(e.target.value)}
            placeholder="Informe o motivo desta alteração (visível ao aluno)."
            autoFocus
          />
          {tocado && invalido && (
            <p className="text-xs text-rosa-vibrante">Descreva o motivo (mín. {MIN_CHARS} caracteres).</p>
          )}
        </div>
        <DialogFooter className="mt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            type="button"
            variant={destructive ? 'destructive' : 'default'}
            onClick={confirmar}
            disabled={pending}
          >
            {pending ? 'Processando...' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
