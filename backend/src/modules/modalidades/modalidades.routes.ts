import type { FastifyInstance } from 'fastify'
import { listarModalidades, buscarModalidade, criarModalidade, atualizarModalidade, excluirModalidade } from './modalidades.controller'
import { authenticateToken } from '../../shared/middlewares/auth.middleware'
import { authorize } from '../../shared/middlewares/rbac.middleware'

export async function modalidadesRoutes(fastify: FastifyInstance) {
  // Leitura — qualquer usuário autenticado (admin, professor, recepcionista)
  fastify.get('/api/v1/modalidades', { onRequest: [authenticateToken] }, listarModalidades)
  fastify.get('/api/v1/modalidades/:id', { onRequest: [authenticateToken] }, buscarModalidade)

  // Escrita — apenas quem tem permissão de agenda:create/update/delete
  fastify.post('/api/v1/modalidades', { onRequest: [authenticateToken, authorize('agenda', 'create')] }, criarModalidade)
  fastify.put('/api/v1/modalidades/:id', { onRequest: [authenticateToken, authorize('agenda', 'update')] }, atualizarModalidade)
  fastify.delete('/api/v1/modalidades/:id', { onRequest: [authenticateToken, authorize('agenda', 'delete')] }, excluirModalidade)
}
