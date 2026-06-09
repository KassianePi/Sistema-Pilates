import 'dotenv/config'

import { createApp } from './app'
import { PrismaClientSingleton } from './database/prisma.client'
import { logInfo, logFatal, logError } from './shared/utils'
import { iniciarJobMensalidadesVencidas } from './jobs/mensalidades-vencidas.job'
import { iniciarJobAulasVencidas } from './jobs/aulas-vencidas.job'

const PORT = parseInt(process.env.PORT || '3000', 10)
const HOST = process.env.HOST || '0.0.0.0'

async function start() {
  let app: Awaited<ReturnType<typeof createApp>> | undefined
  let jobTimer: NodeJS.Timeout | undefined

  try {
    logInfo('🚀 Iniciando servidor Studio de Pilates...')

    await PrismaClientSingleton.connect()
    app = await createApp()

    jobTimer = iniciarJobMensalidadesVencidas()
    iniciarJobAulasVencidas()

    await app.listen({ port: PORT, host: HOST })

    logInfo('✅ Servidor iniciado com sucesso!')
    logInfo(`📌 URL: http://${HOST}:${PORT}`)
    logInfo(`📌 Ambiente: ${process.env.NODE_ENV || 'development'}`)
    logInfo(`📌 Health check: http://${HOST}:${PORT}/health`)

    const signals = ['SIGINT', 'SIGTERM'] as const
    for (const signal of signals) {
      process.on(signal, async () => {
        logInfo(`\n📛 ${signal} recebido. Encerrando gracefully...`)
        try {
          if (jobTimer) clearInterval(jobTimer)
          if (app) await app.close()
          logInfo('✅ Servidor Fastify encerrado')
          await PrismaClientSingleton.disconnect()
          logInfo('✅ Banco de dados desconectado')
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

import { fileURLToPath } from 'url'

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  start()
}

export { start }
