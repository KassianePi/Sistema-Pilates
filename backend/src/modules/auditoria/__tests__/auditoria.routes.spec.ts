import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { build } from '../../../app'
import type { FastifyInstance } from 'fastify'
import { criarUsuarioComToken, limparUsuariosDeTeste } from '../../../test/route-auth.helper'

let fastify: FastifyInstance
let adminToken: string
let recepcionistaToken: string

beforeAll(async () => {
  fastify = await build()
  ;({ accessToken: adminToken } = await criarUsuarioComToken('ADMIN'))
  ;({ accessToken: recepcionistaToken } = await criarUsuarioComToken('RECEPCIONISTA'))
})

afterAll(async () => {
  await fastify.close()
  await limparUsuariosDeTeste()
})

describe('Auditoria Routes', () => {
  it('GET /api/v1/auditoria sem token retorna 401', async () => {
    const response = await fastify.inject({ method: 'GET', url: '/api/v1/auditoria' })
    expect(response.statusCode).toBe(401)
  })

  it('GET /api/v1/auditoria bloqueia roles sem permissão (RECEPCIONISTA)', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/api/v1/auditoria',
      headers: { authorization: `Bearer ${recepcionistaToken}` },
    })

    expect(response.statusCode).toBe(403)
  })

  it('GET /api/v1/auditoria permite ADMIN e não expõe dados sensíveis (senhaHash)', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/api/v1/auditoria',
      headers: { authorization: `Bearer ${adminToken}` },
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.success).toBe(true)
    expect(JSON.stringify(body)).not.toContain('senhaHash')
  })

  it('GET /api/v1/auditoria/exportar gera CSV sem dados sensíveis', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/api/v1/auditoria/exportar',
      headers: { authorization: `Bearer ${adminToken}` },
    })

    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toContain('text/csv')
    expect(response.body).toContain('id,usuario,acao,entidade,entidadeId,ip,data')
    expect(response.body).not.toContain('senhaHash')
  })
})
