import Fastify from 'fastify'
import fastifyJwt from '@fastify/jwt'
import fastifyCors from '@fastify/cors'
import fastifyHelmet from '@fastify/helmet'
import fastifyRateLimit from '@fastify/rate-limit'

import { logger, logInfo, logError, logFatal } from './shared/utils'
import { AppError, ValidationError, UnauthorizedError } from './shared/errors'
import { prisma } from './database/prisma.client'

import { authRoutes } from './modules/auth/auth.routes'
import { planosRoutes } from './modules/planos/planos.routes'
import { professoresRoutes } from './modules/professores/professores.routes'
import { alunosRoutes } from './modules/alunos/alunos.routes'
import { agendaRoutes } from './modules/agenda/agenda.routes'
import { presencaRoutes } from './modules/presenca/presenca.routes'
import { financeiroRoutes } from './modules/financeiro/financeiro.routes'
import { notificacoesRoutes } from './modules/notificacoes/notificacoes.routes'
import { auditoriaRoutes } from './modules/auditoria/auditoria.routes'
import { relatoriosRoutes } from './modules/relatorios/relatorios.routes'

// Inicializa listeners de eventos dos módulos
import './modules/notificacoes/notificacoes.service'

const isDevelopment = process.env.NODE_ENV === 'development'

export async function createApp() {
  const app = Fastify({
    logger: false,
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'requestId',
    disableRequestLogging: false,
  })

  if (!process.env.JWT_SECRET) {
    logFatal('JWT_SECRET não configurado')
    throw new Error('JWT_SECRET não configurado no .env')
  }

  if (!process.env.JWT_REFRESH_SECRET) {
    logFatal('JWT_REFRESH_SECRET não configurado')
    throw new Error('JWT_REFRESH_SECRET não configurado no .env')
  }

  try {
    // ========================================
    // 1. SECURITY PLUGINS
    // ========================================

    await app.register(fastifyHelmet, {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
    })

    await app.register(fastifyCors, {
      origin: isDevelopment ? true : process.env.CORS_ORIGIN || 'https://pilates.local',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })

    await app.register(fastifyRateLimit, {
      max: isDevelopment ? 1000 : 100,
      timeWindow: '15 minutes',
      cache: 10000,
      allowList: ['127.0.0.1'],
      skipOnError: true,
    })

    // ========================================
    // 2. JWT PLUGIN
    // ========================================

    await app.register(fastifyJwt, {
      secret: process.env.JWT_SECRET!,
      sign: {
        expiresIn: '15m',
        algorithm: 'HS256',
      },
    })

    // ========================================
    // 3. HOOKS — Logging
    // ========================================

    app.addHook('onRequest', async (request) => {
      logInfo(`→ ${request.method} ${request.url}`, { requestId: request.id, ip: request.ip })
    })

    app.addHook('onResponse', async (request, reply) => {
      logInfo(`← ${reply.statusCode} ${request.method} ${request.url}`, {
        requestId: request.id,
        statusCode: reply.statusCode,
        responseTime: reply.getResponseTime(),
      })
    })

    app.addHook('onError', async (request, _reply, error) => {
      logError(`❌ ${request.method} ${request.url}`, error, { requestId: request.id })
    })

    // ========================================
    // 4. ROTAS DE SAÚDE
    // ========================================

    app.get('/health', async (_request, _reply) => ({
      success: true,
      data: { status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() },
    }))

    app.get('/api/v1/health', async (_request, reply) => {
      let dbStatus = 'connected'
      try {
        await prisma.$queryRaw`SELECT 1`
      } catch {
        dbStatus = 'disconnected'
        reply.code(503)
      }
      return {
        success: dbStatus === 'connected',
        data: {
          status: dbStatus === 'connected' ? 'ok' : 'degraded',
          service: 'studio-pilates-api',
          version: '1.0.0',
          database: dbStatus,
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
        },
      }
    })

    // ========================================
    // 5. RATE LIMIT ESPECÍFICO — Auth
    // ========================================

    app.register(async (instance) => {
      await instance.register(fastifyRateLimit, {
        max: 10,
        timeWindow: '15 minutes',
        keyGenerator: (request) => `${request.ip}-auth`,
        errorResponseBuilder: () => ({
          success: false,
          message: 'Muitas tentativas. Aguarde 15 minutos.',
          code: 'RATE_LIMIT_EXCEEDED',
        }),
      })
      await instance.register(authRoutes)
    })

    // ========================================
    // 6. ROTAS DE APLICAÇÃO
    // ========================================

    await app.register(planosRoutes)
    await app.register(professoresRoutes)
    await app.register(alunosRoutes)
    await app.register(agendaRoutes)
    await app.register(presencaRoutes)
    await app.register(financeiroRoutes)
    await app.register(notificacoesRoutes)
    await app.register(auditoriaRoutes)
    await app.register(relatoriosRoutes)

    // ========================================
    // 7. ERROR HANDLING GLOBAL
    // ========================================

    app.setErrorHandler(async (error, request, reply) => {
      const requestId = request.id

      if (error instanceof ValidationError) {
        logError(`Validação falhou: ${error.message}`, error, { requestId })
        return reply.status(error.statusCode).send(error.toJSON())
      }

      if (error instanceof UnauthorizedError) {
        logError(`Acesso negado: ${error.message}`, error, { requestId })
        return reply.status(error.statusCode).send(error.toJSON())
      }

      if (error instanceof AppError) {
        logError(`Erro aplicação: ${error.message}`, error, { requestId })
        return reply.status(error.statusCode).send(error.toJSON())
      }

      if (error.name === 'UnauthorizedError' || error.name === 'JwtError') {
        logError(`JWT inválido: ${error.message}`, error, { requestId })
        return reply.status(401).send({ success: false, message: 'Token inválido ou expirado', code: 'TOKEN_INVALID', statusCode: 401 })
      }

      if (error.statusCode === 404) {
        return reply.status(404).send({ success: false, message: 'Rota não encontrada', code: 'NOT_FOUND', statusCode: 404 })
      }

      logError(`Erro inesperado: ${error.message}`, error, { requestId, stack: error.stack })
      const message = isDevelopment ? error.message : 'Erro interno do servidor'
      const details = isDevelopment ? { stack: error.stack } : undefined

      return reply.status(error.statusCode || 500).send({
        success: false,
        message,
        code: 'INTERNAL_ERROR',
        statusCode: error.statusCode || 500,
        ...(details && { details }),
      })
    })

    // ========================================
    // 8. NOT FOUND HANDLER
    // ========================================

    app.setNotFoundHandler((request, reply) => {
      reply.status(404).send({
        success: false,
        message: `Rota ${request.method} ${request.url} não encontrada`,
        code: 'NOT_FOUND',
        statusCode: 404,
      })
    })

    logInfo('✅ Aplicação Fastify configurada com sucesso')
    return app
  } catch (error) {
    logFatal('❌ Erro ao configurar aplicação', error as Error)
    throw error
  }
}

export const build = createApp
