import { useMemo, useState } from 'react'
import { Search, CheckSquare2, Square, Users } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useAlunos } from '@/features/admin/alunos/hooks/useAlunos'

interface SeletorAlunosProps {
  value: string[]
  onChange: (ids: string[]) => void
  capacidade: number
}

/** Seleção de alunos matriculados (busca, multisseleção, todos os ativos, contador e trava de capacidade). */
export function SeletorAlunos({ value, onChange, capacidade }: SeletorAlunosProps) {
  const [busca, setBusca] = useState('')
  const { data: alunosData, isLoading } = useAlunos({ limite: 200 })

  const alunos = useMemo(() => (alunosData?.data ?? []).filter((a) => a.status === 'ATIVO'), [alunosData])
  const filtrados = useMemo(
    () => alunos.filter((a) => a.usuario.nomeCompleto.toLowerCase().includes(busca.trim().toLowerCase())),
    [alunos, busca],
  )

  const selecionados = new Set(value)
  const atingiuCapacidade = value.length >= capacidade

  function toggle(id: string) {
    if (selecionados.has(id)) {
      onChange(value.filter((x) => x !== id))
    } else if (!atingiuCapacidade) {
      onChange([...value, id])
    }
  }

  function selecionarTodos() {
    onChange(alunos.map((a) => a.id).slice(0, capacidade))
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cinza-medio" />
          <Input
            placeholder="Buscar aluno..."
            className="pl-9 h-9"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <Button type="button" variant="outline" size="sm" onClick={selecionarTodos} disabled={alunos.length === 0}>
          <Users className="w-3.5 h-3.5 mr-1" /> Todos os ativos
        </Button>
        <Badge variant={atingiuCapacidade ? 'warning' : 'secondary'}>
          {value.length} / {capacidade} vagas
        </Badge>
      </div>

      <div className="max-h-64 overflow-y-auto divide-y divide-bege-cartao border border-bege-cartao rounded-md">
        {isLoading ? (
          <p className="text-sm text-cinza-medio text-center py-6">Carregando...</p>
        ) : filtrados.length === 0 ? (
          <p className="text-sm text-cinza-medio text-center py-6">Nenhum aluno encontrado.</p>
        ) : (
          filtrados.map((aluno) => {
            const marcado = selecionados.has(aluno.id)
            const bloqueado = !marcado && atingiuCapacidade
            return (
              <button
                key={aluno.id}
                type="button"
                onClick={() => toggle(aluno.id)}
                disabled={bloqueado}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                  marcado ? 'bg-lilas-claro/40 hover:bg-lilas-claro/60' : 'hover:bg-bege-suave',
                  bloqueado && 'opacity-40 cursor-not-allowed',
                )}
              >
                {marcado ? (
                  <CheckSquare2 className="w-5 h-5 text-roxo-profundo flex-shrink-0" />
                ) : (
                  <Square className="w-5 h-5 text-cinza-medio flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <p
                    className={cn('text-sm font-medium truncate', marcado ? 'text-roxo-profundo' : 'text-cinza-forte')}
                  >
                    {aluno.usuario.nomeCompleto}
                  </p>
                  {aluno.planoAtual && <p className="text-xs text-cinza-medio truncate">{aluno.planoAtual.nome}</p>}
                </div>
              </button>
            )
          })
        )}
      </div>
      {atingiuCapacidade && (
        <p className="text-xs text-amber-600">
          Capacidade máxima atingida. Remova um aluno para adicionar outro ou aumente a capacidade da aula.
        </p>
      )}
    </div>
  )
}
