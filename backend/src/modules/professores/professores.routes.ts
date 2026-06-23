import type { FastifyInstance } from 'fastify'
import { criar, listar, buscarPorId, atualizar, excluir, alterarStatus } from './professores.controller'
import { authenticateToken } from '../../shared/middlewares/auth.middleware'
import { authorize } from '../../shared/middlewares/rbac.middleware'

export async function professoresRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRoute', (routeOptions) => {
    routeOptions.schema = {
      ...routeOptions.schema,
      tags: ['Professores'],
      ...(Array.isArray(routeOptions.onRequest) && routeOptions.onRequest.includes(authenticateToken)
        ? { security: [{ bearerAuth: [] }] }
        : {}),
    }
  })

  fastify.get('/api/v1/professores', { onRequest: [authenticateToken, authorize('professores', 'read')] }, listar)
  fastify.get(
    '/api/v1/professores/:id',
    { onRequest: [authenticateToken, authorize('professores', 'read')] },
    buscarPorId,
  )
  fastify.post('/api/v1/professores', { onRequest: [authenticateToken, authorize('professores', 'create')] }, criar)
  fastify.put(
    '/api/v1/professores/:id',
    { onRequest: [authenticateToken, authorize('professores', 'update')] },
    atualizar,
  )
  fastify.delete(
    '/api/v1/professores/:id',
    { onRequest: [authenticateToken, authorize('professores', 'delete')] },
    excluir,
  )
  fastify.patch(
    '/api/v1/professores/:id/status',
    { onRequest: [authenticateToken, authorize('professores', 'update')] },
    alterarStatus,
  )
}
