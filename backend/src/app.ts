import Fastify from 'fastify'
import fastifyJwt from '@fastify/jwt'
import fastifyCors from '@fastify/cors'
import fastifyHelmet from '@fastify/helmet'
import fastifyRateLimit from '@fastify/rate-limit'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'

import { logger, logInfo, logError, logFatal } from './shared/utils'
import { AppError, ValidationError, UnauthorizedError } from './shared/errors'
import { prisma } from './database/prisma.client'

import { authRoutes, authLoginRoutes } from './modules/auth/auth.routes'
import { planosRoutes } from './modules/planos/planos.routes'
import { professoresRoutes } from './modules/professores/professores.routes'
import { alunosRoutes } from './modules/alunos/alunos.routes'
import { agendaRoutes } from './modules/agenda/agenda.routes'
import { presencaRoutes } from './modules/presenca/presenca.routes'
import { financeiroRoutes } from './modules/financeiro/financeiro.routes'
import { notificacoesRoutes } from './modules/notificacoes/notificacoes.routes'
import { acompanhamentoRoutes } from './modules/acompanhamento/acompanhamento.routes'
import { relatoriosRoutes } from './modules/relatorios/relatorios.routes'
import { configuracaoRoutes } from './modules/configuracao/configuracao.routes'
import { estornosRoutes } from './modules/estornos/estornos.routes'
import { modalidadesRoutes } from './modules/modalidades/modalidades.routes'
import { termosRoutes } from './modules/termos/termos.routes'
import { auditoriaRoutes } from './modules/auditoria/auditoria.routes'

// Inicializa listeners de eventos dos módulos
import './modules/notificacoes/notificacoes.service'

const isDevelopment = process.env.NODE_ENV === 'development'

export async function createApp() {
  const app = Fastify({
    logger: false,
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'requestId',
    disableRequestLogging: false,
    // Comprovantes são enviados como base64 (até ~5MB → ~6.7MB em base64). 10MB de folga.
    bodyLimit: 10 * 1024 * 1024,
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
      frameguard: { action: 'deny' },
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
      allowList: isDevelopment ? ['127.0.0.1', '::1', '::ffff:127.0.0.1', '172.19.0.1'] : ['127.0.0.1'],
      skipOnError: true,
    })

    // ========================================
    // 1.5. SWAGGER / OPENAPI
    // ========================================

    await app.register(fastifySwagger, {
      openapi: {
        info: {
          title: 'Studio de Pilates — API',
          description:
            'Documentação da API do sistema de gestão do Studio de Pilates: alunos, professores, planos, agenda, presença, financeiro, estornos, termos e relatórios.',
          version: '1.0.0',
        },
        servers: [{ url: '/api/v1', description: 'Prefixo padrão das rotas (v1)' }],
        tags: [
          { name: 'Autenticação', description: 'Login, registro, refresh token e perfil' },
          { name: 'Alunos', description: 'Cadastro e gestão de alunos' },
          { name: 'Professores', description: 'Cadastro e gestão de professores' },
          { name: 'Planos', description: 'Planos de pilates' },
          { name: 'Agenda', description: 'Aulas, matrícula e conflitos de horário' },
          { name: 'Presença', description: 'Registro de presença em aulas' },
          { name: 'Financeiro', description: 'Caixa, mensalidades e pagamentos' },
          { name: 'Estornos', description: 'Solicitação e aprovação de reembolsos' },
          { name: 'Termos', description: 'Termos de uso e aceite' },
          { name: 'Relatórios', description: 'Geração e exportação de relatórios' },
          { name: 'Modalidades', description: 'Modalidades de aula' },
          { name: 'Notificações', description: 'Notificações do sistema' },
          { name: 'Auditoria', description: 'Logs de auditoria' },
          { name: 'Configuração', description: 'Configurações gerais do studio' },
          { name: 'Acompanhamento', description: 'Acompanhamento de risco/evasão de alunos' },
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
              description: 'Access token JWT obtido em POST /api/v1/auth/login',
            },
          },
        },
      },
    })

    await app.register(fastifySwaggerUi, {
      routePrefix: '/documentation',
      uiConfig: {
        docExpansion: 'list',
        deepLinking: true,
      },
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
    // 2.5. ERROR HANDLING GLOBAL
    // ========================================
    // Registrado antes das rotas para garantir que erros lançados durante a
    // validação de schema do Fastify (preValidation, antes do controller
    // rodar) também passem por aqui em vez do formato nativo do Fastify.

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
        return reply
          .status(401)
          .send({ success: false, message: 'Token inválido ou expirado', code: 'TOKEN_INVALID', statusCode: 401 })
      }

      if (error.statusCode === 429) {
        return reply
          .status(429)
          .send({ success: false, message: 'Muitas tentativas. Aguarde 15 minutos.', code: 'RATE_LIMIT_EXCEEDED' })
      }

      if (error.statusCode === 404) {
        return reply
          .status(404)
          .send({ success: false, message: 'Rota não encontrada', code: 'NOT_FOUND', statusCode: 404 })
      }

      if (error.code === 'FST_ERR_VALIDATION') {
        logError(`Validação de schema falhou: ${error.message}`, error, { requestId })
        return reply
          .status(400)
          .send({ success: false, message: error.message, code: 'VALIDATION_ERROR', statusCode: 400 })
      }

      // Rede de segurança: erros de validação Zod lançados diretamente por
      // services/controllers que não os convertem explicitamente em
      // ValidationError (em vez de cair no 500 genérico abaixo).
      if (error.name === 'ZodError') {
        const validationError = ValidationError.fromZod(error)
        logError(`Validação (Zod) falhou: ${validationError.message}`, error, { requestId })
        return reply.status(400).send(validationError.toJSON())
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

    app.setNotFoundHandler((request, reply) => {
      reply.status(404).send({
        success: false,
        message: `Rota ${request.method} ${request.url} não encontrada`,
        code: 'NOT_FOUND',
        statusCode: 404,
      })
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
    // 5. RATE LIMIT ESPECÍFICO — apenas rotas de login
    // ========================================

    // Rate limit estrito só nas rotas de login (brute-force protection)
    app.register(async (instance) => {
      await instance.register(fastifyRateLimit, {
        max: isDevelopment ? 1000 : 10,
        timeWindow: '15 minutes',
        keyGenerator: (request) => `${request.ip}-login`,
        errorResponseBuilder: () => ({
          success: false,
          message: 'Muitas tentativas de login. Aguarde 15 minutos.',
          code: 'RATE_LIMIT_EXCEEDED',
        }),
      })
      await instance.register(authLoginRoutes)
    })

    // Demais rotas de auth sem rate limit estrito (refresh, logout, etc.)
    await app.register(authRoutes)

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
    await app.register(acompanhamentoRoutes)
    await app.register(relatoriosRoutes)
    await app.register(configuracaoRoutes)
    await app.register(estornosRoutes)
    await app.register(modalidadesRoutes)
    await app.register(termosRoutes)
    await app.register(auditoriaRoutes)

    logInfo('✅ Aplicação Fastify configurada com sucesso')
    return app
  } catch (error) {
    logFatal('❌ Erro ao configurar aplicação', error as Error)
    throw error
  }
}

export const build = createApp
