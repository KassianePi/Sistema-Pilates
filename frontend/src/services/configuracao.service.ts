import { api } from './api'

export interface ConfiguracaoStudio {
  id?: string
  chavePix?: string | null
  tipoChavePix?: 'CPF' | 'EMAIL' | 'CELULAR' | 'ALEATORIA' | null
  nomeRecebedor?: string | null
  qrCodeBase64?: string | null
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
