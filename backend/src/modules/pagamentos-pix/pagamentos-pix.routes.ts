import type { FastifyInstance } from 'fastify'
import {
  solicitarCobranca,
  consultarCobranca,
  sincronizarCobranca,
  receberWebhookMercadoPago,
} from './pagamentos-pix.controller'
import { authenticateToken, requireRole } from '../../shared/middlewares/auth.middleware'

export async function pagamentosPixRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRoute', (routeOptions) => {
    routeOptions.schema = {
      ...routeOptions.schema,
      tags: ['Pagamentos PIX'],
      ...(Array.isArray(routeOptions.onRequest) && routeOptions.onRequest.includes(authenticateToken)
        ? { security: [{ bearerAuth: [] }] }
        : {}),
    }
  })

  fastify.post(
    '/api/v1/aluno/mensalidades/:mensalidadeId/pix',
    { onRequest: [authenticateToken, requireRole('ALUNO')] },
    solicitarCobranca,
  )
  fastify.get(
    '/api/v1/aluno/mensalidades/:mensalidadeId/pix',
    { onRequest: [authenticateToken, requireRole('ALUNO')] },
    consultarCobranca,
  )
  fastify.post(
    '/api/v1/aluno/mensalidades/:mensalidadeId/pix/sincronizar',
    { onRequest: [authenticateToken, requireRole('ALUNO')] },
    sincronizarCobranca,
  )
}

/**
 * Rota pública do webhook do Mercado Pago — registrada separadamente em
 * `app.ts` dentro de um grupo com rate-limit próprio (mesmo padrão do grupo
 * de login), já que não passa por `authenticateToken`. A segurança aqui é a
 * validação de assinatura (`x-signature`), não RBAC.
 */
export async function pagamentosPixWebhookRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRoute', (routeOptions) => {
    routeOptions.schema = { ...routeOptions.schema, tags: ['Pagamentos PIX'] }
  })

  fastify.post('/api/v1/webhooks/mercadopago', receberWebhookMercadoPago)
}
