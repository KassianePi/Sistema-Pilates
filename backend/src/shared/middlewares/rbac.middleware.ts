/**
 * Middleware RBAC (Role-Based Access Control)
 *
 * Implementa controle de acesso baseado em roles
 * Define permissões para cada funcao de usuário
 */

import { FastifyRequest, FastifyReply } from 'fastify'
import { UnauthorizedError } from '../errors/UnauthorizedError'
import { logWarn, logDebug } from '../utils/logger'

/**
 * Definição de permissões por funcao
 *
 * Cada funcao tem acesso a determinadas operações
 */
export const ROLE_PERMISSIONS = {
  ADMIN: {
    // Acesso total
    users: ['create', 'read', 'update', 'delete'],
    alunos: ['create', 'read', 'update', 'delete', 'bulk_delete'],
    professores: ['create', 'read', 'update', 'delete'],
    agenda: ['create', 'read', 'update', 'delete', 'manage'],
    pagamentos: ['create', 'read', 'update', 'delete', 'refund'],
    relatorios: ['create', 'read', 'delete'],
    auditoria: ['read'],
    presenca: ['create', 'read', 'update', 'delete'],
    sistema: ['create', 'read', 'update', 'delete', 'config', 'logs', 'maintenance'],
  },

  PROFESSOR: {
    // Acesso limitado: apenas suas aulas e presença de alunos
    alunos: ['read'],
    professores: ['read'],
    agenda: ['read'],
    presenca: ['create', 'read', 'update'],
  },

  RECEPCIONISTA: {
    // Acesso: cadastro, presença, agenda
    alunos: ['create', 'read', 'update'],
    professores: ['read'],
    agenda: ['read', 'create', 'update'],
    presenca: ['create', 'read', 'update'],
    pagamentos: ['read'],
  },

  FINANCEIRO: {
    // Acesso: financeiro e relatórios
    pagamentos: ['create', 'read', 'update'],
    alunos: ['read'],
    professores: ['read'],
    relatorios: ['create', 'read'],
    auditoria: ['read'],
  },

  ALUNO: {
    // Alunos só acessam seus próprios dados via rotas sem RBAC
  },
} as const

/**
 * Tipo para validar permissões
 */
export type FuncaoType = keyof typeof ROLE_PERMISSIONS
export type ResourceType = string
export type ActionType = string

/**
 * Verifica se um usuário tem permissão para acessar um recurso/ação
 *
 * @param funcao - Role do usuário
 * @param resource - Nome do recurso (ex: 'alunos', 'pagamentos')
 * @param action - Ação desejada (ex: 'create', 'delete')
 * @returns true se tem permissão, false caso contrário
 *
 * @example
 * hasPermission('ADMIN', 'usuarios', 'delete') // true
 * hasPermission('PROFESSOR', 'usuarios', 'delete') // false
 */
export function hasPermission(funcao: FuncaoType, resource: ResourceType, action: ActionType): boolean {
  const permissions = ROLE_PERMISSIONS[funcao] as Record<string, string[]> | undefined

  if (!permissions) {
    return false
  }

  const resourcePermissions = permissions[resource] as string[] | undefined

  if (!resourcePermissions) {
    return false
  }

  return resourcePermissions.includes(action)
}

/**
 * Cria middleware que verifica permissão específica
 *
 * @param resource - Nome do recurso
 * @param action - Ação desejada
 * @returns Middleware que valida permissão
 *
 * @throws UnauthorizedError se sem permissão
 *
 * @example
 * // Apenas ADMIN pode deletar usuários
 * app.delete(
 *   '/api/v1/usuarios/:id',
 *   { onRequest: [authenticate, authorize('usuarios', 'delete')] },
 *   handler
 * )
 *
 * // ADMIN, RECEPCIONISTA e FINANCEIRO podem criar alunos
 * // (se configurado nas ROLE_PERMISSIONS)
 * app.post(
 *   '/api/v1/alunos',
 *   { onRequest: [authenticate, authorize('alunos', 'create')] },
 *   handler
 * )
 */
