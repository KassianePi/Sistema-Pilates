import type { FastifyInstance } from 'fastify'
import { registrar, listar, buscarPorId, atualizar } from './presenca.controller'
import { authenticateToken } from '../../shared/middlewares/auth.middleware'
import { authorize } from '../../shared/middlewares/rbac.middleware'

export async function presencaRoutes(fastify: FastifyInstance) {
  fastify.get('/api/v1/presencas', { onRequest: [authenticateToken, authorize('presenca', 'read')] }, listar)
  fastify.get('/api/v1/presencas/:id', { onRequest: [authenticateToken, authorize('presenca', 'read')] }, buscarPorId)
  fastify.post('/api/v1/presencas', { onRequest: [authenticateToken, authorize('presenca', 'create')] }, registrar)
  fastify.put('/api/v1/presencas/:id', { onRequest: [authenticateToken, authorize('presenca', 'update')] }, atualizar)
}
