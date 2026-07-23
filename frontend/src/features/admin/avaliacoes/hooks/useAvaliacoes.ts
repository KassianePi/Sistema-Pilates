import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { avaliacoesService, type CriarAvaliacaoDTO, type AtualizarAvaliacaoDTO } from '@/services/avaliacoes.service'

export function useAvaliacoesDoAluno(alunoId: string | null) {
  return useQuery({
    queryKey: ['avaliacoes', alunoId],
    queryFn: () => avaliacoesService.listar({ alunoId: alunoId as string, limit: 50 }),
    enabled: !!alunoId,
  })
}

export function useCriarAvaliacao() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CriarAvaliacaoDTO) => avaliacoesService.criar(dto),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['avaliacoes', variables.alunoId] })
      toast.success('Avaliação registrada!')
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Erro ao registrar avaliação'),
  })
}

export function useAtualizarAvaliacao(alunoId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: AtualizarAvaliacaoDTO }) => avaliacoesService.atualizar(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avaliacoes', alunoId] })
      toast.success('Avaliação atualizada!')
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Erro ao atualizar avaliação'),
  })
}

export function useExcluirAvaliacao(alunoId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => avaliacoesService.excluir(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avaliacoes', alunoId] })
      toast.success('Avaliação excluída!')
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Erro ao excluir avaliação'),
  })
}
