/**
 * Middleware de Request ID e Logging Context
 *
 * Responsável por:
 * - Gerar/extrair request ID único
 * - Criar logger com contexto (request ID, usuário, IP)
 * - Adicionar ID aos headers de resposta
 */

import { FastifyRequest, FastifyReply } from 'fastify'
import { randomUUID } from 'crypto'
import { createContextLogger } from '../utils/logger'

/**
 * Estende FastifyRequest para incluir logger contextualizado
 */
declare module 'fastify' {
  interface FastifyRequest {
    logger?: ReturnType<typeof createContextLogger>
  }
}

/**
 * Middleware que gerencia Request ID e logging context
 *
 * Fluxo:
 * 1. Verifica se X-Request-ID foi fornecido (para rastreamento de chains)
 * 2. Se não, gera UUID v4 novo
 * 3. Cria logger child com contexto persistente
 * 4. Adiciona X-Request-ID ao header de resposta
 *
 * @example
 * app.addHook('onRequest', requestIdMiddleware)
 *
 * // Later, dentro de handlers, services, etc:
 * request.logger.info('Ação realizada')
 * // Log incluirá requestId, usuarioId, ip automaticamente
 */
export async function requestIdMiddleware(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  // Extrai request ID fornecido (para rastreamento entre serviços)
  // ou gera novo se não existir
  const requestId = (request.headers['x-request-id'] as string) || randomUUID()

  // Adiciona ID ao header de resposta para cliente rastrear
  reply.header('X-Request-ID', requestId)

  // Cria logger child com contexto persistente
  const logContext: Record<string, unknown> = {
    requestId,
    method: request.method,
    path: request.url,
    ip: request.ip,
  }

  // Adiciona usuário se autenticado
  if (request.usuarioId) {
    logContext.usuarioId = request.usuarioId
    logContext.funcao = request.funcao
  }

  // Atribui logger contextualizado ao request
  request.logger = createContextLogger(logContext)
}

/**
 * Extrai request ID de um header X-Request-ID
 *
 * Útil para validar ou usar request IDs fornecidos por clientes
 *
 * @param headers - Headers da requisição
 * @returns Request ID ou undefined
 */
export function extractRequestId(headers: Record<string, string | string[] | undefined>): string | undefined {
  const requestId = headers['x-request-id']

  if (!requestId) {
    return undefined
  }

  // Se for array, pega primeiro elemento
  if (Array.isArray(requestId)) {
    return requestId[0]
  }

  return requestId
}

/**
 * Valida se um request ID é válido (UUID v4)
 *
 * @param requestId - ID a validar
 * @returns true se válido
 */
export function isValidRequestId(requestId: string): boolean {
  // UUID v4 pattern
  const uuidv4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidv4Regex.test(requestId)
}
