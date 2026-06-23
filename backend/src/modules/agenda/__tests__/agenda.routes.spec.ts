import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { build } from '../../../app'
import type { FastifyInstance } from 'fastify'
import { generateTokens } from '../../../shared/utils/jwt'

let fastify: FastifyInstance
let professorId: string

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
      nomeCompleto: 'Professor Agenda Teste',
      email: `professor-agenda-${Date.now()}@teste.local`,
      cpf: `${Date.now()}`.slice(-11),
      senha: 'Senha123456',
    },
  })
  professorId = JSON.parse(professorResp.body).data.id
})

afterAll(async () => {
  await fastify.close()
})

describe('Agenda Routes', () => {
  it('POST /api/v1/aulas com payload incompleto retorna 400 (não 500)', async () => {
    const response = await fastify.inject({
      method: 'POST',
      url: '/api/v1/aulas',
      headers: { authorization: `Bearer ${tokenFor('ADMIN')}` },
      payload: { professorId: '00000000-0000-0000-0000-000000000000' },
    })

    expect(response.statusCode).toBe(400)
    const body = JSON.parse(response.body)
    expect(body.success).toBe(false)
  })

  it('POST /api/v1/aulas com professorId em formato inválido retorna 400 (não 500)', async () => {
    const response = await fastify.inject({
      method: 'POST',
      url: '/api/v1/aulas',
      headers: { authorization: `Bearer ${tokenFor('ADMIN')}` },
      payload: { professorId: 'nao-e-um-uuid', dataHoraInicio: '2026-07-01T10:00:00.000Z', sala: 'Sala 1' },
    })

    expect(response.statusCode).toBe(400)
  })

  it('PUT /api/v1/aulas/:id com tipo inválido retorna 400 (não 500)', async () => {
    const criada = await fastify.inject({
      method: 'POST',
      url: '/api/v1/aulas',
      headers: { authorization: `Bearer ${tokenFor('ADMIN')}` },
      payload: { professorId, dataHoraInicio: '2026-07-01T10:00:00.000Z', sala: 'Sala 1' },
    })
    const { id } = JSON.parse(criada.body).data

    const response = await fastify.inject({
      method: 'PUT',
      url: `/api/v1/aulas/${id}`,
      headers: { authorization: `Bearer ${tokenFor('ADMIN')}` },
      payload: { duracao: 'não-é-número' },
    })

    expect(response.statusCode).toBe(400)
  })

  it('POST /api/v1/aulas sem token retorna 401', async () => {
    const response = await fastify.inject({
      method: 'POST',
      url: '/api/v1/aulas',
      payload: { professorId: '00000000-0000-0000-0000-000000000000' },
    })

    expect(response.statusCode).toBe(401)
  })
})
