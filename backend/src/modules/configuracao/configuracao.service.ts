import { z } from 'zod'
import { ConfiguracaoRepository } from './configuracao.repository'
import type { ConfiguracaoStudio } from './configuracao.types'

const upsertSchema = z.object({
  chavePix: z.string().max(255).nullable().optional(),
  tipoChavePix: z.enum(['CPF', 'EMAIL', 'CELULAR', 'ALEATORIA']).nullable().optional(),
  nomeRecebedor: z.string().max(255).nullable().optional(),
  qrCodeBase64: z.string().nullable().optional(),
})

export class ConfiguracaoService {
  constructor(private repository: ConfiguracaoRepository) {}

  async buscar(): Promise<ConfiguracaoStudio | null> {
    return this.repository.find()
  }

  async salvar(data: z.infer<typeof upsertSchema>): Promise<ConfiguracaoStudio> {
    const validado = upsertSchema.parse(data)
    return this.repository.upsert(validado)
  }
}

export const configuracaoService = new ConfiguracaoService(new ConfiguracaoRepository())
