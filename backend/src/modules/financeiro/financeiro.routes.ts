import type { FastifyInstance } from 'fastify'
import {
  abrirCaixa, fecharCaixa, caixaAtivo,
  criarMensalidade, listarMensalidades, buscarMensalidadePorId, atualizarMensalidade,
  registrarPagamento, listarPagamentos,
} from './financeiro.controller'
import { authenticateToken } from '../../shared/middlewares/auth.middleware'
import { authorize } from '../../shared/middlewares/rbac.middleware'

export async function financeiroRoutes(fastify: FastifyInstance) {
  // Caixa
  fastify.get('/api/v1/caixa/ativo', { onRequest: [authenticateToken, authorize('pagamentos', 'read')] }, caixaAtivo)
  fastify.post('/api/v1/caixa/abrir', { onRequest: [authenticateToken, authorize('pagamentos', 'create')] }, abrirCaixa)
  fastify.patch('/api/v1/caixa/:id/fechar', { onRequest: [authenticateToken, authorize('pagamentos', 'update')] }, fecharCaixa)

  // Mensalidades
  fastify.get('/api/v1/mensalidades', { onRequest: [authenticateToken, authorize('pagamentos', 'read')] }, listarMensalidades)
  fastify.get('/api/v1/mensalidades/:id', { onRequest: [authenticateToken, authorize('pagamentos', 'read')] }, buscarMensalidadePorId)
  fastify.post('/api/v1/mensalidades', { onRequest: [authenticateToken, authorize('pagamentos', 'create')] }, criarMensalidade)
  fastify.put('/api/v1/mensalidades/:id', { onRequest: [authenticateToken, authorize('pagamentos', 'update')] }, atualizarMensalidade)

  // Pagamentos
  fastify.get('/api/v1/pagamentos', { onRequest: [authenticateToken, authorize('pagamentos', 'read')] }, listarPagamentos)
  fastify.post('/api/v1/pagamentos', { onRequest: [authenticateToken, authorize('pagamentos', 'create')] }, registrarPagamento)
}
