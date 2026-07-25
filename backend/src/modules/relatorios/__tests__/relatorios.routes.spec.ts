import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { build } from '../../../app'
import type { FastifyInstance } from 'fastify'
import { criarUsuarioComToken, limparUsuariosDeTeste } from '../../../test/route-auth.helper'

let fastify: FastifyInstance
let adminToken: string
let financeiroToken: string
let recepcionistaToken: string

beforeAll(async () => {
  fastify = await build()
  ;({ accessToken: adminToken } = await criarUsuarioComToken('ADMIN'))
  ;({ accessToken: financeiroToken } = await criarUsuarioComToken('FINANCEIRO'))
  ;({ accessToken: recepcionistaToken } = await criarUsuarioComToken('RECEPCIONISTA'))
})

afterAll(async () => {
  await fastify.close()
  await limparUsuariosDeTeste()
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
      headers: { authorization: `Bearer ${recepcionistaToken}` },
    })
    expect(response.statusCode).toBe(403)
  })

  it('GET /api/v1/relatorios permite FINANCEIRO e retorna lista vazia paginada', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/api/v1/relatorios',
      headers: { authorization: `Bearer ${financeiroToken}` },
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
      headers: { authorization: `Bearer ${adminToken}` },
    })

    expect(response.statusCode).toBe(400)
  })

  it('GET /api/v1/relatorios/:id com id inexistente retorna 404', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/api/v1/relatorios/00000000-0000-0000-0000-000000000000',
      headers: { authorization: `Bearer ${adminToken}` },
    })

    expect(response.statusCode).toBe(404)
  })

  it('POST /api/v1/relatorios/gerar bloqueia RECEPCIONISTA', async () => {
    const response = await fastify.inject({
      method: 'POST',
      url: '/api/v1/relatorios/gerar',
      headers: { authorization: `Bearer ${recepcionistaToken}` },
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
      headers: { authorization: `Bearer ${adminToken}` },
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
      headers: { authorization: `Bearer ${adminToken}` },
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
      headers: { authorization: `Bearer ${adminToken}` },
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
