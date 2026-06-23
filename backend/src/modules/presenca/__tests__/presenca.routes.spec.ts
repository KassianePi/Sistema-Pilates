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
      nomeCompleto: 'Professor Presença Teste',
      email: `professor-presenca-${Date.now()}@teste.local`,
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
      email: `aluno-presenca-${Date.now()}@teste.local`,
      nomeCompleto: 'Aluno Presença Teste',
      cpf: `${Date.now()}`.slice(-10) + '1',
      senha: 'Senha123456',
      dataInicio: '2026-01-01',
    },
  })
  alunoId = JSON.parse(alunoResp.body).data.id
})

afterAll(async () => {
  await fastify.close()
})

describe('Presença Routes', () => {
  it('POST /api/v1/presencas sem aulaId retorna 400 (não 500)', async () => {
    const response = await fastify.inject({
      method: 'POST',
      url: '/api/v1/presencas',
      headers: { authorization: `Bearer ${tokenFor('ADMIN')}` },
      payload: { alunoId },
    })

    expect(response.statusCode).toBe(400)
    const body = JSON.parse(response.body)
    expect(body.success).toBe(false)
  })

  it('PUT /api/v1/presencas/:id com status inválido retorna 400 (não 500)', async () => {
    const criada = await fastify.inject({
      method: 'POST',
      url: '/api/v1/presencas',
      headers: { authorization: `Bearer ${tokenFor('ADMIN')}` },
      payload: { alunoId, aulaId },
    })
    const { id } = JSON.parse(criada.body).data

    const response = await fastify.inject({
      method: 'PUT',
      url: `/api/v1/presencas/${id}`,
      headers: { authorization: `Bearer ${tokenFor('ADMIN')}` },
      payload: { status: 'STATUS_INEXISTENTE' },
    })

    expect(response.statusCode).toBe(400)
  })

  it('POST /api/v1/presencas sem token retorna 401', async () => {
    const response = await fastify.inject({
      method: 'POST',
      url: '/api/v1/presencas',
      payload: { alunoId },
    })

    expect(response.statusCode).toBe(401)
  })
})
