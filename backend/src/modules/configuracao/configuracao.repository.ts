import { prisma } from '../../database/prisma.client'
import { AppError } from '../../shared/errors'
import { logError } from '../../shared/utils'
import type { ConfiguracaoStudio, UpsertConfiguracaoData } from './configuracao.types'

export class ConfiguracaoRepository {
  async find(): Promise<ConfiguracaoStudio | null> {
    try {
      return await prisma.configuracaoStudio.findUnique({ where: { id: 'studio' } }) as any
    } catch (error) {
      logError('Erro ao buscar configuração', error as Error)
      throw AppError.internal('Erro ao buscar configuração')
    }
  }

  async upsert(data: UpsertConfiguracaoData): Promise<ConfiguracaoStudio> {
    try {
      return await prisma.configuracaoStudio.upsert({
        where: { id: 'studio' },
        create: { id: 'studio', ...data } as any,
        update: data as any,
      }) as any
    } catch (error) {
      logError('Erro ao salvar configuração', error as Error)
      throw AppError.internal('Erro ao salvar configuração')
    }
  }
}

export const configuracaoRepository = new ConfiguracaoRepository()
