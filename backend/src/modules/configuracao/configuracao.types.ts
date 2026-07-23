export interface ConfiguracaoStudio {
  id: string
  chavePix: string | null
  tipoChavePix: string | null
  nomeRecebedor: string | null
  qrCodeBase64: string | null
  usarPixAutomatico: boolean
  geracaoAutomaticaAtiva: boolean
  diasAntesGeracao: number
  maximoMensalidadesFuturas: number
  cronGeracaoMensalidades: string
  criadoEm: Date
  atualizadoEm: Date
}

export interface UpsertConfiguracaoData {
  chavePix?: string | null
  tipoChavePix?: string | null
  nomeRecebedor?: string | null
  qrCodeBase64?: string | null
  usarPixAutomatico?: boolean
  geracaoAutomaticaAtiva?: boolean
  diasAntesGeracao?: number
  maximoMensalidadesFuturas?: number
  cronGeracaoMensalidades?: string
}
