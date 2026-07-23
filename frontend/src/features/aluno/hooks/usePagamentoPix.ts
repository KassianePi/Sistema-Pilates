import { useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { pagamentosPixService } from '@/services/pagamentosPix.service'
import { mensagemErro } from '../utils/erro'
import { mapearEstadoPagamentoPix } from '../utils/mapearEstadoPagamentoPix'
import { registrarEventoPix } from '../utils/pixEventos'
import { useCountdown } from './useCountdown'
import { PIX_POLLING_INTERVAL_MS } from '../constants/pagamentoPix'
import type { PagamentoPixState } from '../utils/tipos'
import type { PagamentoPix } from '@/services/pagamentosPix.service'

function queryKey(mensalidadeId: string) {
  return ['pix-cobranca', mensalidadeId] as const
}

/**
 * Orquestra o fluxo de pagamento PIX de uma mensalidade: leitura com polling
 * de rotina (nunca chama o Mercado Pago) + sincronização explícita (que
 * reconcilia de verdade com o gateway) nos momentos em que isso importa —
 * mount, retorno de aba, countdown zerado e ação manual.
 */
export function usePagamentoPix(mensalidadeId: string | null) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: queryKey(mensalidadeId ?? 'nenhuma'),
    queryFn: () => pagamentosPixService.consultarCobranca(mensalidadeId as string),
    enabled: !!mensalidadeId,
    refetchInterval: (q) => {
      const data = q.state.data as PagamentoPix | null | undefined
      return data?.status === 'PENDENTE' ? PIX_POLLING_INTERVAL_MS : false
    },
    refetchIntervalInBackground: false,
  })

  const sincronizar = useMutation({
    mutationFn: () => pagamentosPixService.sincronizarCobranca(mensalidadeId as string),
    onSuccess: (data) => {
      if (!mensalidadeId) return
      queryClient.setQueryData(queryKey(mensalidadeId), data)
      registrarEventoPix({ tipo: 'pix_sincronizado', mensalidadeId, statusResultante: data?.status ?? 'sem-cobranca' })
    },
    onError: (err) => {
      if (!mensalidadeId) return
      registrarEventoPix({ tipo: 'pix_erro_consulta', mensalidadeId, erro: mensagemErro(err, 'erro desconhecido') })
    },
  })

  const gerar = useMutation({
    mutationFn: () => pagamentosPixService.gerarCobranca(mensalidadeId as string),
    onSuccess: (data) => {
      if (!mensalidadeId) return
      queryClient.setQueryData(queryKey(mensalidadeId), data)
      registrarEventoPix({ tipo: 'pix_gerado', mensalidadeId })
    },
    onError: (err) => {
      toast.error(mensagemErro(err, 'Erro ao gerar cobrança PIX.'))
      if (!mensalidadeId) return
      registrarEventoPix({ tipo: 'pix_erro_gerar', mensalidadeId, erro: mensagemErro(err, 'erro desconhecido') })
    },
  })

  const pagamento = query.data ?? null
  const countdown = useCountdown(pagamento?.status === 'PENDENTE' ? pagamento.expiraEm : null)

  // Sempre a versão mais recente das mutations, sem precisar listá-las nas dependências dos efeitos abaixo.
  const sincronizarRef = useRef(sincronizar.mutate)
  useEffect(() => {
    sincronizarRef.current = sincronizar.mutate
  })

  // 1) Sincroniza no mount (ou ao trocar de mensalidade) — cobre "fechei o navegador e voltei horas depois".
  useEffect(() => {
    if (mensalidadeId) sincronizarRef.current()
  }, [mensalidadeId])

  // 2) Sincroniza ao voltar para a aba.
  useEffect(() => {
    function aoMudarVisibilidade() {
      if (document.visibilityState === 'visible' && mensalidadeId) {
        sincronizarRef.current()
      }
    }
    document.addEventListener('visibilitychange', aoMudarVisibilidade)
    return () => document.removeEventListener('visibilitychange', aoMudarVisibilidade)
  }, [mensalidadeId])

  // 3) Countdown chegou a zero: nunca decide sozinho, só pede a confirmação oficial ao servidor.
  const jaConfirmouExpiracao = useRef(false)
  useEffect(() => {
    if (pagamento?.status !== 'PENDENTE') {
      jaConfirmouExpiracao.current = false
      return
    }
    if (countdown.expirado && !jaConfirmouExpiracao.current) {
      jaConfirmouExpiracao.current = true
      sincronizarRef.current()
    }
  }, [countdown.expirado, pagamento?.status])

  // 4) Transição para aprovado: toast + atualiza KPIs/histórico de mensalidades (uma vez só).
  const statusAnteriorRef = useRef<string | null>(null)
  useEffect(() => {
    if (pagamento?.status === 'APROVADO' && statusAnteriorRef.current !== 'APROVADO') {
      toast.success('Pagamento confirmado! Sua mensalidade foi quitada.')
      if (mensalidadeId) registrarEventoPix({ tipo: 'pix_aprovado', mensalidadeId })
      queryClient.invalidateQueries({ queryKey: ['mensalidades-aluno'] })
    }
    statusAnteriorRef.current = pagamento?.status ?? null
  }, [pagamento?.status, mensalidadeId, queryClient])

  const estado: PagamentoPixState = mapearEstadoPagamentoPix({
    pagamento,
    isLoading: query.isLoading,
    isGenerating: gerar.isPending,
    isError: query.isError,
    countdownExpirado: countdown.expirado,
  })

  return {
    estado,
    pagamento,
    countdown,
    gerar: () => gerar.mutate(),
    sincronizarAgora: () => sincronizar.mutate(),
    sincronizando: sincronizar.isPending,
  }
}
