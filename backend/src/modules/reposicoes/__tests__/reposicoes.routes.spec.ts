import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { build } from '../../../app'
import type { FastifyInstance } from 'fastify'
import { criarUsuarioComToken, limparUsuariosDeTeste } from '../../../test/route-auth.helper'

let fastify: FastifyInstance
let adminToken: string
let professorToken: string

beforeAll(async () => {
  fastify = await build()
  ;({ accessToken: adminToken } = await criarUsuarioComToken('ADMIN'))
  ;({ accessToken: professorToken } = await criarUsuarioComToken('PROFESSOR'))
})

afterAll(async () => {
  await fastify.close()
  await limparUsuariosDeTeste()
})

describe('Reposições Routes', () => {
  it('POST /api/v1/aluno/reposicoes sem token retorna 401', async () => {
    const response = await fastify.inject({
      method: 'POST',
      url: '/api/v1/aluno/reposicoes',
      payload: { aulaOriginalId: '00000000-0000-0000-0000-000000000000', motivo: 'Fiquei doente' },
    })

    expect(response.statusCode).toBe(401)
  })

  it('POST /api/v1/aluno/reposicoes com role ADMIN retorna 403 (rota exclusiva do aluno)', async () => {
    const response = await fastify.inject({
      method: 'POST',
      url: '/api/v1/aluno/reposicoes',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { aulaOriginalId: '00000000-0000-0000-0000-000000000000', motivo: 'Fiquei doente' },
    })

    expect(response.statusCode).toBe(403)
  })

  it('GET /api/v1/reposicoes sem permissão (PROFESSOR só tem read, mas RBAC permite) retorna 200', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/api/v1/reposicoes',
      headers: { authorization: `Bearer ${professorToken}` },
    })

    expect(response.statusCode).toBe(200)
  })

  it('PATCH /api/v1/reposicoes/:id/agendar com role PROFESSOR retorna 403 (sem permissão de update)', async () => {
    const response = await fastify.inject({
      method: 'PATCH',
      url: '/api/v1/reposicoes/00000000-0000-0000-0000-000000000000/agendar',
      headers: { authorization: `Bearer ${professorToken}` },
      payload: { aulaReposicaoId: '00000000-0000-0000-0000-000000000000' },
    })

    expect(response.statusCode).toBe(403)
  })

  it('GET /api/v1/reposicoes/:id com id inexistente retorna 404', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/api/v1/reposicoes/00000000-0000-0000-0000-000000000000',
      headers: { authorization: `Bearer ${adminToken}` },
    })

    expect(response.statusCode).toBe(404)
  })
})
