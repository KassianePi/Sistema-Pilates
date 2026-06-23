import type { FastifyInstance } from 'fastify'
import { listar, exportarCsv } from './auditoria.controller'
import { authenticateToken } from '../../shared/middlewares/auth.middleware'
import { authorize } from '../../shared/middlewares/rbac.middleware'

export async function auditoriaRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRoute', (routeOptions) => {
    routeOptions.schema = {
      ...routeOptions.schema,
      tags: ['Auditoria'],
      ...(Array.isArray(routeOptions.onRequest) && routeOptions.onRequest.includes(authenticateToken)
        ? { security: [{ bearerAuth: [] }] }
        : {}),
    }
  })

  fastify.get('/api/v1/auditoria', { onRequest: [authenticateToken, authorize('auditoria', 'read')] }, listar)
  fastify.get(
    '/api/v1/auditoria/exportar',
    { onRequest: [authenticateToken, authorize('auditoria', 'read')] },
    exportarCsv,
  )
}
