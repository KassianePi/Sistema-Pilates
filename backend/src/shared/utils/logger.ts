/**
 * Logger utilities — Pino structured logging
 *
 * Configura logs estruturados com níveis apropriados para cada ambiente
 * Desenvolvimento: pretty-printed
 * Produção: JSON estruturado para análise
 */

import pino from 'pino'

const isDevelopment = process.env.NODE_ENV === 'development'

/**
 * Logger configurado para o ambiente
 *
 * Desenvolvimento: logs coloridos e legíveis (pretty-print)
 * Produção: JSON estruturado sem cores
 *
 * Níveis de log:
 * - trace: Informações muito detalhadas (debug profundo)
 * - debug: Informações de debug
 * - info: Informações gerais
 * - warn: Avisos
 * - error: Erros
 * - fatal: Erros críticos que causam crash
 */
const logger = pino(
  {
    level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
    // Configurações de redação para mascarar dados sensíveis
    redact: {
      paths: [
        'password',
        'senhaHash',
        'token',
        'accessToken',
        'refreshToken',
        'JWT_SECRET',
        'JWT_REFRESH_SECRET',
        'DATABASE_URL',
        'email', // opcional: comentar se quiser logs com emails
      ],
      remove: true,
    },
  },
  // Transporte (pretty-print em desenvolvimento)
  isDevelopment
    ? pino.transport({
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
          singleLine: false,
        },
      })
    : undefined,
)

/**
 * Estrutura padrão para logs de requisição
 */
export interface LogContext {
  requestId?: string
  usuarioId?: string
  path?: string
  method?: string
  statusCode?: number
  error?: string
}

/**
 * Loga informação geral
 *
 * @param message - Mensagem principal
 * @param context - Contexto adicional (requestId, usuarioId, etc)
 *
 * @example
 * logInfo('Usuário logado', { usuarioId: '123', email: 'user@pilates.local' })
 */
export function logInfo(message: string, context?: Record<string, any>) {
  logger.info(context || {}, message)
}

/**
 * Loga aviso (situação inesperada mas recuperável)
 *
 * @param message - Mensagem principal
 * @param context - Contexto adicional
 *
 * @example
 * logWarn('Tentativa de login com email inválido', { email: 'invalid@...' })
 */
export function logWarn(message: string, context?: Record<string, any>) {
  logger.warn(context || {}, message)
}

/**
 * Loga erro (situação de falha que não impede execução)
 *
 * @param message - Mensagem principal
 * @param error - Objeto Error
 * @param context - Contexto adicional
 *
 * @example
 * try {
 *   // código
 * } catch (error) {
 *   logError('Falha ao criar usuário', error as Error, { email: 'test@pilates.local' })
 * }
 */
export function logError(message: string, error?: Error | unknown, context?: Record<string, any>) {
  const errorData = error instanceof Error ? { message: error.message, stack: error.stack } : { error }

  logger.error({ ...errorData, ...context }, message)
}

/**
 * Loga erro crítico (situação que causa crash ou parada do serviço)
 *
 * @param message - Mensagem principal
 * @param error - Objeto Error
 * @param context - Contexto adicional
 *
 * @example
 * try {
 *   // conectar ao banco
 * } catch (error) {
 *   logFatal('Falha conexão com banco', error as Error)
 *   process.exit(1)
 * }
 */
export function logFatal(message: string, error?: Error | unknown, context?: Record<string, any>) {
  const errorData = error instanceof Error ? { message: error.message, stack: error.stack } : { error }

  logger.fatal({ ...errorData, ...context }, message)
}

/**
 * Loga informação de debug (apenas em desenvolvimento)
 *
 * @param message - Mensagem principal
 * @param context - Contexto adicional
 *
 * @example
 * logDebug('Query executada', { sql: 'SELECT * FROM usuarios', params: { id: '123' } })
 */
export function logDebug(message: string, context?: Record<string, any>) {
  if (isDevelopment) {
    logger.debug(context || {}, message)
  }
}

/**
 * Loga informação de trace (muito detalhada, apenas em desenvolvimento)
 *
 * @param message - Mensagem principal
 * @param context - Contexto adicional
 *
 * @example
 * logTrace('Entrando em AlunoService.create()', { params })
 */
export function logTrace(message: string, context?: Record<string, any>) {
  if (isDevelopment) {
    logger.trace(context || {}, message)
  }
}

/**
 * Cria um logger child com contexto persistente
 *
 * Útil para manter requestId, usuarioId, etc em toda a requisição
 *
 * @param context - Contexto para todas as mensagens deste logger
 * @returns Logger com contexto persistente
 *
 * @example
 * const requestLogger = createContextLogger({ requestId: 'req-123', usuarioId: 'user-456' })
 * requestLogger.info('Processando requisição')
 * // Log incluirá requestId e usuarioId automaticamente
 */
export function createContextLogger(context: Record<string, any>) {
  return logger.child(context)
}

export { logger }
