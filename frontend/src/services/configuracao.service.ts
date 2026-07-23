import { api } from './api'

export interface ConfiguracaoStudio {
  id?: string
  chavePix?: string | null
  tipoChavePix?: 'CPF' | 'EMAIL' | 'CELULAR' | 'ALEATORIA' | null
  nomeRecebedor?: string | null
  qrCodeBase64?: string | null
  /** Liga/desliga o fluxo automático de PIX (Mercado Pago) no portal do aluno, sem precisar de deploy. */
  usarPixAutomatico?: boolean
  /** Liga/desliga a geração automática de mensalidades (job + execução manual). */
  geracaoAutomaticaAtiva?: boolean
  /** Quantos dias antes do vencimento da mensalidade mais recente a próxima é gerada. */
  diasAntesGeracao?: number
  /** Quantas mensalidades futuras (>= mês atual) podem existir antes do job parar de gerar mais. */
  maximoMensalidadesFuturas?: number
  /**
   * Expressão cron da geração automática. Editável via API, mas sem campo no
   * formulário nesta fase — só é relida no boot do backend (ver plano da feature).
   */
  cronGeracaoMensalidades?: string
}

export const configuracaoService = {
  async buscar(): Promise<ConfiguracaoStudio> {
    const { data } = await api.get('/configuracao')
    return data.data ?? {}
  },

  async salvar(payload: ConfiguracaoStudio): Promise<ConfiguracaoStudio> {
    const { data } = await api.put('/configuracao', payload)
    return data.data
  },
}
