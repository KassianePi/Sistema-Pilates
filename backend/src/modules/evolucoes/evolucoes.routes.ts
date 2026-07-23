import type { FastifyInstance } from 'fastify'
import { criar, listar, buscarPorId, atualizar, excluir, listarMinhasEvolucoes } from './evolucoes.controller'
import { authenticateToken, requireRole } from '../../shared/middlewares/auth.middleware'
import { authorize } from '../../shared/middlewares/rbac.middleware'

export async function evolucoesRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRoute', (routeOptions) => {
    routeOptions.schema = {
      ...routeOptions.schema,
      tags: ['Evolução'],
      ...(Array.isArray(routeOptions.onRequest) && routeOptions.onRequest.includes(authenticateToken)
        ? { security: [{ bearerAuth: [] }] }
        : {}),
    }
  })

  // Rota do portal do aluno
  fastify.get(
    '/api/v1/aluno/evolucoes',
    { onRequest: [authenticateToken, requireRole('ALUNO')] },
    listarMinhasEvolucoes,
  )

  // Rotas admin/staff
  fastify.get('/api/v1/evolucoes', { onRequest: [authenticateToken, authorize('evolucoes', 'read')] }, listar)
  fastify.get('/api/v1/evolucoes/:id', { onRequest: [authenticateToken, authorize('evolucoes', 'read')] }, buscarPorId)
  fastify.post('/api/v1/evolucoes', { onRequest: [authenticateToken, authorize('evolucoes', 'create')] }, criar)
  fastify.put('/api/v1/evolucoes/:id', { onRequest: [authenticateToken, authorize('evolucoes', 'update')] }, atualizar)
  fastify.delete('/api/v1/evolucoes/:id', { onRequest: [authenticateToken, authorize('evolucoes', 'delete')] }, excluir)
}
