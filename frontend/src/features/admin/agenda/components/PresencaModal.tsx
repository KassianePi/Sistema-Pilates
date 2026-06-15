import { useState } from 'react'
import { CheckSquare2, Square, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { useAlunos } from '@/features/admin/alunos/hooks/useAlunos'
import { useRegistrarPresencasBatch } from '../hooks/useAgenda'
import { formatarData } from '@/lib/datetime'
import type { Aula } from '@/types/domain.types'

interface Props {
  aula: Aula | null
  onClose: () => void
}

export function PresencaModal({ aula, onClose }: Props) {
  const [presentes, setPresentes] = useState<Set<string>>(new Set())
  const { data: alunosData } = useAlunos({ limite: 200 })
  const registrarBatch = useRegistrarPresencasBatch()

  const alunos = (alunosData?.data ?? []).filter((a) => a.status !== 'INATIVO' && a.status !== 'FORMADO')

  function toggle(alunoId: string) {
    setPresentes((prev) => {
      const next = new Set(prev)
      if (next.has(alunoId)) next.delete(alunoId)
      else next.add(alunoId)
      return next
    })
  }

  async function salvar() {
    if (!aula) return
    const presencasList = alunos.map((a) => ({
      alunoId: a.id,
      status: presentes.has(a.id) ? 'PRESENTE' as const : 'AUSENTE' as const,
    }))
    await registrarBatch.mutateAsync({ aulaId: aula.id, presencas: presencasList })
    onClose()
  }

  function handleClose() {
    setPresentes(new Set())
    onClose()
  }

  if (!aula) return null

  const totalPresentes = presentes.size
  const totalAlunos = alunos.length

  return (
    <Dialog open={!!aula} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-4 h-4 text-lilas-medio" />
            Registrar Presenças
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-1 -mt-2 mb-2">
          <p className="text-sm font-medium text-cinza-forte">{aula.titulo}</p>
          <p className="text-xs text-cinza-texto">
            {formatarData(aula.data)} · {aula.horaInicio} – {aula.horaFim}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary">{totalPresentes} presente{totalPresentes !== 1 ? 's' : ''}</Badge>
            <Badge variant="outline">{totalAlunos - totalPresentes} ausente{totalAlunos - totalPresentes !== 1 ? 's' : ''}</Badge>
          </div>
        </div>

        <p className="text-xs text-cinza-medio mb-2">
          Marque os alunos que compareceram. Os não marcados serão registrados como <strong>ausentes</strong>.
        </p>

        <div className="overflow-y-auto flex-1 divide-y divide-bege-cartao border border-bege-cartao rounded-md">
          {alunos.length === 0 ? (
            <p className="text-sm text-cinza-medio text-center py-8">Nenhum aluno ativo encontrado.</p>
          ) : (
            alunos.map((aluno) => {
              const marcado = presentes.has(aluno.id)
              return (
                <button
                  key={aluno.id}
                  type="button"
                  onClick={() => toggle(aluno.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    marcado ? 'bg-green-50 hover:bg-green-100' : 'hover:bg-bege-suave'
                  }`}
                >
                  {marcado
                    ? <CheckSquare2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                    : <Square className="w-5 h-5 text-cinza-medio flex-shrink-0" />
                  }
                  <div className="min-w-0">
                    <p className={`text-sm font-medium truncate ${marcado ? 'text-green-800' : 'text-cinza-forte'}`}>
                      {aluno.usuario.nomeCompleto}
                    </p>
                    {aluno.planoAtual && (
                      <p className="text-xs text-cinza-medio truncate">{aluno.planoAtual.nome}</p>
                    )}
                  </div>
                  {marcado && (
                    <Badge variant="success" className="ml-auto flex-shrink-0">Presente</Badge>
                  )}
                </button>
              )
            })
          )}
        </div>

        <DialogFooter className="mt-4 gap-2">
          <Button type="button" variant="outline" onClick={handleClose}>Cancelar</Button>
          <Button
            type="button"
            onClick={salvar}
            disabled={registrarBatch.isPending || alunos.length === 0}
            className="bg-rosa-vibrante text-branco-puro hover:bg-roxo-profundo"
          >
            {registrarBatch.isPending ? 'Salvando...' : 'Salvar e Finalizar Aula'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
