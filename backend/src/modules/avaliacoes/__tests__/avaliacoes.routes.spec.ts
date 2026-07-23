import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { build } from '../../../app'
import type { FastifyInstance } from 'fastify'
import { generateTokens } from '../../../shared/utils/jwt'

let fastify: FastifyInstance
let alunoId: string

function tokenFor(funcao: 'ADMIN' | 'PROFESSOR' | 'RECEPCIONISTA' | 'FINANCEIRO' | 'ALUNO') {
  return generateTokens({ usuarioId: 'usuario-fake-id', email: 'teste@pilates.local', funcao }).accessToken
}

beforeAll(async () => {
  fastify = await build()

  const alunoResp = await fastify.inject({
    method: 'POST',
    url: '/api/v1/alunos',
    headers: { authorization: `Bearer ${tokenFor('ADMIN')}` },
    payload: {
      email: `aluno-avaliacao-${Date.now()}@teste.local`,
      nomeCompleto: 'Aluno Avaliação Teste',
      cpf: `${Date.now()}`.slice(-10) + '2',
      senha: 'Senha123456',
      dataInicio: '2026-01-01',
    },
  })
  alunoId = JSON.parse(alunoResp.body).data.id
})

afterAll(async () => {
  await fastify.close()
})

describe('Avaliações Routes', () => {
  it('POST /api/v1/avaliacoes sem alunoId retorna 400 (não 500)', async () => {
    const response = await fastify.inject({
      method: 'POST',
      url: '/api/v1/avaliacoes',
      headers: { authorization: `Bearer ${tokenFor('ADMIN')}` },
      payload: { dataAvaliacao: '2026-07-01' },
    })

    expect(response.statusCode).toBe(400)
    const body = JSON.parse(response.body)
    expect(body.success).toBe(false)
  })

  it('POST /api/v1/avaliacoes com dados válidos retorna 201', async () => {
    const response = await fastify.inject({
      method: 'POST',
      url: '/api/v1/avaliacoes',
      headers: { authorization: `Bearer ${tokenFor('ADMIN')}` },
      payload: { alunoId, dataAvaliacao: '2026-07-01', peso: 70, altura: 1.75 },
    })

    expect(response.statusCode).toBe(201)
    const body = JSON.parse(response.body)
    expect(body.success).toBe(true)
    expect(body.data.imc).toBeCloseTo(22.86, 1)
  })

  it('POST /api/v1/avaliacoes sem token retorna 401', async () => {
    const response = await fastify.inject({
      method: 'POST',
      url: '/api/v1/avaliacoes',
      payload: { alunoId, dataAvaliacao: '2026-07-01' },
    })

    expect(response.statusCode).toBe(401)
  })

  it('POST /api/v1/avaliacoes com role FINANCEIRO retorna 403 (sem permissão)', async () => {
    const response = await fastify.inject({
      method: 'POST',
      url: '/api/v1/avaliacoes',
      headers: { authorization: `Bearer ${tokenFor('FINANCEIRO')}` },
      payload: { alunoId, dataAvaliacao: '2026-07-01' },
    })

    expect(response.statusCode).toBe(403)
  })

  it('GET /api/v1/avaliacoes/:id com id inexistente retorna 404', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/api/v1/avaliacoes/00000000-0000-0000-0000-000000000000',
      headers: { authorization: `Bearer ${tokenFor('ADMIN')}` },
    })

    expect(response.statusCode).toBe(404)
  })
})
