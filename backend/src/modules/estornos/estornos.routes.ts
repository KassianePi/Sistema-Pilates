import type { FastifyInstance } from 'fastify'
import {
  solicitarEstorno,
  listarEstornos,
  buscarEstorno,
  aprovarEstorno,
  negarEstorno,
  processarEstorno,
  listarMeusEstornos,
} from './estornos.controller'
import { authenticateToken, requireRole } from '../../shared/middlewares/auth.middleware'
import { authorize } from '../../shared/middlewares/rbac.middleware'

export async function estornosRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRoute', (routeOptions) => {
    routeOptions.schema = {
      ...routeOptions.schema,
      tags: ['Estornos'],
      ...(Array.isArray(routeOptions.onRequest) && routeOptions.onRequest.includes(authenticateToken)
        ? { security: [{ bearerAuth: [] }] }
        : {}),
    }
  })

  // Portal do aluno
  fastify.post('/api/v1/estornos', { onRequest: [authenticateToken, requireRole('ALUNO')] }, solicitarEstorno)
  fastify.get('/api/v1/aluno/estornos', { onRequest: [authenticateToken, requireRole('ALUNO')] }, listarMeusEstornos)

  // Admin/Financeiro lista e gerencia
  fastify.get('/api/v1/estornos', { onRequest: [authenticateToken, authorize('pagamentos', 'read')] }, listarEstornos)
  fastify.get(
    '/api/v1/estornos/:id',
    { onRequest: [authenticateToken, authorize('pagamentos', 'read')] },
    buscarEstorno,
  )
  fastify.patch(
    '/api/v1/estornos/:id/aprovar',
    { onRequest: [authenticateToken, authorize('pagamentos', 'refund')] },
    aprovarEstorno,
  )
  fastify.patch(
    '/api/v1/estornos/:id/negar',
    { onRequest: [authenticateToken, authorize('pagamentos', 'refund')] },
    negarEstorno,
  )
  fastify.patch(
    '/api/v1/estornos/:id/processar',
    { onRequest: [authenticateToken, authorize('pagamentos', 'refund')] },
    processarEstorno,
  )
}
