import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { build } from '../../../app'
import type { FastifyInstance } from 'fastify'
import { generateTokens } from '../../../shared/utils/jwt'

let fastify: FastifyInstance
let alunoId: string
let aulaId: string

function tokenFor(funcao: 'ADMIN' | 'PROFESSOR' | 'RECEPCIONISTA' | 'FINANCEIRO' | 'ALUNO') {
  return generateTokens({ usuarioId: 'usuario-fake-id', email: 'teste@pilates.local', funcao }).accessToken
}

beforeAll(async () => {
  fastify = await build()

  const professorResp = await fastify.inject({
    method: 'POST',
    url: '/api/v1/professores',
    headers: { authorization: `Bearer ${tokenFor('ADMIN')}` },
    payload: {
      nomeCompleto: 'Professor Evolução Teste',
      email: `professor-evolucao-${Date.now()}@teste.local`,
      cpf: `${Date.now()}`.slice(-11),
      senha: 'Senha123456',
    },
  })
  const professorId = JSON.parse(professorResp.body).data.id

  const aulaResp = await fastify.inject({
    method: 'POST',
    url: '/api/v1/aulas',
    headers: { authorization: `Bearer ${tokenFor('ADMIN')}` },
    payload: { professorId, dataHoraInicio: '2026-07-01T10:00:00.000Z', sala: 'Sala 1' },
  })
  aulaId = JSON.parse(aulaResp.body).data.id

  const alunoResp = await fastify.inject({
    method: 'POST',
    url: '/api/v1/alunos',
    headers: { authorization: `Bearer ${tokenFor('ADMIN')}` },
    payload: {
      email: `aluno-evolucao-${Date.now()}@teste.local`,
      nomeCompleto: 'Aluno Evolução Teste',
      cpf: `${Date.now()}`.slice(-10) + '3',
      senha: 'Senha123456',
      dataInicio: '2026-01-01',
    },
  })
  alunoId = JSON.parse(alunoResp.body).data.id
})

afterAll(async () => {
  await fastify.close()
})

describe('Evolução Routes', () => {
  it('POST /api/v1/evolucoes sem observacao retorna 400 (não 500)', async () => {
    const response = await fastify.inject({
      method: 'POST',
      url: '/api/v1/evolucoes',
      headers: { authorization: `Bearer ${tokenFor('ADMIN')}` },
      payload: { alunoId, aulaId },
    })

    expect(response.statusCode).toBe(400)
    const body = JSON.parse(response.body)
    expect(body.success).toBe(false)
  })

  it('POST /api/v1/evolucoes com dados válidos retorna 201', async () => {
    const response = await fastify.inject({
      method: 'POST',
      url: '/api/v1/evolucoes',
      headers: { authorization: `Bearer ${tokenFor('PROFESSOR')}` },
      payload: { alunoId, aulaId, observacao: 'Aluno progrediu bem na aula de hoje.' },
    })

    expect(response.statusCode).toBe(201)
    const body = JSON.parse(response.body)
    expect(body.success).toBe(true)
  })

  it('POST /api/v1/evolucoes sem token retorna 401', async () => {
    const response = await fastify.inject({
      method: 'POST',
      url: '/api/v1/evolucoes',
      payload: { alunoId, aulaId, observacao: 'Nota' },
    })

    expect(response.statusCode).toBe(401)
  })

  it('POST /api/v1/evolucoes com role FINANCEIRO retorna 403 (sem permissão)', async () => {
    const response = await fastify.inject({
      method: 'POST',
      url: '/api/v1/evolucoes',
      headers: { authorization: `Bearer ${tokenFor('FINANCEIRO')}` },
      payload: { alunoId, aulaId, observacao: 'Nota' },
    })

    expect(response.statusCode).toBe(403)
  })

  it('GET /api/v1/evolucoes/:id com id inexistente retorna 404', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/api/v1/evolucoes/00000000-0000-0000-0000-000000000000',
      headers: { authorization: `Bearer ${tokenFor('ADMIN')}` },
    })

    expect(response.statusCode).toBe(404)
  })
})
