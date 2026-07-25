import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { build } from '../../../app'
import type { FastifyInstance } from 'fastify'
import { criarUsuarioComToken, limparUsuariosDeTeste } from '../../../test/route-auth.helper'

let fastify: FastifyInstance
// Notificacao.usuarioId tem FK real para Usuario — usamos usuários criados de
// verdade (não IDs fabricados) para as rotas que de fato criam registros.
let adminToken: string
let adminUsuarioId: string
let professorToken: string
let professorUsuarioId: string
let alunoToken: string

beforeAll(async () => {
  fastify = await build()
  ;({ accessToken: adminToken, usuarioId: adminUsuarioId } = await criarUsuarioComToken('ADMIN'))
  ;({ accessToken: professorToken, usuarioId: professorUsuarioId } = await criarUsuarioComToken('PROFESSOR'))
  ;({ accessToken: alunoToken } = await criarUsuarioComToken('ALUNO'))
})

afterAll(async () => {
  await fastify.close()
  await limparUsuariosDeTeste()
})

describe('Notificacoes Routes', () => {
  it('GET /api/v1/notificacoes sem token retorna 401', async () => {
    const response = await fastify.inject({ method: 'GET', url: '/api/v1/notificacoes' })
    expect(response.statusCode).toBe(401)
  })

  it('GET /api/v1/notificacoes permite qualquer usuário autenticado', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/api/v1/notificacoes',
      headers: { authorization: `Bearer ${alunoToken}` },
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
      headers: { authorization: `Bearer ${professorToken}` },
      payload: { usuarioId: 'algum-id', tipo: 'MENSAGEM_ADMIN', titulo: 'Oi', mensagem: 'Teste' },
    })

    expect(response.statusCode).toBe(403)
  })

  it('PATCH /api/v1/notificacoes/:id/ler de uma notificação de outro usuário retorna 400 (não 500)', async () => {
    // Cria a notificação para o professor e tenta marcar como lida autenticado como admin
    const createResponse = await fastify.inject({
      method: 'POST',
      url: '/api/v1/notificacoes',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { usuarioId: professorUsuarioId, tipo: 'MENSAGEM_ADMIN', titulo: 'Oi', mensagem: 'Teste' },
    })
    expect(createResponse.statusCode).toBe(201)
    const created = JSON.parse(createResponse.body).data

    const response = await fastify.inject({
      method: 'PATCH',
      url: `/api/v1/notificacoes/${created.id}/ler`,
      headers: { authorization: `Bearer ${adminToken}` },
    })

    expect(response.statusCode).toBe(400)
    const body = JSON.parse(response.body)
    expect(body.success).toBe(false)
  })

  it('PATCH /api/v1/notificacoes/:id/ler marca como lida quando pertence ao usuário autenticado', async () => {
    const createResponse = await fastify.inject({
      method: 'POST',
      url: '/api/v1/notificacoes',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { usuarioId: professorUsuarioId, tipo: 'MENSAGEM_ADMIN', titulo: 'Oi', mensagem: 'Teste' },
    })
    const created = JSON.parse(createResponse.body).data

    const response = await fastify.inject({
      method: 'PATCH',
      url: `/api/v1/notificacoes/${created.id}/ler`,
      headers: { authorization: `Bearer ${professorToken}` },
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.data.status).toBe('LIDA')
  })
})
