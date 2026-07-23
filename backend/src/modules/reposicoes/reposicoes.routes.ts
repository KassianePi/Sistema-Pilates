import type { FastifyInstance } from 'fastify'
import {
  solicitar,
  listarMinhasReposicoes,
  cancelarMinhaReposicao,
  listar,
  buscarPorId,
  agendar,
  cancelar,
} from './reposicoes.controller'
import { authenticateToken, requireRole } from '../../shared/middlewares/auth.middleware'
import { authorize } from '../../shared/middlewares/rbac.middleware'

export async function reposicoesRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRoute', (routeOptions) => {
    routeOptions.schema = {
      ...routeOptions.schema,
      tags: ['Reposições'],
      ...(Array.isArray(routeOptions.onRequest) && routeOptions.onRequest.includes(authenticateToken)
        ? { security: [{ bearerAuth: [] }] }
        : {}),
    }
  })

  // Rotas do portal do aluno
  fastify.post('/api/v1/aluno/reposicoes', { onRequest: [authenticateToken, requireRole('ALUNO')] }, solicitar)
  fastify.get(
    '/api/v1/aluno/reposicoes',
    { onRequest: [authenticateToken, requireRole('ALUNO')] },
    listarMinhasReposicoes,
  )
  fastify.patch(
    '/api/v1/aluno/reposicoes/:id/cancelar',
    { onRequest: [authenticateToken, requireRole('ALUNO')] },
    cancelarMinhaReposicao,
  )

  // Rotas admin/staff
  fastify.get('/api/v1/reposicoes', { onRequest: [authenticateToken, authorize('reposicoes', 'read')] }, listar)
  fastify.get(
    '/api/v1/reposicoes/:id',
    { onRequest: [authenticateToken, authorize('reposicoes', 'read')] },
    buscarPorId,
  )
  fastify.patch(
    '/api/v1/reposicoes/:id/agendar',
    { onRequest: [authenticateToken, authorize('reposicoes', 'update')] },
    agendar,
  )
  fastify.patch(
    '/api/v1/reposicoes/:id/cancelar',
    { onRequest: [authenticateToken, authorize('reposicoes', 'update')] },
    cancelar,
  )
}
