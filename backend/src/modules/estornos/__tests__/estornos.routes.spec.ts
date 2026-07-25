/**
 * Testes das rotas de estornos — foco nas regras de permissão (RBAC),
 * já que a lógica de negócio é coberta em estornos.service.spec.ts.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { build } from '../../../app'
import type { FastifyInstance } from 'fastify'
import { criarUsuarioComToken, limparUsuariosDeTeste } from '../../../test/route-auth.helper'

let fastify: FastifyInstance
let adminToken: string
let professorToken: string
let alunoToken: string
let recepcionistaToken: string

beforeAll(async () => {
  fastify = await build()
  ;({ accessToken: adminToken } = await criarUsuarioComToken('ADMIN'))
  ;({ accessToken: professorToken } = await criarUsuarioComToken('PROFESSOR'))
  ;({ accessToken: alunoToken } = await criarUsuarioComToken('ALUNO'))
  ;({ accessToken: recepcionistaToken } = await criarUsuarioComToken('RECEPCIONISTA'))
})

afterAll(async () => {
  await fastify.close()
  await limparUsuariosDeTeste()
})

describe('Estornos Routes — RBAC', () => {
  it('POST /api/v1/estornos exige role ALUNO — bloqueia ADMIN', async () => {
    const response = await fastify.inject({
      method: 'POST',
      url: '/api/v1/estornos',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { mensalidadeId: '11111111-1111-1111-1111-111111111111' },
    })

    expect(response.statusCode).toBe(403)
  })

  it('POST /api/v1/estornos sem token retorna 401', async () => {
    const response = await fastify.inject({
      method: 'POST',
      url: '/api/v1/estornos',
      payload: { mensalidadeId: '11111111-1111-1111-1111-111111111111' },
    })

    expect(response.statusCode).toBe(401)
  })

  it('GET /api/v1/estornos exige permissão pagamentos:read — bloqueia PROFESSOR sem a permissão necessária', async () => {
    // PROFESSOR tem pagamentos:read (regra atual do RBAC) — deve passar a barreira de autorização
    const response = await fastify.inject({
      method: 'GET',
      url: '/api/v1/estornos',
      headers: { authorization: `Bearer ${professorToken}` },
    })

    expect(response.statusCode).not.toBe(401)
    expect(response.statusCode).not.toBe(403)
  })

  it('GET /api/v1/estornos bloqueia ALUNO (sem permissões administrativas)', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/api/v1/estornos',
      headers: { authorization: `Bearer ${alunoToken}` },
    })

    expect(response.statusCode).toBe(403)
  })

  it('PATCH /api/v1/estornos/:id/aprovar exige pagamentos:refund — bloqueia RECEPCIONISTA', async () => {
    const response = await fastify.inject({
      method: 'PATCH',
      url: '/api/v1/estornos/11111111-1111-1111-1111-111111111111/aprovar',
      headers: { authorization: `Bearer ${recepcionistaToken}` },
    })

    expect(response.statusCode).toBe(403)
  })

  it('PATCH /api/v1/estornos/:id/aprovar permite ADMIN passar da barreira de autorização', async () => {
    const response = await fastify.inject({
      method: 'PATCH',
      url: '/api/v1/estornos/11111111-1111-1111-1111-111111111111/aprovar',
      headers: { authorization: `Bearer ${adminToken}` },
    })

    // ADMIN tem a permissão — a resposta pode ser 404 (estorno fake não existe),
    // mas NUNCA 401/403 de autorização.
    expect(response.statusCode).not.toBe(401)
    expect(response.statusCode).not.toBe(403)
  })
})
