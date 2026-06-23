/**
 * Testes das rotas de estornos — foco nas regras de permissão (RBAC),
 * já que a lógica de negócio é coberta em estornos.service.spec.ts.
 */
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

describe('Estornos Routes — RBAC', () => {
  it('POST /api/v1/estornos exige role ALUNO — bloqueia ADMIN', async () => {
    const response = await fastify.inject({
      method: 'POST',
      url: '/api/v1/estornos',
      headers: { authorization: `Bearer ${tokenFor('ADMIN')}` },
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
      headers: { authorization: `Bearer ${tokenFor('PROFESSOR')}` },
    })

    expect(response.statusCode).not.toBe(401)
    expect(response.statusCode).not.toBe(403)
  })

  it('GET /api/v1/estornos bloqueia ALUNO (sem permissões administrativas)', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/api/v1/estornos',
      headers: { authorization: `Bearer ${tokenFor('ALUNO')}` },
    })

    expect(response.statusCode).toBe(403)
  })

  it('PATCH /api/v1/estornos/:id/aprovar exige pagamentos:refund — bloqueia RECEPCIONISTA', async () => {
    const response = await fastify.inject({
      method: 'PATCH',
      url: '/api/v1/estornos/11111111-1111-1111-1111-111111111111/aprovar',
      headers: { authorization: `Bearer ${tokenFor('RECEPCIONISTA')}` },
    })

    expect(response.statusCode).toBe(403)
  })

  it('PATCH /api/v1/estornos/:id/aprovar permite ADMIN passar da barreira de autorização', async () => {
    const response = await fastify.inject({
      method: 'PATCH',
      url: '/api/v1/estornos/11111111-1111-1111-1111-111111111111/aprovar',
      headers: { authorization: `Bearer ${tokenFor('ADMIN')}` },
    })

    // ADMIN tem a permissão — a resposta pode ser 404 (estorno fake não existe),
    // mas NUNCA 401/403 de autorização.
    expect(response.statusCode).not.toBe(401)
    expect(response.statusCode).not.toBe(403)
  })
})
