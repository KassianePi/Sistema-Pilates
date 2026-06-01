import type { FastifyInstance } from 'fastify'
import { listar, marcarComoLida, arquivar } from './notificacoes.controller'
import { authenticateToken } from '../../shared/middlewares/auth.middleware'

export async function notificacoesRoutes(fastify: FastifyInstance) {
  fastify.get('/api/v1/notificacoes', { onRequest: [authenticateToken] }, listar)
  fastify.patch('/api/v1/notificacoes/:id/ler', { onRequest: [authenticateToken] }, marcarComoLida)
  fastify.patch('/api/v1/notificacoes/:id/arquivar', { onRequest: [authenticateToken] }, arquivar)
}
