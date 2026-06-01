import type { FastifyInstance } from 'fastify'
import { criar, listar, buscarPorId, atualizar, cancelar } from './agenda.controller'
import { authenticateToken } from '../../shared/middlewares/auth.middleware'
import { authorize } from '../../shared/middlewares/rbac.middleware'

export async function agendaRoutes(fastify: FastifyInstance) {
  fastify.get('/api/v1/aulas', { onRequest: [authenticateToken, authorize('agenda', 'read')] }, listar)
  fastify.get('/api/v1/aulas/:id', { onRequest: [authenticateToken, authorize('agenda', 'read')] }, buscarPorId)
  fastify.post('/api/v1/aulas', { onRequest: [authenticateToken, authorize('agenda', 'create')] }, criar)
  fastify.put('/api/v1/aulas/:id', { onRequest: [authenticateToken, authorize('agenda', 'update')] }, atualizar)
  fastify.patch('/api/v1/aulas/:id/cancelar', { onRequest: [authenticateToken, authorize('agenda', 'update')] }, cancelar)
}
