import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { build } from '../../../app'
import type { FastifyInstance } from 'fastify'
import { generateTokens } from '../../../shared/utils/jwt'

let fastify: FastifyInstance

function tokenFor(funcao: 'ADMIN' | 'PROFESSOR' | 'RECEPCIONISTA' | 'FINANCEIRO' | 'ALUNO') {
  return generateTokens({ usuarioId: 'usuario-fake-id', email: 'teste@pilates.local', funcao }).accessToken
}

beforeAll(async () => {
  fastify = await build()
})

afterAll(async () => {
  await fastify.close()
})

describe('Planos Routes', () => {
  it('POST /api/v1/planos sem nome retorna 400 (não 500)', async () => {
    const response = await fastify.inject({
      method: 'POST',
      url: '/api/v1/planos',
      headers: { authorization: `Bearer ${tokenFor('ADMIN')}` },
      payload: { aulas: 8, preco: 150 },
    })

    expect(response.statusCode).toBe(400)
    const body = JSON.parse(response.body)
    expect(body.success).toBe(false)
  })

  it('PUT /api/v1/planos/:id com preco em formato inválido retorna 400 (não 500)', async () => {
    const criado = await fastify.inject({
      method: 'POST',
      url: '/api/v1/planos',
      headers: { authorization: `Bearer ${tokenFor('ADMIN')}` },
      payload: { nome: `Plano Para Atualizar ${Date.now()}`, aulas: 8, preco: 150 },
    })
    const { id } = JSON.parse(criado.body).data

    const response = await fastify.inject({
      method: 'PUT',
      url: `/api/v1/planos/${id}`,
      headers: { authorization: `Bearer ${tokenFor('ADMIN')}` },
      payload: { preco: 'não-é-número' },
    })

    expect(response.statusCode).toBe(400)
  })

  it('POST /api/v1/planos sem token retorna 401', async () => {
    const response = await fastify.inject({
      method: 'POST',
      url: '/api/v1/planos',
      payload: { nome: 'Plano Teste' },
    })

    expect(response.statusCode).toBe(401)
  })
})
