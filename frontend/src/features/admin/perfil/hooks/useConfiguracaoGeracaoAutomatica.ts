import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { configuracaoService } from '@/services/configuracao.service'
import type { ConfiguracaoStudio } from '@/services/configuracao.service'

/**
 * Configurações da geração automática de mensalidades. Reusa a mesma query
 * ['configuracao-studio'] que a seção de PIX já usa (React Query deduplica
 * por chave, sem requisição extra), mas a mutation de salvar é própria desta
 * seção — cada seção só envia os campos que edita.
 */
export function useConfiguracaoGeracaoAutomatica() {
  const queryClient = useQueryClient()

  const { data: config, isLoading } = useQuery({
    queryKey: ['configuracao-studio'],
    queryFn: configuracaoService.buscar,
  })

  const mutation = useMutation({
    mutationFn: (dados: Pick<ConfiguracaoStudio, 'geracaoAutomaticaAtiva' | 'diasAntesGeracao' | 'maximoMensalidadesFuturas'>) =>
      configuracaoService.salvar(dados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracao-studio'] })
      toast.success('Configurações de geração automática salvas.')
    },
    onError: () => toast.error('Erro ao salvar configurações de geração automática.'),
  })

  return { config, isLoading, salvar: mutation.mutateAsync, isSaving: mutation.isPending }
}
