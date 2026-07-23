import { api } from './api'
import type { ApiResponse } from '@/types/domain.types'
import type { StatusCobrancaPix } from '@/features/aluno/utils/tipos'

/** Formato cru, exatamente como o backend devolve (ver `pagamentos-pix.types.ts`). */
interface ApiCobrancaPix {
  id: string
  mensalidadeId: string
  status: StatusCobrancaPix
  statusDetail: string | null
  qrCode: string | null
  qrCodeBase64: string | null
  ticketUrl: string | null
  dataExpiracao: string | null
  dataAprovacao: string | null
  valor: string
}

/** Modelo interno do frontend — o resto do app nunca depende do contrato bruto da API. */
export interface PagamentoPix {
  id: string
  mensalidadeId: string
  status: StatusCobrancaPix
  statusDetail: string | null
  qrCode: string | null
  qrCodeImagem: string | null
  ticketUrl: string | null
  expiraEm: Date | null
  aprovadoEm: Date | null
  valor: number
}

function mapCobrancaPix(raw: ApiCobrancaPix): PagamentoPix {
  return {
    id: raw.id,
    mensalidadeId: raw.mensalidadeId,
    status: raw.status,
    statusDetail: raw.statusDetail,
    qrCode: raw.qrCode,
    qrCodeImagem: raw.qrCodeBase64,
    ticketUrl: raw.ticketUrl,
    expiraEm: raw.dataExpiracao ? new Date(raw.dataExpiracao) : null,
    aprovadoEm: raw.dataAprovacao ? new Date(raw.dataAprovacao) : null,
    valor: Number(raw.valor),
  }
}

export const pagamentosPixService = {
  /** Gera (ou reaproveita) a cobrança PIX da mensalidade. */
  async gerarCobranca(mensalidadeId: string): Promise<PagamentoPix> {
    const { data } = await api.post<ApiResponse<ApiCobrancaPix>>(`/aluno/mensalidades/${mensalidadeId}/pix`)
    return mapCobrancaPix(data.data)
  },

  /**
   * Leitura pura — só o banco de dados, nunca chama o Mercado Pago. Usado
   * pelo polling de rotina.
   */
  async consultarCobranca(mensalidadeId: string): Promise<PagamentoPix | null> {
    const { data } = await api.get<ApiResponse<ApiCobrancaPix | null>>(`/aluno/mensalidades/${mensalidadeId}/pix`)
    return data.data ? mapCobrancaPix(data.data) : null
  },

  /**
   * Força uma reconciliação real com o Mercado Pago (se a cobrança estiver
   * PENDENTE) antes de devolver o estado. Usado só em momentos explícitos:
   * abertura da tela, retorno de outra aba, countdown zerado, botão manual.
   */
  async sincronizarCobranca(mensalidadeId: string): Promise<PagamentoPix | null> {
    const { data } = await api.post<ApiResponse<ApiCobrancaPix | null>>(
      `/aluno/mensalidades/${mensalidadeId}/pix/sincronizar`,
    )
    return data.data ? mapCobrancaPix(data.data) : null
  },
}
