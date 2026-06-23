import { useState } from 'react'
import { CalendarClock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { formatarData } from '@/lib/datetime'
import type { Aula } from '@/types/domain.types'

interface ReagendarModalProps {
  aula: Aula
  onClose: () => void
  pending?: boolean
  onConfirm: (dataHoraInicio: string, justificativa: string) => void
}

const MIN_CHARS = 5

/**
 * Modal de reagendamento: nova data/hora + justificativa obrigatória.
 *
 * Deve ser montado apenas quando há aula selecionada (ex.: `{aula && <ReagendarModal .../>}`),
 * permitindo inicializar o formulário diretamente das props — sem efeito de sincronização.
 */
export function ReagendarModal({ aula, onClose, pending, onConfirm }: ReagendarModalProps) {
  const [data, setData] = useState(() => aula.data)
  const [hora, setHora] = useState(() => aula.horaInicio)
  const [justificativa, setJustificativa] = useState('')
  const [tocado, setTocado] = useState(false)

  const semData = !data || !hora
  const justInvalida = justificativa.trim().length < MIN_CHARS

  function confirmar() {
    setTocado(true)
    if (semData || justInvalida) return
    const iso = new Date(`${data}T${hora}:00`).toISOString()
    onConfirm(iso, justificativa.trim())
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-lilas-medio" /> Reagendar aula
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-cinza-texto -mt-1">
          {aula.titulo} — atualmente em {formatarData(aula.data)} às {aula.horaInicio}
        </p>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div className="space-y-1.5">
            <Label>
              Nova data <span className="text-rosa-vibrante">*</span>
            </Label>
            <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>
              Novo horário <span className="text-rosa-vibrante">*</span>
            </Label>
            <Input type="time" value={hora} onChange={(e) => setHora(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5 mt-1">
          <Label>
            Justificativa <span className="text-rosa-vibrante">*</span>
          </Label>
          <Textarea
            rows={3}
            value={justificativa}
            onChange={(e) => setJustificativa(e.target.value)}
            placeholder="Motivo do reagendamento (visível ao aluno)."
          />
          {tocado && (semData || justInvalida) && (
            <p className="text-xs text-rosa-vibrante">
              {semData ? 'Informe a nova data e horário. ' : ''}
              {justInvalida ? `Descreva o motivo (mín. ${MIN_CHARS} caracteres).` : ''}
            </p>
          )}
        </div>
        <DialogFooter className="mt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" onClick={confirmar} disabled={pending}>
            {pending ? 'Reagendando...' : 'Reagendar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
