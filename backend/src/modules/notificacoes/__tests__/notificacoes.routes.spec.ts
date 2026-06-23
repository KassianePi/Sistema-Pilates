import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { build } from '../../../app'
import type { FastifyInstance } from 'fastify'
import { generateTokens } from '../../../shared/utils/jwt'

let fastify: FastifyInstance
// Notificacao.usuarioId tem FK real para Usuario — usamos usuários seedados
// de verdade (não IDs fabricados) para as rotas que de fato criam registros.
let adminUsuarioId: string
let professoraUsuarioId: string

function tokenFor(
  funcao: 'ADMIN' | 'PROFESSOR' | 'RECEPCIONISTA' | 'FINANCEIRO' | 'ALUNO',
  usuarioId = 'usuario-fake-id',
) {
  return generateTokens({ usuarioId, email: 'teste@pilates.local', funcao }).accessToken
}

async function loginAndGetUsuarioId(email: string, senha: string): Promise<string> {
  const response = await fastify.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { email, senha } })
  return JSON.parse(response.body).data.usuarioId
}

beforeAll(async () => {
  fastify = await build()
  adminUsuarioId = await loginAndGetUsuarioId('admin@pilates.local', 'admin123')
  professoraUsuarioId = await loginAndGetUsuarioId('professora@pilates.local', 'prof123')
})

afterAll(async () => {
  await fastify.close()
})

describe('Notificacoes Routes', () => {
  it('GET /api/v1/notificacoes sem token retorna 401', async () => {
    const response = await fastify.inject({ method: 'GET', url: '/api/v1/notificacoes' })
    expect(response.statusCode).toBe(401)
  })

  it('GET /api/v1/notificacoes permite qualquer usuário autenticado', async () => {
    // usuarioId precisa ter formato de UUID — listNotificacoesSchema valida isso
    const response = await fastify.inject({
      method: 'GET',
      url: '/api/v1/notificacoes',
      headers: { authorization: `Bearer ${tokenFor('ALUNO', '00000000-0000-0000-0000-000000000000')}` },
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.success).toBe(true)
    expect(body.data.notificacoes).toBeDefined()
  })

  it('POST /api/v1/notificacoes exige permissão sistema:create — bloqueia PROFESSOR', async () => {
    const response = await fastify.inject({
      method: 'POST',
      url: '/api/v1/notificacoes',
      headers: { authorization: `Bearer ${tokenFor('PROFESSOR')}` },
      payload: { usuarioId: 'algum-id', tipo: 'MENSAGEM_ADMIN', titulo: 'Oi', mensagem: 'Teste' },
    })

    expect(response.statusCode).toBe(403)
  })

  it('PATCH /api/v1/notificacoes/:id/ler de uma notificação de outro usuário retorna 400 (não 500)', async () => {
    // Cria a notificação para a professora e tenta marcar como lida autenticado como admin
    const createResponse = await fastify.inject({
      method: 'POST',
      url: '/api/v1/notificacoes',
      headers: { authorization: `Bearer ${tokenFor('ADMIN', adminUsuarioId)}` },
      payload: { usuarioId: professoraUsuarioId, tipo: 'MENSAGEM_ADMIN', titulo: 'Oi', mensagem: 'Teste' },
    })
    expect(createResponse.statusCode).toBe(201)
    const created = JSON.parse(createResponse.body).data

    const response = await fastify.inject({
      method: 'PATCH',
      url: `/api/v1/notificacoes/${created.id}/ler`,
      headers: { authorization: `Bearer ${tokenFor('ADMIN', adminUsuarioId)}` },
    })

    expect(response.statusCode).toBe(400)
    const body = JSON.parse(response.body)
    expect(body.success).toBe(false)
  })

  it('PATCH /api/v1/notificacoes/:id/ler marca como lida quando pertence ao usuário autenticado', async () => {
    const createResponse = await fastify.inject({
      method: 'POST',
      url: '/api/v1/notificacoes',
      headers: { authorization: `Bearer ${tokenFor('ADMIN', adminUsuarioId)}` },
      payload: { usuarioId: professoraUsuarioId, tipo: 'MENSAGEM_ADMIN', titulo: 'Oi', mensagem: 'Teste' },
    })
    const created = JSON.parse(createResponse.body).data

    const response = await fastify.inject({
      method: 'PATCH',
      url: `/api/v1/notificacoes/${created.id}/ler`,
      headers: { authorization: `Bearer ${tokenFor('PROFESSOR', professoraUsuarioId)}` },
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.data.status).toBe('LIDA')
  })
})
