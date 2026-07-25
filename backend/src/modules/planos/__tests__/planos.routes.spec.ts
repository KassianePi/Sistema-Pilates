import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { build } from '../../../app'
import type { FastifyInstance } from 'fastify'
import { criarUsuarioComToken, limparUsuariosDeTeste } from '../../../test/route-auth.helper'

let fastify: FastifyInstance
let adminToken: string

beforeAll(async () => {
  fastify = await build()
  ;({ accessToken: adminToken } = await criarUsuarioComToken('ADMIN'))
})

afterAll(async () => {
  await fastify.close()
  await limparUsuariosDeTeste()
})

describe('Planos Routes', () => {
  it('POST /api/v1/planos sem nome retorna 400 (não 500)', async () => {
    const response = await fastify.inject({
      method: 'POST',
      url: '/api/v1/planos',
      headers: { authorization: `Bearer ${adminToken}` },
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
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { nome: `Plano Para Atualizar ${Date.now()}`, aulas: 8, preco: 150 },
    })
    const { id } = JSON.parse(criado.body).data

    const response = await fastify.inject({
      method: 'PUT',
      url: `/api/v1/planos/${id}`,
      headers: { authorization: `Bearer ${adminToken}` },
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
