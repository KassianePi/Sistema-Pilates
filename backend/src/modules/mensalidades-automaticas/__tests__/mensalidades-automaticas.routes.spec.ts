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

describe('Mensalidades Automáticas Routes', () => {
  it('POST /api/v1/mensalidades/gerar-automatico sem token retorna 401', async () => {
    const response = await fastify.inject({ method: 'POST', url: '/api/v1/mensalidades/gerar-automatico' })
    expect(response.statusCode).toBe(401)
  })

  it('POST /api/v1/mensalidades/gerar-automatico com role não-ADMIN retorna 403', async () => {
    const response = await fastify.inject({
      method: 'POST',
      url: '/api/v1/mensalidades/gerar-automatico',
      headers: { authorization: `Bearer ${tokenFor('FINANCEIRO')}` },
    })
    expect(response.statusCode).toBe(403)
  })

  it('GET /api/v1/mensalidades/gerar-automatico/status sem token retorna 401', async () => {
    const response = await fastify.inject({ method: 'GET', url: '/api/v1/mensalidades/gerar-automatico/status' })
    expect(response.statusCode).toBe(401)
  })

  it('GET /api/v1/mensalidades/gerar-automatico/status com role não-ADMIN retorna 403', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/api/v1/mensalidades/gerar-automatico/status',
      headers: { authorization: `Bearer ${tokenFor('ALUNO')}` },
    })
    expect(response.statusCode).toBe(403)
  })

  // Os testes abaixo exercitam o caminho feliz (ADMIN autorizado) e por isso
  // dependem de um banco de dados real e migrado — mesma dependência que já
  // existe nas outras suítes *.routes.spec.ts deste projeto (ex.:
  // pagamentos-pix.routes.spec.ts). Rodam no CI/docker, não neste sandbox
  // isolado sem MySQL acessível.
  it('POST /api/v1/mensalidades/gerar-automatico com role ADMIN e dryRun=true retorna 200 sem persistir execução', async () => {
    const response = await fastify.inject({
      method: 'POST',
      url: '/api/v1/mensalidades/gerar-automatico?dryRun=true',
      headers: { authorization: `Bearer ${tokenFor('ADMIN')}` },
    })
    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.data.dryRun).toBe(true)
    expect(body.data.id).toBeNull()
  })

  it('GET /api/v1/mensalidades/gerar-automatico/status com role ADMIN retorna 200', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/api/v1/mensalidades/gerar-automatico/status',
      headers: { authorization: `Bearer ${tokenFor('ADMIN')}` },
    })
    expect(response.statusCode).toBe(200)
  })
})
