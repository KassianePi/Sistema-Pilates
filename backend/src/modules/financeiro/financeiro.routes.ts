import type { FastifyInstance } from 'fastify'
import {
  abrirCaixa, fecharCaixa, caixaAtivo,
  criarMensalidade, listarMensalidades, buscarMensalidadePorId, atualizarMensalidade,
  registrarPagamento, listarPagamentos,
  listarMinhasMensalidades,
  notificarPagamento,
  solicitarAulaAvulsa,
  enviarComprovante,
  listarMeusComprovantes,
  listarComprovantes,
  analisarComprovante,
} from './financeiro.controller'
import { authenticateToken, requireRole } from '../../shared/middlewares/auth.middleware'
import { authorize } from '../../shared/middlewares/rbac.middleware'

export async function financeiroRoutes(fastify: FastifyInstance) {
  // Caixa
  fastify.get('/api/v1/caixa/ativo', { onRequest: [authenticateToken, authorize('pagamentos', 'read')] }, caixaAtivo)
  fastify.post('/api/v1/caixa/abrir', { onRequest: [authenticateToken, authorize('pagamentos', 'create')] }, abrirCaixa)
  fastify.patch('/api/v1/caixa/:id/fechar', { onRequest: [authenticateToken, authorize('pagamentos', 'update')] }, fecharCaixa)

  // Mensalidades (admin/financeiro)
  fastify.get('/api/v1/mensalidades', { onRequest: [authenticateToken, authorize('pagamentos', 'read')] }, listarMensalidades)
  fastify.get('/api/v1/mensalidades/:id', { onRequest: [authenticateToken, authorize('pagamentos', 'read')] }, buscarMensalidadePorId)
  fastify.post('/api/v1/mensalidades', { onRequest: [authenticateToken, authorize('pagamentos', 'create')] }, criarMensalidade)
  fastify.put('/api/v1/mensalidades/:id', { onRequest: [authenticateToken, authorize('pagamentos', 'update')] }, atualizarMensalidade)

  // Pagamentos (admin/financeiro)
  fastify.get('/api/v1/pagamentos', { onRequest: [authenticateToken, authorize('pagamentos', 'read')] }, listarPagamentos)
  fastify.post('/api/v1/pagamentos', { onRequest: [authenticateToken, authorize('pagamentos', 'create')] }, registrarPagamento)

  // Rotas do portal do aluno
  fastify.get('/api/v1/aluno/mensalidades', { onRequest: [authenticateToken, requireRole('ALUNO')] }, listarMinhasMensalidades)
  fastify.post('/api/v1/aluno/notificar-pagamento', { onRequest: [authenticateToken, requireRole('ALUNO')] }, notificarPagamento)
  fastify.post('/api/v1/aluno/solicitar-avulsa', { onRequest: [authenticateToken, requireRole('ALUNO')] }, solicitarAulaAvulsa)
  fastify.post('/api/v1/aluno/comprovantes', { onRequest: [authenticateToken, requireRole('ALUNO')] }, enviarComprovante)
  fastify.get('/api/v1/aluno/comprovantes', { onRequest: [authenticateToken, requireRole('ALUNO')] }, listarMeusComprovantes)

  // Comprovantes — admin/financeiro
  fastify.get('/api/v1/comprovantes', { onRequest: [authenticateToken, authorize('pagamentos', 'read')] }, listarComprovantes)
  fastify.patch('/api/v1/comprovantes/:id/analisar', { onRequest: [authenticateToken, authorize('pagamentos', 'update')] }, analisarComprovante)
}
