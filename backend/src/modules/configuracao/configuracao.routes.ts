import type { FastifyInstance } from 'fastify'
import { buscarConfiguracao, salvarConfiguracao } from './configuracao.controller'
import { authenticateToken } from '../../shared/middlewares/auth.middleware'
import { authorize } from '../../shared/middlewares/rbac.middleware'

export async function configuracaoRoutes(fastify: FastifyInstance) {
  // Qualquer usuário autenticado pode ver (o aluno precisa ver o PIX)
  fastify.get('/api/v1/configuracao', { onRequest: [authenticateToken] }, buscarConfiguracao)
  // Somente ADMIN pode salvar
  fastify.put('/api/v1/configuracao', { onRequest: [authenticateToken, authorize('sistema', 'config')] }, salvarConfiguracao)
}
