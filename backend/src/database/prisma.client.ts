/**
 * Singleton do Prisma Client
 *
 * Garante uma única conexão com o banco de dados
 * Reutiliza conexão entre requisições
 */

import { PrismaClient } from '@prisma/client'
import { logInfo, logError, logFatal } from '../shared/utils'

const isDevelopment = process.env.NODE_ENV === 'development'

/**
 * Estende PrismaClient com logging customizado
 */
class PrismaClientSingleton {
  private static instance: PrismaClient

  private constructor() {}

  /**
   * Obtém a instância do Prisma (cria se não existe)
   */
  static getInstance(): PrismaClient {
    if (!PrismaClientSingleton.instance) {
      PrismaClientSingleton.instance = new PrismaClient({
        log: isDevelopment
          ? [
              { emit: 'stdout', level: 'query' },
              { emit: 'stdout', level: 'error' },
              { emit: 'stdout', level: 'warn' },
            ]
          : [
              { emit: 'event', level: 'error' },
              { emit: 'event', level: 'warn' },
            ],
        errorFormat: isDevelopment ? 'pretty' : 'minimal',
      })

      // Event listeners para erros em produção
      if (!isDevelopment) {
        PrismaClientSingleton.instance.$on('error', (e) => {
          logError('Erro Prisma', new Error(e.message), {
            target: e.target,
            code: e.code,
          })
        })

        PrismaClientSingleton.instance.$on('warn', (e) => {
          logError('Aviso Prisma', new Error(e.message))
        })
      }

      // Hook para log de queries em desenvolvimento
      if (isDevelopment) {
        PrismaClientSingleton.instance.$on('query', (e) => {
          const duration = `${e.duration}ms`
          logInfo(`📊 Query: ${e.query}`, {
            duration,
            timestamp: e.timestamp.toISOString(),
          })
        })
      }
    }

    return PrismaClientSingleton.instance
  }

  /**
   * Conecta ao banco de dados
   */
  static async connect(): Promise<void> {
    try {
      const prisma = PrismaClientSingleton.getInstance()
      await prisma.$connect()
      logInfo('✅ Conectado ao banco de dados com sucesso')
    } catch (error) {
      logFatal('❌ Falha ao conectar ao banco de dados', error as Error)
      throw error
    }
  }

  /**
   * Desconecta do banco de dados
   */
  static async disconnect(): Promise<void> {
    try {
      const prisma = PrismaClientSingleton.getInstance()
      await prisma.$disconnect()
      logInfo('✅ Desconectado do banco de dados')
    } catch (error) {
      logError('❌ Erro ao desconectar', error as Error)
    }
  }

  /**
   * Verifica saúde da conexão (health check)
   */
  static async healthCheck(): Promise<boolean> {
    try {
      const prisma = PrismaClientSingleton.getInstance()
      // Query simples para verificar conexão
      await prisma.$queryRaw`SELECT 1`
      return true
    } catch {
      return false
    }
  }
}

/**
 * Exporta singleton
 */
export const prisma = PrismaClientSingleton.getInstance()

export { PrismaClientSingleton }
