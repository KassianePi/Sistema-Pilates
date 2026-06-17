import { CalendarDays, Clock, User, MapPin, AlertCircle, CalendarClock } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from './StatusBadge'
import { formatarDataLonga, formatarDataHora } from '../utils/format'
import type { Aula } from '@/types/domain.types'

const STATUS_ALTERADO = ['CANCELADA', 'SUSPENSA', 'EXCLUIDA', 'ADIADA']

function Linha({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-sm text-cinza-texto">
      <Icon className="w-4 h-4 text-cinza-texto shrink-0" />
      <span>{children}</span>
    </div>
  )
}

export function DetalheAulaModal({ aula, onClose }: { aula: Aula | null; onClose: () => void }) {
  if (!aula) return null
  const alterada = STATUS_ALTERADO.includes(aula.status) || !!aula.dataHoraAnterior

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 pr-6">
            <CalendarDays className="w-4 h-4 text-roxo-profundo" /> {aula.titulo}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 mt-1">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge domain="aula" status={aula.status} />
            {aula.modalidade?.nome && <Badge variant="secondary">{aula.modalidade.nome}</Badge>}
            <Badge variant="outline">{aula.tipo}</Badge>
          </div>

          <div className="space-y-2">
            <Linha icon={CalendarDays}><span className="capitalize">{formatarDataLonga(aula.data)}</span></Linha>
            <Linha icon={Clock}>{aula.horaInicio} – {aula.horaFim}</Linha>
            <Linha icon={User}>{aula.professor.usuario.nomeCompleto}</Linha>
            {aula.sala && <Linha icon={MapPin}>{aula.sala}</Linha>}
          </div>

          {aula.dataHoraAnterior && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 flex items-start gap-2">
              <CalendarClock className="w-4 h-4 mt-0.5 shrink-0" />
              <span>Reagendada de <strong>{formatarDataHora(aula.dataHoraAnterior)}</strong> para <strong>{formatarDataHora(`${aula.data}T${aula.horaInicio}`)}</strong>.</span>
            </div>
          )}

          {alterada && aula.justificativa && (
            <div className="rounded-lg border border-rosa-vibrante/30 bg-rosa-vibrante/5 p-3 text-sm">
              <p className="font-medium text-cinza-forte flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rosa-vibrante" /> Justificativa do studio
              </p>
              <p className="text-cinza-texto mt-1">{aula.justificativa}</p>
            </div>
          )}

          {aula.observacoes && (
            <div className="rounded-lg border border-bege-cartao bg-bege-suave/40 p-3 text-sm">
              <p className="font-medium text-cinza-forte">Observações</p>
              <p className="text-cinza-texto mt-1">{aula.observacoes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
