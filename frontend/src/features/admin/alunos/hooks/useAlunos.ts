import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { alunosService, type CreateAlunoDTO, type UpdateAlunoDTO } from '@/services/alunos.service'

const QUERY_KEY = 'alunos'

export function useAlunos(params?: { pagina?: number; limite?: number; busca?: string; status?: string }) {
  return useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: () => alunosService.listar(params),
  })
}

export function useAluno(id: string) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => alunosService.buscarPorId(id),
    enabled: !!id,
  })
}

export function useCreateAluno() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateAlunoDTO) => alunosService.criar(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] })
      toast.success('Aluno cadastrado com sucesso!')
    },
    onError: () => toast.error('Erro ao cadastrar aluno.'),
  })
}

export function useUpdateAluno() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateAlunoDTO }) => alunosService.atualizar(id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] })
      toast.success('Aluno atualizado com sucesso!')
    },
    onError: () => toast.error('Erro ao atualizar aluno.'),
  })
}

export function useDeleteAluno() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => alunosService.excluir(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] })
      toast.success('Aluno removido com sucesso.')
    },
    onError: () => toast.error('Erro ao remover aluno.'),
  })
}
