import type { FastifyInstance } from 'fastify'
import { criar, listar, buscarPorId, atualizar, excluir } from './planos.controller'
import { authenticateToken } from '../../shared/middlewares/auth.middleware'
import { authorize } from '../../shared/middlewares/rbac.middleware'

export async function planosRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRoute', (routeOptions) => {
    routeOptions.schema = {
      ...routeOptions.schema,
      tags: ['Planos'],
      ...(Array.isArray(routeOptions.onRequest) && routeOptions.onRequest.includes(authenticateToken)
        ? { security: [{ bearerAuth: [] }] }
        : {}),
    }
  })

  // GET /api/v1/planos — todos os autenticados
  fastify.get('/api/v1/planos', { onRequest: [authenticateToken] }, listar)

  // GET /api/v1/planos/:id — todos os autenticados
  fastify.get('/api/v1/planos/:id', { onRequest: [authenticateToken] }, buscarPorId)

  // POST /api/v1/planos — admin
  fastify.post('/api/v1/planos', { onRequest: [authenticateToken, authorize('sistema', 'create')] }, criar)

  // PUT /api/v1/planos/:id — admin
  fastify.put('/api/v1/planos/:id', { onRequest: [authenticateToken, authorize('sistema', 'update')] }, atualizar)

  // DELETE /api/v1/planos/:id — admin
  fastify.delete('/api/v1/planos/:id', { onRequest: [authenticateToken, authorize('sistema', 'delete')] }, excluir)
}
