import type { FastifyInstance } from 'fastify'
import { criar, listar, buscarPorId, atualizar, excluir, alterarStatus } from './alunos.controller'
import { authenticateToken } from '../../shared/middlewares/auth.middleware'
import { authorize } from '../../shared/middlewares/rbac.middleware'

export async function alunosRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRoute', (routeOptions) => {
    routeOptions.schema = {
      ...routeOptions.schema,
      tags: ['Alunos'],
      ...(Array.isArray(routeOptions.onRequest) && routeOptions.onRequest.includes(authenticateToken)
        ? { security: [{ bearerAuth: [] }] }
        : {}),
    }
  })

  fastify.get('/api/v1/alunos', { onRequest: [authenticateToken, authorize('alunos', 'read')] }, listar)
  fastify.get('/api/v1/alunos/:id', { onRequest: [authenticateToken, authorize('alunos', 'read')] }, buscarPorId)
  fastify.post('/api/v1/alunos', { onRequest: [authenticateToken, authorize('alunos', 'create')] }, criar)
  fastify.put('/api/v1/alunos/:id', { onRequest: [authenticateToken, authorize('alunos', 'update')] }, atualizar)
  fastify.delete('/api/v1/alunos/:id', { onRequest: [authenticateToken, authorize('alunos', 'delete')] }, excluir)
  fastify.patch(
    '/api/v1/alunos/:id/status',
    { onRequest: [authenticateToken, authorize('alunos', 'update')] },
    alterarStatus,
  )
}