export function authorize(resource: ResourceType, action: ActionType) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const userRole = request.funcao as FuncaoType | undefined

    if (!userRole) {
      throw UnauthorizedError.authRequired('Autenticação necessária para verificar permissões')
    }

    const hasAccess = hasPermission(userRole, resource, action)

    if (!hasAccess) {
      logWarn(`Acesso negado: ${action} em ${resource}`, {
        requestId: request.id,
        usuarioId: request.usuarioId,
        userRole,
        resource,
        action,
        path: request.url,
        method: request.method,
      })

      throw UnauthorizedError.insufficientPermission(
        `Sua role "${userRole}" não tem permissão para ${action} em ${resource}`,
        userRole,
      )
    }

    logDebug(`✅ Permissão concedida: ${action} em ${resource}`, {
      requestId: request.id,
      usuarioId: request.usuarioId,
      userRole,
    })
  }
}

/**
 * Cria middleware que valida multiplas permissões (ANY logic)
 *
 * Usuário precisa ter PELO MENOS UMA das permissões
 *
 * @param permissions - Array de [resource, action]
 * @returns Middleware que valida pelo menos uma permissão
 *
 * @example
 * // Usuário precisa poder criar OU editar alunos
 * app.post('/api/v1/bulk-action', {
 *   onRequest: [authenticate, authorizeAny([
 *     ['alunos', 'create'],
 *     ['alunos', 'update']
 *   ])]
 * }, handler)
 */
export function authorizeAny(permissions: Array<[ResourceType, ActionType]>) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const userRole = request.funcao as FuncaoType | undefined

    if (!userRole) {
      throw UnauthorizedError.authRequired('Autenticação necessária para verificar permissões')
    }

    const hasAnyPermission = permissions.some(([resource, action]) => hasPermission(userRole, resource, action))

    if (!hasAnyPermission) {
      logWarn(`Acesso negado: nenhuma permissão correspondente`, {
        requestId: request.id,
        usuarioId: request.usuarioId,
        userRole,
        requiredPermissions: permissions,
        path: request.url,
      })

      throw UnauthorizedError.insufficientPermission(
        `Sua role "${userRole}" não tem nenhuma das permissões necessárias`,
        userRole,
      )
    }

    logDebug(`✅ Permissão validada (qualquer uma)`, {
      requestId: request.id,
      usuarioId: request.usuarioId,
      userRole,
    })
  }
}

/**
 * Cria middleware que valida multiplas permissões (ALL logic)
 *
 * Usuário precisa ter TODAS as permissões
 *
 * @param permissions - Array de [resource, action]
 * @returns Middleware que valida todas as permissões
 *
 * @example
 * // Usuário precisa poder criar E deletar
 * app.post('/api/v1/complex-action', {
 *   onRequest: [authenticate, authorizeAll([
 *     ['alunos', 'create'],
 *     ['alunos', 'delete']
 *   ])]
 * }, handler)
 */
export function authorizeAll(permissions: Array<[ResourceType, ActionType]>) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const userRole = request.funcao as FuncaoType | undefined

    if (!userRole) {
      throw UnauthorizedError.authRequired('Autenticação necessária para verificar permissões')
    }

    const hasAllPermissions = permissions.every(([resource, action]) => hasPermission(userRole, resource, action))

    if (!hasAllPermissions) {
      logWarn(`Acesso negado: não tem todas as permissões`, {
        requestId: request.id,
        usuarioId: request.usuarioId,
        userRole,
        requiredPermissions: permissions,
        path: request.url,
      })

      throw UnauthorizedError.insufficientPermission(
        `Sua role "${userRole}" não tem todas as permissões necessárias`,
        userRole,
      )
    }

    logDebug(`✅ Todas as permissões validadas`, {
      requestId: request.id,
      usuarioId: request.usuarioId,
      userRole,
    })
  }
}
