import type { FastifyInstance } from 'fastify'
import { gerar, listar, buscarPorId, exportarRelatorio, gerarEExportar } from './relatorios.controller'
import { authenticateToken } from '../../shared/middlewares/auth.middleware'
import { authorize } from '../../shared/middlewares/rbac.middleware'

export async function relatoriosRoutes(fastify: FastifyInstance) {
  fastify.get('/api/v1/relatorios', { onRequest: [authenticateToken, authorize('relatorios', 'read')] }, listar)
  fastify.get('/api/v1/relatorios/:id', { onRequest: [authenticateToken, authorize('relatorios', 'read')] }, buscarPorId)
  fastify.get('/api/v1/relatorios/:id/exportar', { onRequest: [authenticateToken, authorize('relatorios', 'read')] }, exportarRelatorio)
  fastify.post('/api/v1/relatorios/gerar', { onRequest: [authenticateToken, authorize('relatorios', 'create')] }, gerar)
  fastify.post('/api/v1/relatorios/exportar-direto', { onRequest: [authenticateToken, authorize('relatorios', 'create')] }, gerarEExportar)
}
