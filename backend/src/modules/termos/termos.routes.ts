import type { FastifyInstance } from 'fastify'
import {
  listar,
  buscarPorId,
  criar,
  editar,
  publicar,
  listarAceites,
  obterStatus,
  aceitar,
  meusAceites,
} from './termos.controller'
import { authenticateToken, requireRole } from '../../shared/middlewares/auth.middleware'
import { authorize } from '../../shared/middlewares/rbac.middleware'

export async function termosRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRoute', (routeOptions) => {
    routeOptions.schema = {
      ...routeOptions.schema,
      tags: ['Termos'],
      ...(Array.isArray(routeOptions.onRequest) && routeOptions.onRequest.includes(authenticateToken)
        ? { security: [{ bearerAuth: [] }] }
        : {}),
    }
  })

  // ----- Portal do aluno -----
  fastify.get('/api/v1/aluno/termos/status', { onRequest: [authenticateToken, requireRole('ALUNO')] }, obterStatus)
  fastify.post('/api/v1/aluno/termos/aceite', { onRequest: [authenticateToken, requireRole('ALUNO')] }, aceitar)
  fastify.get(
    '/api/v1/aluno/termos/meus-aceites',
    { onRequest: [authenticateToken, requireRole('ALUNO')] },
    meusAceites,
  )

  // ----- Administração de termos (ADMIN) -----
  fastify.get('/api/v1/termos', { onRequest: [authenticateToken, authorize('termos', 'read')] }, listar)
  fastify.post('/api/v1/termos', { onRequest: [authenticateToken, authorize('termos', 'create')] }, criar)
  fastify.get('/api/v1/termos/:id', { onRequest: [authenticateToken, authorize('termos', 'read')] }, buscarPorId)
  fastify.put('/api/v1/termos/:id', { onRequest: [authenticateToken, authorize('termos', 'update')] }, editar)
  fastify.post(
    '/api/v1/termos/:id/publicar',
    { onRequest: [authenticateToken, authorize('termos', 'update')] },
    publicar,
  )
  fastify.get(
    '/api/v1/termos/:id/aceites',
    { onRequest: [authenticateToken, authorize('termos', 'read')] },
    listarAceites,
  )
}
