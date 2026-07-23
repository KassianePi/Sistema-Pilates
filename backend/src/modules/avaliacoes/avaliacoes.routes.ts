import type { FastifyInstance } from 'fastify'
import { criar, listar, buscarPorId, atualizar, excluir, listarMinhasAvaliacoes } from './avaliacoes.controller'
import { authenticateToken, requireRole } from '../../shared/middlewares/auth.middleware'
import { authorize } from '../../shared/middlewares/rbac.middleware'

export async function avaliacoesRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRoute', (routeOptions) => {
    routeOptions.schema = {
      ...routeOptions.schema,
      tags: ['Avaliações'],
      ...(Array.isArray(routeOptions.onRequest) && routeOptions.onRequest.includes(authenticateToken)
        ? { security: [{ bearerAuth: [] }] }
        : {}),
    }
  })

  // Rota do portal do aluno
  fastify.get(
    '/api/v1/aluno/avaliacoes',
    { onRequest: [authenticateToken, requireRole('ALUNO')] },
    listarMinhasAvaliacoes,
  )

  // Rotas admin/staff
  fastify.get('/api/v1/avaliacoes', { onRequest: [authenticateToken, authorize('avaliacoes', 'read')] }, listar)
  fastify.get(
    '/api/v1/avaliacoes/:id',
    { onRequest: [authenticateToken, authorize('avaliacoes', 'read')] },
    buscarPorId,
  )
  fastify.post('/api/v1/avaliacoes', { onRequest: [authenticateToken, authorize('avaliacoes', 'create')] }, criar)
  fastify.put(
    '/api/v1/avaliacoes/:id',
    { onRequest: [authenticateToken, authorize('avaliacoes', 'update')] },
    atualizar,
  )
  fastify.delete(
    '/api/v1/avaliacoes/:id',
    { onRequest: [authenticateToken, authorize('avaliacoes', 'delete')] },
    excluir,
  )
}
