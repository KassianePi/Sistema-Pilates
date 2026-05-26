/**
 * Entry point do servidor
 *
 * Responsável por:
 * - Criar aplicação Fastify
 * - Conectar ao banco de dados
 * - Registrar rotas
 * - Iniciar servidor
 * - Graceful shutdown
 */

import 'dotenv/config'

import { createApp } from './app'
import { PrismaClientSingleton } from './database/prisma.client'
import { logInfo, logFatal, logError } from './shared/utils'

const PORT = parseInt(process.env.PORT || '3000', 10)
const HOST = process.env.HOST || '0.0.0.0'

/**
 * Inicia o servidor
 */
async function start() {
  let app

  try {
    logInfo('🚀 Iniciando servidor Studio de Pilates...')

    // ========================================
    // 1. Conectar ao banco de dados
    // ========================================
    await PrismaClientSingleton.connect()

    // ========================================
    // 2. Criar aplicação Fastify
    // ========================================
    app = await createApp()

    // ========================================
    // 3. REGISTRAR ROTAS (quando existirem)
    // ========================================
    // TODO: Registrar rotas de módulos
    // app.register(authRoutes, { prefix: '/api/v1' })
    // app.register(alunosRoutes, { prefix: '/api/v1' })
    // app.register(agendaRoutes, { prefix: '/api/v1' })

    // ========================================
    // 4. INICIAR SERVIDOR
    // ========================================
    await app.listen({ port: PORT, host: HOST })

    logInfo(`✅ Servidor iniciado com sucesso!`)
    logInfo(`📌 URL: http://${HOST}:${PORT}`)
    logInfo(`📌 Ambiente: ${process.env.NODE_ENV || 'development'}`)
    logInfo(`📌 Health check: http://${HOST}:${PORT}/health`)

    // ========================================
    // 5. GRACEFUL SHUTDOWN
    // ========================================
    const signals = ['SIGINT', 'SIGTERM']

    for (const signal of signals) {
      process.on(signal, async () => {
        logInfo(`\n📛 ${signal} recebido. Encerrando gracefully...`)

        try {
          await app.close()
          logInfo('✅ Servidor Fastify encerrado')

          await PrismaClientSingleton.disconnect()
          logInfo('✅ Banco de dados desconectado')

          logInfo('✅ Processo finalizado com sucesso')
          process.exit(0)
        } catch (error) {
          logError('❌ Erro durante shutdown', error as Error)
          process.exit(1)
        }
      })
    }
  } catch (error) {
    logFatal('❌ Erro ao iniciar servidor', error as Error)
    process.exit(1)
  }
}

// Executar se for o arquivo principal
if (require.main === module) {
  start()
}

export { start }
