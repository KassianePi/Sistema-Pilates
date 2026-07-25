import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { build } from '../../../app'
import type { FastifyInstance } from 'fastify'
import { criarUsuarioComToken, limparUsuariosDeTeste } from '../../../test/route-auth.helper'

let fastify: FastifyInstance
let adminToken: string
let professorToken: string
let alunoToken: string

beforeAll(async () => {
  fastify = await build()
  ;({ accessToken: adminToken } = await criarUsuarioComToken('ADMIN'))
  ;({ accessToken: professorToken } = await criarUsuarioComToken('PROFESSOR'))
  ;({ accessToken: alunoToken } = await criarUsuarioComToken('ALUNO'))
})

afterAll(async () => {
  await fastify.close()
  await limparUsuariosDeTeste()
})

describe('Pagamentos PIX Routes', () => {
  it('POST /api/v1/aluno/mensalidades/:id/pix sem token retorna 401', async () => {
    const response = await fastify.inject({
      method: 'POST',
      url: '/api/v1/aluno/mensalidades/00000000-0000-0000-0000-000000000000/pix',
    })

    expect(response.statusCode).toBe(401)
  })

  it('POST /api/v1/aluno/mensalidades/:id/pix com role ADMIN retorna 403 (rota exclusiva do aluno)', async () => {
    const response = await fastify.inject({
      method: 'POST',
      url: '/api/v1/aluno/mensalidades/00000000-0000-0000-0000-000000000000/pix',
      headers: { authorization: `Bearer ${adminToken}` },
    })

    expect(response.statusCode).toBe(403)
  })

  it('GET /api/v1/aluno/mensalidades/:id/pix sem token retorna 401', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/api/v1/aluno/mensalidades/00000000-0000-0000-0000-000000000000/pix',
    })

    expect(response.statusCode).toBe(401)
  })

  it('GET /api/v1/aluno/mensalidades/:id/pix com role PROFESSOR retorna 403 (rota exclusiva do aluno)', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/api/v1/aluno/mensalidades/00000000-0000-0000-0000-000000000000/pix',
      headers: { authorization: `Bearer ${professorToken}` },
    })

    expect(response.statusCode).toBe(403)
  })

  it('POST /api/v1/aluno/mensalidades/:id/pix com role ALUNO sem perfil de aluno vinculado retorna 403', async () => {
    const response = await fastify.inject({
      method: 'POST',
      url: '/api/v1/aluno/mensalidades/00000000-0000-0000-0000-000000000000/pix',
      headers: { authorization: `Bearer ${alunoToken}` },
    })

    expect(response.statusCode).toBe(403)
  })

  it('POST /api/v1/webhooks/mercadopago é uma rota pública (não exige token)', async () => {
    const response = await fastify.inject({
      method: 'POST',
      url: '/api/v1/webhooks/mercadopago',
      payload: { id: 'evento-teste', type: 'order', data: { id: 'ORD123' } },
    })

    // Sem authenticateToken: nunca deve retornar 401 de "token não fornecido".
    // A rejeição aqui é por assinatura ausente/inválida (validação própria do gateway).
    expect(response.statusCode).toBe(401)
    expect(response.json()).toMatchObject({ code: 'INVALID_SIGNATURE' })
  })
})
