import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { evolucoesService } from '@/services/evolucoes.service'

export function useEvolucoesDoAluno(alunoId: string | null) {
  return useQuery({
    queryKey: ['evolucoes', alunoId],
    queryFn: () => evolucoesService.listar({ alunoId: alunoId as string, limit: 50 }),
    enabled: !!alunoId,
  })
}

export function useCriarEvolucao() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: { alunoId: string; aulaId: string; observacao: string }) => evolucoesService.criar(dto),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['evolucoes', variables.alunoId] })
      toast.success('Evolução registrada!')
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Erro ao registrar evolução'),
  })
}
