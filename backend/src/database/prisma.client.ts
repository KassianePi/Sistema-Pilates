import { PrismaClient } from '@prisma/client'
import { logInfo, logError, logFatal } from '../shared/utils'

const isDevelopment = process.env.NODE_ENV === 'development'

class PrismaClientSingleton {
  private static instance: PrismaClient

  private constructor() {}

  static getInstance(): PrismaClient {
    if (!PrismaClientSingleton.instance) {
      PrismaClientSingleton.instance = new PrismaClient({
        log: isDevelopment
          ? ['query', 'error', 'warn']
          : ['error'],
        errorFormat: isDevelopment ? 'pretty' : 'minimal',
      })
    }

    return PrismaClientSingleton.instance
  }

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

  static async disconnect(): Promise<void> {
    try {
      const prisma = PrismaClientSingleton.getInstance()
      await prisma.$disconnect()
      logInfo('✅ Desconectado do banco de dados')
    } catch (error) {
      logError('❌ Erro ao desconectar', error as Error)
    }
  }

  static async healthCheck(): Promise<boolean> {
    try {
      const prisma = PrismaClientSingleton.getInstance()
      await prisma.$queryRaw`SELECT 1`
      return true
    } catch {
      return false
    }
  }
}

export const prisma = PrismaClientSingleton.getInstance()

export { PrismaClientSingleton }
