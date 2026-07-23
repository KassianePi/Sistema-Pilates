import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { mensalidadesAutomaticasService } from '@/services/mensalidades-automaticas.service'
import { formatResumoExecucao } from '../helpers/formatResumoExecucao'
import { INTERVALO_POLLING_MS } from '../constants/geracaoAutomatica.constants'

/**
 * Dispara a geração automática (real ou dry-run) via uma mutation separada da
 * de salvar configurações. Enquanto está em andamento, faz polling do
 * endpoint de status para alimentar uma barra de progresso simples.
 */
export function useExecutarGeracaoMensalidades() {
  const [emExecucao, setEmExecucao] = useState(false)

  const statusQuery = useQuery({
    queryKey: ['mensalidades-automaticas-status'],
    queryFn: mensalidadesAutomaticasService.buscarStatusExecucao,
    enabled: emExecucao,
    refetchInterval: emExecucao ? INTERVALO_POLLING_MS : false,
  })

  const mutation = useMutation({
    mutationFn: (dryRun: boolean) => mensalidadesAutomaticasService.executarAgora(dryRun),
    onMutate: () => setEmExecucao(true),
    onSuccess: (resumo) => {
      if (resumo.status === 'ERRO') toast.error(formatResumoExecucao(resumo))
      else toast.success(formatResumoExecucao(resumo))
    },
    onError: () => toast.error('Erro ao executar geração automática de mensalidades.'),
    onSettled: () => setEmExecucao(false),
  })

  return {
    executar: (dryRun: boolean) => mutation.mutateAsync(dryRun),
    isExecuting: mutation.isPending,
    progresso: emExecucao ? (statusQuery.data ?? null) : null,
    ultimoResumo: mutation.data ?? null,
  }
}
