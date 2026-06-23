import type { FastifyInstance } from 'fastify'
import { registrar, listar, buscarPorId, atualizar, listarMinhasPresencas, registrarBatch } from './presenca.controller'
import { authenticateToken, requireRole } from '../../shared/middlewares/auth.middleware'
import { authorize } from '../../shared/middlewares/rbac.middleware'

export async function presencaRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRoute', (routeOptions) => {
    routeOptions.schema = {
      ...routeOptions.schema,
      tags: ['Presença'],
      ...(Array.isArray(routeOptions.onRequest) && routeOptions.onRequest.includes(authenticateToken)
        ? { security: [{ bearerAuth: [] }] }
        : {}),
    }
  })

  // Rotas do portal do aluno
  fastify.get(
    '/api/v1/aluno/presencas',
    { onRequest: [authenticateToken, requireRole('ALUNO')] },
    listarMinhasPresencas,
  )

  // Rotas admin/staff
  fastify.get('/api/v1/presencas', { onRequest: [authenticateToken, authorize('presenca', 'read')] }, listar)
  fastify.get('/api/v1/presencas/:id', { onRequest: [authenticateToken, authorize('presenca', 'read')] }, buscarPorId)
  fastify.post('/api/v1/presencas', { onRequest: [authenticateToken, authorize('presenca', 'create')] }, registrar)
  fastify.post(
    '/api/v1/presencas/batch',
    { onRequest: [authenticateToken, authorize('presenca', 'create')] },
    registrarBatch,
  )
  fastify.put('/api/v1/presencas/:id', { onRequest: [authenticateToken, authorize('presenca', 'update')] }, atualizar)
}
