import type { FastifyInstance } from 'fastify'
import { criar, listar, buscarPorId, atualizar, cancelar, listarAulasAluno } from './agenda.controller'
import { authenticateToken, requireRole } from '../../shared/middlewares/auth.middleware'
import { authorize } from '../../shared/middlewares/rbac.middleware'

export async function agendaRoutes(fastify: FastifyInstance) {
  // Rota do portal do aluno — agenda pública de aulas AGENDADAS
  fastify.get('/api/v1/aluno/aulas', { onRequest: [authenticateToken, requireRole('ALUNO')] }, listarAulasAluno)

  // Rotas admin/staff
  fastify.get('/api/v1/aulas', { onRequest: [authenticateToken, authorize('agenda', 'read')] }, listar)
  fastify.get('/api/v1/aulas/:id', { onRequest: [authenticateToken, authorize('agenda', 'read')] }, buscarPorId)
  fastify.post('/api/v1/aulas', { onRequest: [authenticateToken, authorize('agenda', 'create')] }, criar)
  fastify.put('/api/v1/aulas/:id', { onRequest: [authenticateToken, authorize('agenda', 'update')] }, atualizar)
  fastify.patch('/api/v1/aulas/:id/cancelar', { onRequest: [authenticateToken, authorize('agenda', 'update')] }, cancelar)
}
