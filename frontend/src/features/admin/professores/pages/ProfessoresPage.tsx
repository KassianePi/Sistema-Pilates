import { useState } from 'react'
import { Plus, Search, Pencil, Trash2, UserCheck, PowerOff, Power } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ProfessorFormModal } from '../components/ProfessorFormModal'
import { useProfessores, useDeleteProfessor, useAlterarStatusProfessor } from '../hooks/useProfessores'
import { useDebounce } from '@/hooks/useDebounce'
import type { Professor } from '@/types/domain.types'

export function ProfessoresPage() {
  const [busca, setBusca] = useState('')
  const [pagina, setPagina] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [professorEditando, setProfessorEditando] = useState<Professor | null>(null)
  const [professorExcluindo, setProfessorExcluindo] = useState<Professor | null>(null)
  const [professorAlterandoStatus, setProfessorAlterandoStatus] = useState<Professor | null>(null)

  const buscaDebounced = useDebounce(busca, 400)
  const { data, isLoading } = useProfessores({ busca: buscaDebounced, pagina, limite: 15 })
  const deleteProfessor = useDeleteProfessor()
  const alterarStatus = useAlterarStatusProfessor()

  const professores = data?.data ?? []
  const totalPaginas = data?.totalPaginas ?? 1

  function abrirCriar() {
    setProfessorEditando(null)
    setModalOpen(true)
  }

  async function confirmarExclusao() {
    if (!professorExcluindo) return
    await deleteProfessor.mutateAsync(professorExcluindo.id)
    setProfessorExcluindo(null)
  }

  async function confirmarAlterarStatus() {
    if (!professorAlterandoStatus) return
    await alterarStatus.mutateAsync({
      id: professorAlterandoStatus.id,
      ativo: professorAlterandoStatus.status !== 'ATIVO',
    })
    setProfessorAlterandoStatus(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-cinza-forte">Professores</h1>
          <p className="text-sm text-cinza-texto mt-1">Gerencie os professores do studio.</p>
        </div>
        <Button onClick={abrirCriar}>
          <Plus className="w-4 h-4" />
          Novo professor
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cinza-medio" />
              <Input
                placeholder="Buscar por nome..."
                className="pl-9"
                value={busca}
                onChange={(e) => {
                  setBusca(e.target.value)
                  setPagina(1)
                }}
              />
            </div>
            {data && (
              <span className="text-sm text-cinza-medio whitespace-nowrap">
                {data.total} professor{data.total !== 1 ? 'es' : ''}
              </span>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-16 text-cinza-medio">Carregando...</div>
          ) : professores.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-cinza-medio">
              <UserCheck className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">Nenhum professor encontrado.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Especialidade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {professores.map((professor) => (
                  <TableRow key={professor.id}>
                    <TableCell className="font-medium">{professor.usuario.nomeCompleto}</TableCell>
                    <TableCell className="text-cinza-texto">{professor.usuario.email}</TableCell>
                    <TableCell className="text-cinza-texto">{professor.usuario.telefone ?? '—'}</TableCell>
                    <TableCell className="text-cinza-texto">{professor.especialidade ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant={professor.status === 'ATIVO' ? 'success' : 'destructive'}>
                        {professor.status === 'ATIVO' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setProfessorEditando(professor)
                            setModalOpen(true)
                          }}
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setProfessorAlterandoStatus(professor)}
                          title={professor.status === 'ATIVO' ? 'Inativar professor' : 'Reativar professor'}
                          className={
                            professor.status === 'ATIVO'
                              ? 'hover:text-amber-600 hover:bg-amber-50'
                              : 'hover:text-emerald-600 hover:bg-emerald-50'
                          }
                        >
                          {professor.status === 'ATIVO' ? (
                            <PowerOff className="w-4 h-4" />
                          ) : (
                            <Power className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setProfessorExcluindo(professor)}
                          title="Excluir"
                          className="hover:text-red-600 hover:bg-red-50"
                        >
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
              <Button variant="outline" size="sm" onClick={() => setPagina((p) => p - 1)} disabled={pagina === 1}>
                Anterior
              </Button>
              <span className="text-sm text-cinza-texto">
                Página {pagina} de {totalPaginas}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagina((p) => p + 1)}
                disabled={pagina === totalPaginas}
              >
                Próxima
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <ProfessorFormModal open={modalOpen} onClose={() => setModalOpen(false)} professor={professorEditando} />

      <AlertDialog open={!!professorAlterandoStatus} onOpenChange={(v) => !v && setProfessorAlterandoStatus(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {professorAlterandoStatus?.status === 'ATIVO' ? 'Inativar professor?' : 'Reativar professor?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {professorAlterandoStatus?.status === 'ATIVO' ? (
                <>
                  O professor <strong>{professorAlterandoStatus?.usuario.nomeCompleto}</strong> não poderá mais acessar
                  o painel. Você pode reativá-lo a qualquer momento.
                </>
              ) : (
                <>
                  O professor <strong>{professorAlterandoStatus?.usuario.nomeCompleto}</strong> voltará a ter acesso ao
                  painel.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmarAlterarStatus}
              disabled={alterarStatus.isPending}
              className={
                professorAlterandoStatus?.status === 'ATIVO'
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }
            >
              {alterarStatus.isPending
                ? 'Aguarde...'
                : professorAlterandoStatus?.status === 'ATIVO'
                  ? 'Inativar'
                  : 'Reativar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!professorExcluindo} onOpenChange={(v) => !v && setProfessorExcluindo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover professor?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá permanentemente <strong>{professorExcluindo?.usuario.nomeCompleto}</strong> do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarExclusao} disabled={deleteProfessor.isPending}>
              {deleteProfessor.isPending ? 'Removendo...' : 'Remover'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
