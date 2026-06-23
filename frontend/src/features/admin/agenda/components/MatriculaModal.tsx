import { useState } from 'react'
import { UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { SeletorAlunos } from './SeletorAlunos'
import { useInscricoes, useMatricular } from '../hooks/useAgenda'
import type { Aula } from '@/types/domain.types'
import type { AlunoInscrito } from '@/services/agenda.service'

/** Formulário interno: montado só quando os inscritos já carregaram → estado inicial via props (sem efeito). */
function MatriculaForm({ aula, iniciais, onClose }: { aula: Aula; iniciais: string[]; onClose: () => void }) {
  const [selecionados, setSelecionados] = useState<string[]>(() => iniciais)
  const matricular = useMatricular()

  function salvar() {
    matricular.mutate({ aulaId: aula.id, alunoIds: selecionados }, { onSuccess: onClose })
  }

  return (
    <>
      <SeletorAlunos value={selecionados} onChange={setSelecionados} capacidade={aula.vagas} />
      <DialogFooter className="mt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="button" onClick={salvar} disabled={matricular.isPending}>
          {matricular.isPending ? 'Salvando...' : 'Salvar matrículas'}
        </Button>
      </DialogFooter>
    </>
  )
}

export function MatriculaModal({ aula, onClose }: { aula: Aula; onClose: () => void }) {
  const { data: inscritos, isLoading } = useInscricoes(aula.id)

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-lilas-medio" /> Matricular alunos
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-cinza-texto -mt-1">
          {aula.titulo} — {aula.data} às {aula.horaInicio}
        </p>

        {isLoading || !inscritos ? (
          <p className="text-sm text-cinza-medio text-center py-8">Carregando matrículas...</p>
        ) : (
          <MatriculaForm aula={aula} iniciais={(inscritos as AlunoInscrito[]).map((a) => a.id)} onClose={onClose} />
        )}
      </DialogContent>
    </Dialog>
  )
}
