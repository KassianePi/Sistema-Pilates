import type { FastifyInstance } from 'fastify'
import { listar } from './auditoria.controller'
import { authenticateToken } from '../../shared/middlewares/auth.middleware'
import { authorize } from '../../shared/middlewares/rbac.middleware'

export async function auditoriaRoutes(fastify: FastifyInstance) {
  fastify.get('/api/v1/auditoria', { onRequest: [authenticateToken, authorize('auditoria', 'read')] }, listar)
}
