import type { FastifyInstance } from 'fastify'
import { gerar, listar, buscarPorId } from './relatorios.controller'
import { authenticateToken } from '../../shared/middlewares/auth.middleware'
import { authorize } from '../../shared/middlewares/rbac.middleware'

export async function relatoriosRoutes(fastify: FastifyInstance) {
  fastify.get('/api/v1/relatorios', { onRequest: [authenticateToken, authorize('relatorios', 'read')] }, listar)
  fastify.get('/api/v1/relatorios/:id', { onRequest: [authenticateToken, authorize('relatorios', 'read')] }, buscarPorId)
  fastify.post('/api/v1/relatorios/gerar', { onRequest: [authenticateToken, authorize('relatorios', 'create')] }, gerar)
}
