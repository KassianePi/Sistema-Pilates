import { useMemo, useState } from 'react'
import { CalendarPlus } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAulas } from '@/features/admin/agenda/hooks/useAgenda'
import { useAgendarReposicao } from '../hooks/useReposicoesAdmin'
import { formatarData } from '@/lib/datetime'
import type { Reposicao } from '@/types/domain.types'

interface AgendarReposicaoModalProps {
  reposicao: Reposicao
  onClose: () => void
}

export function AgendarReposicaoModal({ reposicao, onClose }: AgendarReposicaoModalProps) {
  const [aulaReposicaoId, setAulaReposicaoId] = useState('')
  const agendar = useAgendarReposicao()

  const { data } = useAulas({ limite: 200, status: 'AGENDADA' })

  const opcoes = useMemo(() => {
    const aulas = data?.data ?? []
    const mesReferencia = reposicao.aulaOriginal ? new Date(reposicao.aulaOriginal.dataHoraInicio) : null
    if (!mesReferencia) return []
    return aulas.filter((a) => {
      const d = new Date(a.data)
      return (
        d.getFullYear() === mesReferencia.getFullYear() &&
        d.getMonth() === mesReferencia.getMonth() &&
        a.vagasOcupadas < a.vagas
      )
    })
  }, [data, reposicao.aulaOriginal])

  function submit() {
    if (!aulaReposicaoId) return
    agendar.mutate({ id: reposicao.id, aulaReposicaoId }, { onSuccess: onClose })
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarPlus className="w-4 h-4 text-roxo-profundo" /> Agendar Reposição
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="text-sm text-cinza-texto">
            <p>
              Aluno: <strong className="text-cinza-forte">{reposicao.aluno?.usuario.nomeCompleto ?? '—'}</strong>
            </p>
            <p>
              Aula perdida:{' '}
              {reposicao.aulaOriginal ? formatarData(reposicao.aulaOriginal.dataHoraInicio.slice(0, 10)) : '—'}
            </p>
            <p className="mt-1">Motivo: {reposicao.motivo}</p>
          </div>
          <div className="space-y-1.5">
            <Label>Aula de reposição (mesmo mês, com vaga)</Label>
            <Select value={aulaReposicaoId} onValueChange={setAulaReposicaoId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma aula" />
              </SelectTrigger>
              <SelectContent>
                {opcoes.length === 0 ? (
                  <div className="px-2 py-1.5 text-xs text-cinza-medio">Nenhuma aula com vaga neste mês.</div>
                ) : (
                  opcoes.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {formatarData(a.data)} {a.horaInicio} — {a.titulo} ({a.vagasOcupadas}/{a.vagas})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={submit} disabled={agendar.isPending || !aulaReposicaoId}>
              {agendar.isPending ? 'Agendando...' : 'Agendar'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
