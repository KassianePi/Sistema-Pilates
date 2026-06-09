export interface ConfiguracaoStudio {
  id: string
  chavePix: string | null
  tipoChavePix: string | null
  nomeRecebedor: string | null
  qrCodeBase64: string | null
  criadoEm: Date
  atualizadoEm: Date
}

export interface UpsertConfiguracaoData {
  chavePix?: string | null
  tipoChavePix?: string | null
  nomeRecebedor?: string | null
  qrCodeBase64?: string | null
}
