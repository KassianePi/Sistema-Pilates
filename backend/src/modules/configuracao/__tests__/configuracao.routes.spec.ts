import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { build } from '../../../app'
import type { FastifyInstance } from 'fastify'
import { criarUsuarioComToken, limparUsuariosDeTeste } from '../../../test/route-auth.helper'

let fastify: FastifyInstance
let adminToken: string
let recepcionistaToken: string
let alunoToken: string

beforeAll(async () => {
  fastify = await build()
  ;({ accessToken: adminToken } = await criarUsuarioComToken('ADMIN'))
  ;({ accessToken: recepcionistaToken } = await criarUsuarioComToken('RECEPCIONISTA'))
  ;({ accessToken: alunoToken } = await criarUsuarioComToken('ALUNO'))
})

afterAll(async () => {
  await fastify.close()
  await limparUsuariosDeTeste()
})

describe('Configuracao Routes', () => {
  it('GET /api/v1/configuracao permite qualquer usuário autenticado (inclusive ALUNO)', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/api/v1/configuracao',
      headers: { authorization: `Bearer ${alunoToken}` },
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.success).toBe(true)
  })

  it('GET /api/v1/configuracao sem token retorna 401', async () => {
    const response = await fastify.inject({ method: 'GET', url: '/api/v1/configuracao' })
    expect(response.statusCode).toBe(401)
  })

  it('PUT /api/v1/configuracao bloqueia quem não é ADMIN', async () => {
    const response = await fastify.inject({
      method: 'PUT',
      url: '/api/v1/configuracao',
      headers: { authorization: `Bearer ${recepcionistaToken}` },
      payload: { tipoChavePix: 'EMAIL' },
    })

    expect(response.statusCode).toBe(403)
  })

  it('PUT /api/v1/configuracao com tipoChavePix inválido retorna 400 (não 500)', async () => {
    const response = await fastify.inject({
      method: 'PUT',
      url: '/api/v1/configuracao',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { tipoChavePix: 'BITCOIN' },
    })

    expect(response.statusCode).toBe(400)
    const body = JSON.parse(response.body)
    expect(body.success).toBe(false)
  })

  it('PUT /api/v1/configuracao com dados válidos retorna 200', async () => {
    const response = await fastify.inject({
      method: 'PUT',
      url: '/api/v1/configuracao',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { chavePix: 'studio@pilates.local', tipoChavePix: 'EMAIL', nomeRecebedor: 'Studio Pilates' },
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.success).toBe(true)
    expect(body.data.tipoChavePix).toBe('EMAIL')
  })
})
