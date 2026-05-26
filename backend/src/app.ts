import Fastify, { FastifyInstance } from 'fastify'
import fastifyJwt from '@fastify/jwt'
import fastifyCors from '@fastify/cors'
import fastifyHelmet from '@fastify/helmet'
import fastifyRateLimit from '@fastify/rate-limit'
import { logger } from './shared/utils/logger'
import { env } from './config/env'
import { AppError } from './shared/errors/AppError'

export async function buildApp(): Promise<FastifyInstance> {
  const fastify = Fastify({
    logger: env.NODE_ENV === 'development',
  })

  // Security: Helmet
  await fastify.register(fastifyHelmet, {
    contentSecurityPolicy: false,
  })

  // Security: CORS
  await fastify.register(fastifyCors, {
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
  })

  // Security: Rate Limit
  await fastify.register(fastifyRateLimit, {
    max: 100,
    timeWindow: '15 minutes',
  })

  // Authentication: JWT
  await fastify.register(fastifyJwt, {
    secret: env.JWT_SECRET,
  })

  // Health check
  fastify.get('/api/v1/health', async (request, reply) => {
    return {
      success: true,
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      },
    }
  })

  // Global error handler
  fastify.setErrorHandler((error, request, reply) => {
    logger.error(error)

    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        success: false,
        message: error.message,
        code: error.code,
      })
    }

    return reply.status(500).send({
      success: false,
      message: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR',
    })
  })

  return fastify
}
