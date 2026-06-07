import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { professoresService, type CreateProfessorDTO, type UpdateProfessorDTO } from '@/services/professores.service'

const QUERY_KEY = 'professores'

export function useProfessores(params?: { pagina?: number; limite?: number; busca?: string }) {
  return useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: () => professoresService.listar(params),
  })
}

export function useCreateProfessor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateProfessorDTO) => professoresService.criar(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] })
      toast.success('Professor cadastrado com sucesso!')
    },
    onError: () => toast.error('Erro ao cadastrar professor.'),
  })
}

export function useUpdateProfessor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateProfessorDTO }) => professoresService.atualizar(id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] })
      toast.success('Professor atualizado com sucesso!')
    },
    onError: () => toast.error('Erro ao atualizar professor.'),
  })
}

export function useDeleteProfessor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => professoresService.excluir(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] })
      toast.success('Professor removido com sucesso.')
    },
    onError: () => toast.error('Erro ao remover professor.'),
  })
}

export function useAlterarStatusProfessor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) => professoresService.alterarStatus(id, ativo),
    onSuccess: (_, { ativo }) => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] })
      toast.success(ativo ? 'Professor reativado com sucesso.' : 'Professor inativado com sucesso.')
    },
    onError: () => toast.error('Erro ao alterar status do professor.'),
  })
}
