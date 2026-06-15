import type { MensalidadeAluno, ComprovanteAluno } from './tipos'

export type TipoEventoFinanceiro =
  | 'MENSALIDADE_GERADA'
  | 'COMPROVANTE_ENVIADO'
  | 'COMPROVANTE_APROVADO'
  | 'COMPROVANTE_REJEITADO'
  | 'PAGAMENTO_CONFIRMADO'

export interface EventoFinanceiro {
  id: string
  tipo: TipoEventoFinanceiro
  data: string // ISO
  titulo: string
  descricao?: string
}

function tempo(d?: string | null): number {
  if (!d) return 0
  const t = new Date(d).getTime()
  return isNaN(t) ? 0 : t
}

/**
 * Monta a linha do tempo financeira a partir dos dados já carregados
 * (mensalidades + seus pagamentos embutidos + comprovantes). Sem endpoint novo.
 * Ordenada do evento mais recente para o mais antigo.
 */
export function montarTimelineFinanceira(params: {
  mensalidades: MensalidadeAluno[]
  comprovantes: ComprovanteAluno[]
  limite?: number
}): EventoFinanceiro[] {
  const { mensalidades, comprovantes, limite = 15 } = params
  const eventos: EventoFinanceiro[] = []

  for (const m of mensalidades) {
    const plano = m?.plano?.nome ?? 'Avulso'
    const criadoEm = m.criadoEm ?? m.vencimento
    if (criadoEm) {
      eventos.push({
        id: `mens-${m.id}`,
        tipo: 'MENSALIDADE_GERADA',
        data: criadoEm,
        titulo: 'Mensalidade gerada',
        descricao: plano,
      })
    }
    for (const p of m.pagamentos ?? []) {
      if (p?.dataPagamento) {
        eventos.push({
          id: `pag-${p.id}`,
          tipo: 'PAGAMENTO_CONFIRMADO',
          data: p.dataPagamento,
          titulo: 'Pagamento confirmado',
          descricao: plano,
        })
      }
    }
  }

  for (const c of comprovantes) {
    const plano = c?.mensalidade?.plano?.nome ?? 'Avulso'
    if (c?.dataEnvio) {
      eventos.push({
        id: `comp-env-${c.id}`,
        tipo: 'COMPROVANTE_ENVIADO',
        data: c.dataEnvio,
        titulo: 'Comprovante enviado',
        descricao: plano,
      })
    }
    if (c?.status === 'APROVADO') {
      eventos.push({
        id: `comp-apr-${c.id}`,
        tipo: 'COMPROVANTE_APROVADO',
        data: c.atualizadoEm ?? c.dataEnvio,
        titulo: 'Comprovante aprovado',
        descricao: plano,
      })
    }
    if (c?.status === 'REJEITADO') {
      eventos.push({
        id: `comp-rej-${c.id}`,
        tipo: 'COMPROVANTE_REJEITADO',
        data: c.atualizadoEm ?? c.dataEnvio,
        titulo: 'Comprovante rejeitado',
        descricao: c.observacoes || plano,
      })
    }
  }

  return eventos.sort((a, b) => tempo(b.data) - tempo(a.data)).slice(0, limite)
}
