/**
 * Middleware de Autenticação JWT
 *
 * Responsável por:
 * - Extrair token do header Authorization
 * - Validar e decodificar JWT
 * - Adicionar payload ao request
 * - Lançar erro se token inválido/expirado
 */

import { FastifyRequest, FastifyReply } from 'fastify'
import { extractTokenFromHeader, verifyAccessToken, TokenPayload } from '../utils/jwt'
import { UnauthorizedError } from '../errors/UnauthorizedError'
import { logDebug, logWarn } from '../utils/logger'
import { prisma } from '../../database/prisma.client'

/**
 * Confirma no banco que o usuário do token ainda existe e está ATIVO.
 *
 * O access token é um JWT stateless (só assinatura + expiração) — sem essa
 * checagem, um aluno excluído ou inativado continuaria autenticando
 * normalmente com um token já emitido até ele expirar (até 15 min).
 */
async function usuarioAindaAtivo(usuarioId: string): Promise<boolean> {
  const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId }, select: { status: true } })
  return usuario?.status === 'ATIVO'
}

/**
 * Estende FastifyRequest para incluir usuário autenticado
 */
declare module 'fastify' {
  interface FastifyRequest {
    usuarioId?: string
    funcao?: 'ADMIN' | 'PROFESSOR' | 'RECEPCIONISTA' | 'FINANCEIRO' | 'ALUNO'
    email?: string
    payload?: TokenPayload
  }
}

/**
 * Middleware de autenticação obrigatória
 *
 * Uso:
 * app.get('/rota-protegida', { onRequest: [authenticateToken] }, handler)
 *
 * @throws UnauthorizedError se token não fornecido, inválido ou expirado
 *
 * @example
 * app.get('/api/v1/perfil', { onRequest: [authenticateToken] }, async (request, reply) => {
 *   return { usuarioId: request.usuarioId }
 * })
 */
export async function authenticateToken(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    const authHeader = request.headers.authorization

    if (!authHeader) {
      logWarn('Tentativa de acesso sem token', {
        requestId: request.id,
        path: request.url,
        ip: request.ip,
      })
      throw UnauthorizedError.authRequired('Token não fornecido')
    }

    // Extrair token do formato "Bearer <token>"
    const token = extractTokenFromHeader(authHeader)

    // Validar e decodificar token
    const payload = verifyAccessToken(token)

    if (!(await usuarioAindaAtivo(payload.usuarioId))) {
      logWarn('Token válido para usuário excluído/inativo — acesso negado', {
        requestId: request.id,
        usuarioId: payload.usuarioId,
      })
      throw UnauthorizedError.tokenInvalid('Usuário não encontrado ou inativo')
    }

    // Adicionar dados ao request para uso posterior
    request.usuarioId = payload.usuarioId
    request.funcao = payload.funcao
    request.email = payload.email
    request.payload = payload

    logDebug('✅ Token validado com sucesso', {
      requestId: request.id,
      usuarioId: payload.usuarioId,
      funcao: payload.funcao,
    })
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw error
    }

    if (error instanceof Error) {
      if (error.message.includes('expirado')) {
        throw UnauthorizedError.tokenExpired()
      }
      if (error.message.includes('inválido')) {
        throw UnauthorizedError.tokenInvalid()
      }
    }

    logWarn('Erro ao validar token', {
      requestId: request.id,
      error: error instanceof Error ? error.message : String(error),
    })

    throw UnauthorizedError.tokenInvalid('Token inválido ou expirado')
  }
}

/**
 * Middleware de autenticação opcional
 *
 * Tenta extrair token, mas não falha se não existir
 * Útil para rotas que podem ser públicas ou autenticadas
 *
 * @example
 * app.get('/api/v1/posts', { onRequest: [optionalAuth] }, async (request, reply) => {
 *   if (request.usuarioId) {
 *     // usuário autenticado - retornar conteúdo privado
 *   } else {
 *     // público - retornar conteúdo apenas público
 *   }
 * })
 */
export async function optionalAuth(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    const authHeader = request.headers.authorization

    if (!authHeader) {
      // Sem token é ok, deixa continuar
      return
    }

    const token = extractTokenFromHeader(authHeader)
    const payload = verifyAccessToken(token)

    if (!(await usuarioAindaAtivo(payload.usuarioId))) {
      logDebug('Token opcional de usuário excluído/inativo (ignorado)', {
        requestId: request.id,
        usuarioId: payload.usuarioId,
      })
      return
    }

    request.usuarioId = payload.usuarioId
    request.funcao = payload.funcao
    request.email = payload.email
    request.payload = payload

    logDebug('✅ Token opcional validado', {
      requestId: request.id,
      usuarioId: payload.usuarioId,
    })
  } catch (error) {
    // Em modo opcional, ignora erros de token
    // Log apenas para debug
    logDebug('Token opcional inválido (ignorado)', {
      requestId: request.id,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

/**
 * Middleware que valida se usuário está autenticado
 *
 * Use em rotas que DEVEM ser protegidas
 *
 * @throws UnauthorizedError se não autenticado
 *
 * @example
 * app.post('/api/v1/logout', { onRequest: [authenticate] }, handler)
 */
export async function authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  await authenticateToken(request, reply)
}

/**
 * Cria middleware que valida um rol específico
 *
 * @param requiredRoles - Um ou mais roles obrigatórios
 * @returns Middleware que valida o rol
 *
 * @throws UnauthorizedError se usuário não tem o rol necessário
 *
 * @example
 * // Apenas ADMIN pode acessar
 * app.delete(
 *   '/api/v1/usuarios/:id',
 *   { onRequest: [authenticate, requireRole('ADMIN')] },
 *   handler
 * )
 *
 * // ADMIN ou FINANCEIRO podem acessar
 * app.get(
 *   '/api/v1/relatorios',
 *   { onRequest: [authenticate, requireRole('ADMIN', 'FINANCEIRO')] },
 *   handler
 * )
 */
export function requireRole(...requiredRoles: Array<'ADMIN' | 'PROFESSOR' | 'RECEPCIONISTA' | 'FINANCEIRO' | 'ALUNO'>) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    // Garantir que autenticação foi realizada antes
    if (!request.usuarioId) {
      throw UnauthorizedError.authRequired('Autenticação necessária')
    }

    const userRole = request.funcao

    if (!userRole || !requiredRoles.includes(userRole)) {
      logWarn('Acesso negado por rol insuficiente', {
        requestId: request.id,
        usuarioId: request.usuarioId,
        requiredRoles,
        userRole,
        path: request.url,
      })

      throw UnauthorizedError.insufficientPermission(
        `Apenas ${requiredRoles.join(', ')} podem acessar`,
        requiredRoles.join(', '),
      )
    }

    logDebug('✅ Rol verificado com sucesso', {
      requestId: request.id,
      usuarioId: request.usuarioId,
      userRole,
    })
  }
}
