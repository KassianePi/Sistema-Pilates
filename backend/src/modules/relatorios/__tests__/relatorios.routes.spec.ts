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

describe('Relatorios Routes', () => {
  it('GET /api/v1/relatorios sem token retorna 401', async () => {
    const response = await fastify.inject({ method: 'GET', url: '/api/v1/relatorios' })
    expect(response.statusCode).toBe(401)
  })

  it('GET /api/v1/relatorios bloqueia RECEPCIONISTA (sem permissão de relatórios)', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/api/v1/relatorios',
      headers: { authorization: `Bearer ${tokenFor('RECEPCIONISTA')}` },
    })
    expect(response.statusCode).toBe(403)
  })

  it('GET /api/v1/relatorios permite FINANCEIRO e retorna lista vazia paginada', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/api/v1/relatorios',
      headers: { authorization: `Bearer ${tokenFor('FINANCEIRO')}` },
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.success).toBe(true)
    expect(body.data.relatorios).toBeDefined()
    expect(body.data.totalPages).toBeDefined()
  })

  it('GET /api/v1/relatorios com filtro de tipo inválido retorna 400', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/api/v1/relatorios?tipo=TIPO_QUE_NAO_EXISTE',
      headers: { authorization: `Bearer ${tokenFor('ADMIN')}` },
    })

    expect(response.statusCode).toBe(400)
  })

  it('GET /api/v1/relatorios/:id com id inexistente retorna 404', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/api/v1/relatorios/00000000-0000-0000-0000-000000000000',
      headers: { authorization: `Bearer ${tokenFor('ADMIN')}` },
    })

    expect(response.statusCode).toBe(404)
  })

  it('POST /api/v1/relatorios/gerar bloqueia RECEPCIONISTA', async () => {
    const response = await fastify.inject({
      method: 'POST',
      url: '/api/v1/relatorios/gerar',
      headers: { authorization: `Bearer ${tokenFor('RECEPCIONISTA')}` },
      payload: {
        professorId: '00000000-0000-0000-0000-000000000000',
        tipo: 'FREQUENCIA',
        titulo: 'Teste',
        dataPeriodoInicio: '2026-06-01',
        dataPeriodoFim: '2026-06-30',
      },
    })

    expect(response.statusCode).toBe(403)
  })

  it('POST /api/v1/relatorios/gerar com professor inexistente retorna 400', async () => {
    const response = await fastify.inject({
      method: 'POST',
      url: '/api/v1/relatorios/gerar',
      headers: { authorization: `Bearer ${tokenFor('ADMIN')}` },
      payload: {
        professorId: '00000000-0000-0000-0000-000000000000',
        tipo: 'FREQUENCIA',
        titulo: 'Teste',
        dataPeriodoInicio: '2026-06-01',
        dataPeriodoFim: '2026-06-30',
      },
    })

    expect(response.statusCode).toBe(400)
    const body = JSON.parse(response.body)
    expect(body.success).toBe(false)
  })

  it('POST /api/v1/relatorios/gerar sem titulo (payload inválido) retorna 400 (não 500)', async () => {
    const response = await fastify.inject({
      method: 'POST',
      url: '/api/v1/relatorios/gerar',
      headers: { authorization: `Bearer ${tokenFor('ADMIN')}` },
      payload: {
        professorId: '00000000-0000-0000-0000-000000000000',
        tipo: 'FREQUENCIA',
        dataPeriodoInicio: '2026-06-01',
        dataPeriodoFim: '2026-06-30',
      },
    })

    expect(response.statusCode).toBe(400)
    const body = JSON.parse(response.body)
    expect(body.success).toBe(false)
  })

  it('POST /api/v1/relatorios/exportar-direto sem titulo (payload inválido) retorna 400 (não 500)', async () => {
    const response = await fastify.inject({
      method: 'POST',
      url: '/api/v1/relatorios/exportar-direto',
      headers: { authorization: `Bearer ${tokenFor('ADMIN')}` },
      payload: {
        professorId: '00000000-0000-0000-0000-000000000000',
        tipo: 'FREQUENCIA',
        dataPeriodoInicio: '2026-06-01',
        dataPeriodoFim: '2026-06-30',
      },
    })

    expect(response.statusCode).toBe(400)
    const body = JSON.parse(response.body)
    expect(body.success).toBe(false)
  })
})
