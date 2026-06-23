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

describe('Professores Routes', () => {
  it('POST /api/v1/professores sem nomeCompleto retorna 400 (não 500)', async () => {
    const response = await fastify.inject({
      method: 'POST',
      url: '/api/v1/professores',
      headers: { authorization: `Bearer ${tokenFor('ADMIN')}` },
      payload: { email: 'professor-sem-nome@teste.local', cpf: '99988877766', senha: 'Senha123456' },
    })

    expect(response.statusCode).toBe(400)
    const body = JSON.parse(response.body)
    expect(body.success).toBe(false)
  })

  it('PUT /api/v1/professores/:id com tipo inválido retorna 400 (não 500)', async () => {
    const criado = await fastify.inject({
      method: 'POST',
      url: '/api/v1/professores',
      headers: { authorization: `Bearer ${tokenFor('ADMIN')}` },
      payload: {
        nomeCompleto: 'Professor Para Atualizar',
        email: `professor-update-${Date.now()}@teste.local`,
        cpf: `${Date.now()}`.slice(-11),
        senha: 'Senha123456',
      },
    })
    const { id } = JSON.parse(criado.body).data

    const response = await fastify.inject({
      method: 'PUT',
      url: `/api/v1/professores/${id}`,
      headers: { authorization: `Bearer ${tokenFor('ADMIN')}` },
      payload: { especialidade: 12345 },
    })

    expect(response.statusCode).toBe(400)
  })

  it('PATCH /api/v1/professores/:id/status com payload inválido retorna 400 (não 500)', async () => {
    const response = await fastify.inject({
      method: 'PATCH',
      url: '/api/v1/professores/00000000-0000-0000-0000-000000000000/status',
      headers: { authorization: `Bearer ${tokenFor('ADMIN')}` },
      payload: { ativo: 'não-é-booleano' },
    })

    expect(response.statusCode).toBe(400)
  })

  it('POST /api/v1/professores sem token retorna 401', async () => {
    const response = await fastify.inject({
      method: 'POST',
      url: '/api/v1/professores',
      payload: { nomeCompleto: 'Professor Teste' },
    })

    expect(response.statusCode).toBe(401)
  })
})
