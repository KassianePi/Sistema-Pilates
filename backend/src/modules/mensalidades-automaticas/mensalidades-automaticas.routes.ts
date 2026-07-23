import type { FastifyInstance } from 'fastify'
import { gerarMensalidadesManualmente, buscarStatusExecucaoAtual } from './mensalidades-automaticas.controller'
import { authenticateToken } from '../../shared/middlewares/auth.middleware'
import { authorize } from '../../shared/middlewares/rbac.middleware'

export async function mensalidadesAutomaticasRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRoute', (routeOptions) => {
    routeOptions.schema = {
      ...routeOptions.schema,
      tags: ['Mensalidades Automáticas'],
      security: [{ bearerAuth: [] }],
    }
  })

  // Execução manual — reutiliza exatamente a mesma lógica do job agendado.
  // Mesma restrição de PUT /configuracao (só ADMIN tem permissão 'sistema').
  fastify.post(
    '/api/v1/mensalidades/gerar-automatico',
    { onRequest: [authenticateToken, authorize('sistema', 'maintenance')] },
    gerarMensalidadesManualmente,
  )

  // Polling de progresso enquanto uma execução está em andamento.
  fastify.get(
    '/api/v1/mensalidades/gerar-automatico/status',
    { onRequest: [authenticateToken, authorize('sistema', 'maintenance')] },
    buscarStatusExecucaoAtual,
  )
}
