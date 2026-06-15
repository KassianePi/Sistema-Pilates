import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { financeiroService } from '@/services/financeiro.service'
import { estornosService } from '@/services/estornos.service'
import { configuracaoService } from '@/services/configuracao.service'
import { mensagemErro } from '../utils/erro'

// ---------- Queries ----------

export function useMinhasMensalidades(limite = 50) {
  return useQuery({
    queryKey: ['mensalidades-aluno', limite],
    queryFn: () => financeiroService.listarMinhasMensalidades({ limite }),
  })
}

export function useMeusComprovantes() {
  return useQuery({
    queryKey: ['comprovantes-aluno'],
    queryFn: () => financeiroService.listarMeusComprovantes(),
  })
}

export function useMeusEstornos() {
  return useQuery({
    queryKey: ['estornos-aluno'],
    queryFn: () => estornosService.listarMeusEstornos({ limit: 50 }),
  })
}

export function useConfiguracaoStudio() {
  return useQuery({
    queryKey: ['configuracao-studio'],
    queryFn: () => configuracaoService.buscar(),
  })
}

// ---------- Mutations ----------

export function useEnviarComprovante() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: { mensalidadeId: string; arquivo: string; nomeArquivo: string; tipoArquivo: string }) =>
      financeiroService.enviarComprovante(dto),
    onSuccess: () => {
      toast.success('Comprovante enviado! Aguarde a análise do studio.')
      qc.invalidateQueries({ queryKey: ['comprovantes-aluno'] })
      qc.invalidateQueries({ queryKey: ['mensalidades-aluno'] })
    },
    onError: (err) => toast.error(mensagemErro(err, 'Erro ao enviar comprovante.')),
  })
}

export function useNotificarPagamento() {
  return useMutation({
    mutationFn: ({ mensalidadeId, observacoes }: { mensalidadeId: string; observacoes?: string }) =>
      financeiroService.notificarPagamento(mensalidadeId, observacoes),
    onSuccess: () => toast.success('Studio notificado! Aguarde a confirmação do pagamento.'),
    onError: (err) => toast.error(mensagemErro(err, 'Erro ao enviar notificação.')),
  })
}

export function useSolicitarReembolso() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ mensalidadeId, motivo }: { mensalidadeId: string; motivo?: string }) =>
      estornosService.solicitar(mensalidadeId, motivo),
    onSuccess: () => {
      toast.success('Solicitação de reembolso enviada. Aguarde a análise do studio.')
      qc.invalidateQueries({ queryKey: ['estornos-aluno'] })
      qc.invalidateQueries({ queryKey: ['mensalidades-aluno'] })
    },
    onError: (err) => toast.error(mensagemErro(err, 'Erro ao solicitar reembolso.')),
  })
}

export function useSolicitarAvulsa() {
  return useMutation({
    mutationFn: ({ dataDesejada, observacoes }: { dataDesejada?: string; observacoes?: string }) =>
      financeiroService.solicitarAulaAvulsa(dataDesejada, observacoes),
    onSuccess: () => toast.success('Solicitação enviada! O studio entrará em contato para confirmar.'),
    onError: (err) => toast.error(mensagemErro(err, 'Erro ao enviar solicitação.')),
  })
}
