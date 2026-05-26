/**
 * Configuração da aplicação Fastify
 *
 * Responsável por:
 * - Instanciar Fastify com plugins
 * - Registrar middlewares globais
 * - Configurar CORS, Helmet, Rate Limiting
 * - Registrar rotas
 * - Error handling global
 */

import Fastify from 'fastify'
import fastifyJwt from '@fastify/jwt'
import fastifyCors from '@fastify/cors'
import fastifyHelmet from '@fastify/helmet'
import fastifyRateLimit from '@fastify/rate-limit'

import { logger, logInfo, logError, logFatal } from './shared/utils'
import { AppError, ValidationError, UnauthorizedError } from './shared/errors'
import { authRoutes } from './modules/auth/auth.routes'

const isDevelopment = process.env.NODE_ENV === 'development'

/**
 * Cria instância da aplicação Fastify
 *
 * @returns Instância configurada do Fastify
 * @throws Error se JWT_SECRET não está configurado
 */
export async function createApp() {
  const app = Fastify({
    logger: false, // Desabilita logger nativo (usamos Pino customizado)
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'requestId',
    disableRequestLogging: false,
  })

  // Validar secrets obrigatórios
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

    // Helmet — Proteção de headers HTTP
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

    // CORS — Cross-Origin Resource Sharing
    await app.register(fastifyCors, {
      origin: isDevelopment ? true : process.env.CORS_ORIGIN || 'https://pilates.local',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })

    // Rate Limiting — Proteção contra força bruta
    await app.register(fastifyRateLimit, {
      max: isDevelopment ? 1000 : 100, // requests por 15 min
      timeWindow: '15 minutes',
      cache: 10000, // número máximo de registros
      allowList: ['127.0.0.1'], // localhost sem limite
      redis: undefined, // usar memória em dev, Redis em prod
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
    // 3. HOOKS — Logging e contexto
    // ========================================

    // Hook: Request iniciada
    app.addHook('onRequest', async (request, reply) => {
      const { method, url, ip } = request
      logInfo(`→ ${method} ${url}`, {
        requestId: request.id,
        ip,
      })
    })

    // Hook: Response enviada
    app.addHook('onResponse', async (request, reply) => {
      const { method, url } = request
      const { statusCode } = reply
      logInfo(`← ${statusCode} ${method} ${url}`, {
        requestId: request.id,
        statusCode,
        responseTime: reply.getResponseTime(),
      })
    })

    // Hook: Erro não tratado
    app.addHook('onError', async (request, reply, error) => {
      logError(`❌ ${request.method} ${request.url}`, error, {
        requestId: request.id,
      })
    })

    // ========================================
    // 4. ROTAS DE SAÚDE
    // ========================================

    app.get('/health', async (request, reply) => {
      return {
        success: true,
        data: {
          status: 'ok',
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV,
          uptime: process.uptime(),
        },
      }
    })

    app.get('/api/v1/health', async (request, reply) => {
      return {
        success: true,
        data: {
          status: 'ok',
          service: 'studio-pilates-api',
          version: '1.0.0',
          database: 'connected', // TODO: verificar conexão com banco
          timestamp: new Date().toISOString(),
        },
      }
    })

    // ========================================
    // 5. ROTAS DE APLICAÇÃO
    // ========================================

    // Módulo: Autenticação
    await app.register(authRoutes)

    // ========================================
    // 6. ERROR HANDLING GLOBAL
    // ========================================

    app.setErrorHandler(async (error, request, reply) => {
      const requestId = request.id

      // Erros conhecidos da aplicação
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

      // Erro JWT
      if (error.name === 'UnauthorizedError' || error.name === 'JwtError') {
        logError(`JWT inválido: ${error.message}`, error, { requestId })
        return reply.status(401).send({
          success: false,
          message: 'Token inválido ou expirado',
          code: 'TOKEN_INVALID',
          statusCode: 401,
        })
      }

      // Erro 404
      if (error.statusCode === 404) {
        return reply.status(404).send({
          success: false,
          message: 'Rota não encontrada',
          code: 'NOT_FOUND',
          statusCode: 404,
        })
      }

      // Erros inesperados (500)
      logError(`Erro inesperado: ${error.message}`, error, {
        requestId,
        stack: error.stack,
      })

      // Nunca exponha stack trace em produção
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
    // 6. NOTFOUND HANDLER
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

/**
 * Alias para createApp (usado em testes)
 */
export const build = createApp
