import type { FastifyInstance } from 'fastify'
import { listarAlunos, resumo, detalheAluno } from './acompanhamento.controller'
import { authenticateToken } from '../../shared/middlewares/auth.middleware'
import { authorize } from '../../shared/middlewares/rbac.middleware'

export async function acompanhamentoRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/api/v1/acompanhamento/alunos',
    { onRequest: [authenticateToken, authorize('acompanhamento', 'read')] },
    listarAlunos,
  )
  fastify.get(
    '/api/v1/acompanhamento/resumo',
    { onRequest: [authenticateToken, authorize('acompanhamento', 'read')] },
    resumo,
  )
  fastify.get(
    '/api/v1/acompanhamento/alunos/:id',
    { onRequest: [authenticateToken, authorize('acompanhamento', 'read')] },
    detalheAluno,
  )
}
