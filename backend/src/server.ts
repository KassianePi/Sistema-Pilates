import { buildApp } from './app'
import { env } from './config/env'
import { logger } from './shared/utils/logger'

async function start() {
  try {
    const app = await buildApp()
    
    await app.listen({ port: env.PORT, host: '0.0.0.0' })
    
    logger.info(`✅ Server running at http://localhost:${env.PORT}`)
  } catch (error) {
    logger.error(error)
    process.exit(1)
  }
}

start()
