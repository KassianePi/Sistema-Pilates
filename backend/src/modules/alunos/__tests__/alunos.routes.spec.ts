import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { build } from '../../../app'
import type { FastifyInstance } from 'fastify'
import { criarUsuarioComToken, limparUsuariosDeTeste } from '../../../test/route-auth.helper'

let fastify: FastifyInstance
let adminToken: string

beforeAll(async () => {
  fastify = await build()
  ;({ accessToken: adminToken } = await criarUsuarioComToken('ADMIN'))
})

afterAll(async () => {
  await fastify.close()
  await limparUsuariosDeTeste()
})

describe('Alunos Routes', () => {
  it('POST /api/v1/alunos sem nomeCompleto retorna 400 (não 500)', async () => {
    const response = await fastify.inject({
      method: 'POST',
      url: '/api/v1/alunos',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        email: 'aluno-sem-nome@teste.local',
        cpf: '99988877766',
        senha: 'Senha123456',
        dataInicio: '2026-01-01',
      },
    })

    expect(response.statusCode).toBe(400)
    const body = JSON.parse(response.body)
    expect(body.success).toBe(false)
  })

  it('PUT /api/v1/alunos/:id com email em formato inválido retorna 400 (não 500)', async () => {
    const criado = await fastify.inject({
      method: 'POST',
      url: '/api/v1/alunos',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        email: `aluno-update-${Date.now()}@teste.local`,
        nomeCompleto: 'Aluno Para Atualizar',
        cpf: `${Date.now()}`.slice(-11),
        senha: 'Senha123456',
        dataInicio: '2026-01-01',
      },
    })
    const { id } = JSON.parse(criado.body).data

    const response = await fastify.inject({
      method: 'PUT',
      url: `/api/v1/alunos/${id}`,
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { email: 'nao-e-um-email' },
    })

    expect(response.statusCode).toBe(400)
  })

  it('PATCH /api/v1/alunos/:id/status com payload inválido retorna 400 (não 500)', async () => {
    const response = await fastify.inject({
      method: 'PATCH',
      url: '/api/v1/alunos/00000000-0000-0000-0000-000000000000/status',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { ativo: 'não-é-booleano' },
    })

    expect(response.statusCode).toBe(400)
  })

  it('POST /api/v1/alunos sem token retorna 401', async () => {
    const response = await fastify.inject({
      method: 'POST',
      url: '/api/v1/alunos',
      payload: { nomeCompleto: 'Aluno Teste' },
    })

    expect(response.statusCode).toBe(401)
  })
})
