import type { FastifyInstance } from 'fastify'
import {
  criar,
  listar,
  buscarPorId,
  atualizar,
  cancelar,
  suspender,
  reagendar,
  excluir,
  listarInscritos,
  matricular,
  listarAulasAluno,
} from './agenda.controller'
import { authenticateToken, requireRole } from '../../shared/middlewares/auth.middleware'
import { authorize } from '../../shared/middlewares/rbac.middleware'

export async function agendaRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRoute', (routeOptions) => {
    routeOptions.schema = {
      ...routeOptions.schema,
      tags: ['Agenda'],
      ...(Array.isArray(routeOptions.onRequest) && routeOptions.onRequest.includes(authenticateToken)
        ? { security: [{ bearerAuth: [] }] }
        : {}),
    }
  })

  // Rota do portal do aluno — agenda pública de aulas AGENDADAS
  fastify.get('/api/v1/aluno/aulas', { onRequest: [authenticateToken, requireRole('ALUNO')] }, listarAulasAluno)

  // Rotas admin/staff
  fastify.get('/api/v1/aulas', { onRequest: [authenticateToken, authorize('agenda', 'read')] }, listar)
  fastify.get('/api/v1/aulas/:id', { onRequest: [authenticateToken, authorize('agenda', 'read')] }, buscarPorId)
  fastify.post('/api/v1/aulas', { onRequest: [authenticateToken, authorize('agenda', 'create')] }, criar)
  fastify.put('/api/v1/aulas/:id', { onRequest: [authenticateToken, authorize('agenda', 'update')] }, atualizar)

  // Ações de gestão da aula — todas exigem justificativa
  fastify.patch(
    '/api/v1/aulas/:id/cancelar',
    { onRequest: [authenticateToken, authorize('agenda', 'update')] },
    cancelar,
  )
  fastify.patch(
    '/api/v1/aulas/:id/suspender',
    { onRequest: [authenticateToken, authorize('agenda', 'update')] },
    suspender,
  )
  fastify.patch(
    '/api/v1/aulas/:id/reagendar',
    { onRequest: [authenticateToken, authorize('agenda', 'update')] },
    reagendar,
  )
  fastify.delete('/api/v1/aulas/:id', { onRequest: [authenticateToken, authorize('agenda', 'delete')] }, excluir)

  // Matrícula de alunos na aula
  fastify.get(
    '/api/v1/aulas/:id/inscricoes',
    { onRequest: [authenticateToken, authorize('agenda', 'read')] },
    listarInscritos,
  )
  fastify.put(
    '/api/v1/aulas/:id/inscricoes',
    { onRequest: [authenticateToken, authorize('agenda', 'update')] },
    matricular,
  )
}
