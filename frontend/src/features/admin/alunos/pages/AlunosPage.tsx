import { useState } from 'react'
import { Plus, Search, Pencil, Trash2, UserCheck, UserX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { AlunoFormModal } from '../components/AlunoFormModal'
import { useAlunos, useDeleteAluno } from '../hooks/useAlunos'
import type { Aluno } from '@/types/domain.types'
import { useDebounce } from '@/hooks/useDebounce'

export function AlunosPage() {
  const [busca, setBusca] = useState('')
  const [pagina, setPagina] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [alunoEditando, setAlunoEditando] = useState<Aluno | null>(null)
  const [alunoExcluindo, setAlunoExcluindo] = useState<Aluno | null>(null)

  const buscaDebounced = useDebounce(busca, 400)
  const { data, isLoading } = useAlunos({ busca: buscaDebounced, pagina, limite: 15 })
  const deleteAluno = useDeleteAluno()

  const alunos = data?.data ?? []
  const totalPaginas = data?.totalPaginas ?? 1

  function abrirCriar() {
    setAlunoEditando(null)
    setModalOpen(true)
  }

  function abrirEditar(aluno: Aluno) {
    setAlunoEditando(aluno)
    setModalOpen(true)
  }

  async function confirmarExclusao() {
    if (!alunoExcluindo) return
    await deleteAluno.mutateAsync(alunoExcluindo.id)
    setAlunoExcluindo(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-cinza-forte">Alunos</h1>
          <p className="text-sm text-cinza-texto mt-1">Gerencie os alunos do studio.</p>
        </div>
        <Button onClick={abrirCriar}>
          <Plus className="w-4 h-4" />
          Novo aluno
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cinza-medio" />
              <Input
                placeholder="Buscar por nome ou e-mail..."
                className="pl-9"
                value={busca}
                onChange={(e) => { setBusca(e.target.value); setPagina(1) }}
              />
            </div>
            {data && (
              <span className="text-sm text-cinza-medio whitespace-nowrap">
                {data.total} aluno{data.total !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-16 text-cinza-medio">Carregando...</div>
          ) : alunos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-cinza-medio">
              <UserCheck className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">Nenhum aluno encontrado.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alunos.map((aluno) => (
                  <TableRow key={aluno.id}>
                    <TableCell className="font-medium">{aluno.usuario.nome}</TableCell>
                    <TableCell className="text-cinza-texto">{aluno.usuario.email}</TableCell>
                    <TableCell className="text-cinza-texto">{aluno.usuario.telefone ?? '—'}</TableCell>
                    <TableCell>
                      {aluno.planoAtual
                        ? <Badge variant="secondary">{aluno.planoAtual.nome}</Badge>
                        : <span className="text-cinza-medio text-xs">Sem plano</span>
                      }
                    </TableCell>
                    <TableCell>
                      {aluno.status === 'ATIVO'
                        ? <Badge variant="success"><UserCheck className="w-3 h-3 mr-1" />Ativo</Badge>
                        : <Badge variant="destructive"><UserX className="w-3 h-3 mr-1" />Inativo</Badge>
                      }
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => abrirEditar(aluno)} title="Editar">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setAlunoExcluindo(aluno)} title="Excluir"
                          className="hover:text-red-600 hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {totalPaginas > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-bege-cartao">
              <Button variant="outline" size="sm" onClick={() => setPagina(p => p - 1)} disabled={pagina === 1}>
                Anterior
              </Button>
              <span className="text-sm text-cinza-texto">
                Página {pagina} de {totalPaginas}
              </span>
              <Button variant="outline" size="sm" onClick={() => setPagina(p => p + 1)} disabled={pagina === totalPaginas}>
                Próxima
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <AlunoFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        aluno={alunoEditando}
      />

      <AlertDialog open={!!alunoExcluindo} onOpenChange={(v) => !v && setAlunoExcluindo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover aluno?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá permanentemente <strong>{alunoExcluindo?.usuario.nome}</strong> do sistema. Não é possível desfazer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarExclusao} disabled={deleteAluno.isPending}>
              {deleteAluno.isPending ? 'Removendo...' : 'Remover'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
