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

describe('Modalidades Routes', () => {
  it('GET /api/v1/modalidades permite qualquer usuário autenticado', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/api/v1/modalidades',
      headers: { authorization: `Bearer ${tokenFor('RECEPCIONISTA')}` },
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.success).toBe(true)
  })

  it('GET /api/v1/modalidades sem token retorna 401', async () => {
    const response = await fastify.inject({ method: 'GET', url: '/api/v1/modalidades' })
    expect(response.statusCode).toBe(401)
  })

  it('POST /api/v1/modalidades cria uma modalidade (ADMIN)', async () => {
    const nomeUnico = `Modalidade Teste ${Date.now()}`
    const response = await fastify.inject({
      method: 'POST',
      url: '/api/v1/modalidades',
      headers: { authorization: `Bearer ${tokenFor('ADMIN')}` },
      payload: { nome: nomeUnico, descricao: 'Criada via teste automatizado' },
    })

    expect(response.statusCode).toBe(201)
    const body = JSON.parse(response.body)
    expect(body.data.nome).toBe(nomeUnico)
  })

  it('POST /api/v1/modalidades com nome vazio retorna 400 (não 500)', async () => {
    const response = await fastify.inject({
      method: 'POST',
      url: '/api/v1/modalidades',
      headers: { authorization: `Bearer ${tokenFor('ADMIN')}` },
      payload: { nome: '' },
    })

    expect(response.statusCode).toBe(400)
  })

  it('POST /api/v1/modalidades bloqueia FINANCEIRO (sem permissão de agenda)', async () => {
    const response = await fastify.inject({
      method: 'POST',
      url: '/api/v1/modalidades',
      headers: { authorization: `Bearer ${tokenFor('FINANCEIRO')}` },
      payload: { nome: 'Outra Modalidade' },
    })

    expect(response.statusCode).toBe(403)
  })

  it('DELETE /api/v1/modalidades/:id bloqueia PROFESSOR (sem permissão de agenda:delete)', async () => {
    const response = await fastify.inject({
      method: 'DELETE',
      url: '/api/v1/modalidades/00000000-0000-0000-0000-000000000000',
      headers: { authorization: `Bearer ${tokenFor('PROFESSOR')}` },
    })

    expect(response.statusCode).toBe(403)
  })

  it('fluxo completo: cria, tenta renomear para nome duplicado, exclui', async () => {
    const adminToken = tokenFor('ADMIN')
    const nomeA = `Modalidade A ${Date.now()}`
    const nomeB = `Modalidade B ${Date.now()}`

    const createA = await fastify.inject({
      method: 'POST',
      url: '/api/v1/modalidades',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { nome: nomeA },
    })
    const modalidadeA = JSON.parse(createA.body).data

    const createB = await fastify.inject({
      method: 'POST',
      url: '/api/v1/modalidades',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { nome: nomeB },
    })
    expect(createB.statusCode).toBe(201)

    // Tenta renomear A para o nome de B — deve ser bloqueado (conflito)
    const renomear = await fastify.inject({
      method: 'PUT',
      url: `/api/v1/modalidades/${modalidadeA.id}`,
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { nome: nomeB },
    })
    expect(renomear.statusCode).toBe(409)

    // Exclui A (sem aulas vinculadas) — deve funcionar
    const excluir = await fastify.inject({
      method: 'DELETE',
      url: `/api/v1/modalidades/${modalidadeA.id}`,
      headers: { authorization: `Bearer ${adminToken}` },
    })
    expect(excluir.statusCode).toBe(200)
  })
})
