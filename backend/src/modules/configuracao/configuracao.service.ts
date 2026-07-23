import { z } from 'zod'
import cron from 'node-cron'
import { ConfiguracaoRepository } from './configuracao.repository'
import { registrarLog } from '../auditoria/auditoria.service'
import type { ConfiguracaoStudio } from './configuracao.types'

const upsertSchema = z.object({
  chavePix: z.string().max(255).nullable().optional(),
  tipoChavePix: z.enum(['CPF', 'EMAIL', 'CELULAR', 'ALEATORIA']).nullable().optional(),
  nomeRecebedor: z.string().max(255).nullable().optional(),
  qrCodeBase64: z.string().nullable().optional(),
  usarPixAutomatico: z.boolean().optional(),
  geracaoAutomaticaAtiva: z.boolean().optional(),
  diasAntesGeracao: z.coerce.number().int().min(1).max(28).optional(),
  maximoMensalidadesFuturas: z.coerce.number().int().min(1).max(6).optional(),
  // Editável via API desde já (persistência sem deploy), mas só a UI de
  // configurações não expõe este campo nesta fase — ver jobs/mensalidades-automaticas.job.ts
  // para a limitação de que a expressão só é relida no boot do processo.
  cronGeracaoMensalidades: z
    .string()
    .max(50)
    .refine((expressao) => cron.validate(expressao), 'Expressão cron inválida')
    .optional(),
})

export class ConfiguracaoService {
  constructor(private repository: ConfiguracaoRepository) {}

  async buscar(): Promise<ConfiguracaoStudio | null> {
    return this.repository.find()
  }

  async salvar(data: z.infer<typeof upsertSchema>, usuarioId: string): Promise<ConfiguracaoStudio> {
    const anterior = await this.repository.find()
    const validado = upsertSchema.parse(data)
    const atualizado = await this.repository.upsert(validado)
    // Auditoria: especialmente relevante aqui porque estes campos afetam
    // cobrança (geração automática de mensalidades) — quem mudou, quando, de/para.
    await registrarLog({
      usuarioId,
      acao: 'UPDATE',
      entidade: 'ConfiguracaoStudio',
      entidadeId: 'studio',
      dadosAntigos: anterior ?? undefined,
      dadosNovos: atualizado,
    }).catch(() => {
      /* não bloquear a operação principal */
    })
    return atualizado
  }
}

export const configuracaoService = new ConfiguracaoService(new ConfiguracaoRepository())
