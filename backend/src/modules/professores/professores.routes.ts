import type { FastifyInstance } from 'fastify'
import { criar, listar, buscarPorId, atualizar, excluir } from './professores.controller'
import { authenticateToken } from '../../shared/middlewares/auth.middleware'
import { authorize } from '../../shared/middlewares/rbac.middleware'

export async function professoresRoutes(fastify: FastifyInstance) {
  fastify.get('/api/v1/professores', { onRequest: [authenticateToken] }, listar)
  fastify.get('/api/v1/professores/:id', { onRequest: [authenticateToken] }, buscarPorId)
  fastify.post('/api/v1/professores', { onRequest: [authenticateToken, authorize('users', 'create')] }, criar)
  fastify.put('/api/v1/professores/:id', { onRequest: [authenticateToken, authorize('users', 'update')] }, atualizar)
  fastify.delete('/api/v1/professores/:id', { onRequest: [authenticateToken, authorize('users', 'delete')] }, excluir)
}
