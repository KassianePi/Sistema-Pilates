import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { build } from '../../../app'
import type { FastifyInstance } from 'fastify'
import { generateTokens } from '../../../shared/utils/jwt'

let fastify: FastifyInstance
let alunoId: string

function tokenFor(funcao: 'ADMIN' | 'PROFESSOR' | 'RECEPCIONISTA' | 'FINANCEIRO' | 'ALUNO') {
  return generateTokens({ usuarioId: 'usuario-fake-id', email: 'teste@pilates.local', funcao }).accessToken
}

beforeAll(async () => {
  fastify = await build()

  const alunoResp = await fastify.inject({
    method: 'POST',
    url: '/api/v1/alunos',
    headers: { authorization: `Bearer ${tokenFor('ADMIN')}` },
    payload: {
      email: `aluno-financeiro-${Date.now()}@teste.local`,
      nomeCompleto: 'Aluno Financeiro Teste',
      cpf: `${Date.now()}`.slice(-10) + '2',
      senha: 'Senha123456',
      dataInicio: '2026-01-01',
    },
  })
  alunoId = JSON.parse(alunoResp.body).data.id
})

afterAll(async () => {
  await fastify.close()
})

describe('Financeiro Routes', () => {
  it('POST /api/v1/mensalidades sem valor retorna 400 (não 500)', async () => {
    const response = await fastify.inject({
      method: 'POST',
      url: '/api/v1/mensalidades',
      headers: { authorization: `Bearer ${tokenFor('ADMIN')}` },
      payload: {
        alunoId,
        tipo: 'AVULSO',
        mesReferencia: '2026-07-01',
        dataVencimento: '2026-07-10',
      },
    })

    expect(response.statusCode).toBe(400)
    const body = JSON.parse(response.body)
    expect(body.success).toBe(false)
  })

  it('PUT /api/v1/mensalidades/:id com valor em formato inválido retorna 400 (não 500)', async () => {
    const criada = await fastify.inject({
      method: 'POST',
      url: '/api/v1/mensalidades',
      headers: { authorization: `Bearer ${tokenFor('ADMIN')}` },
      payload: {
        alunoId,
        tipo: 'AVULSO',
        mesReferencia: '2026-07-01',
        dataVencimento: '2026-07-10',
        valor: 100,
      },
    })
    const { id } = JSON.parse(criada.body).data

    const response = await fastify.inject({
      method: 'PUT',
      url: `/api/v1/mensalidades/${id}`,
      headers: { authorization: `Bearer ${tokenFor('ADMIN')}` },
      payload: { valor: 'não-é-número' },
    })

    expect(response.statusCode).toBe(400)
  })

  it('POST /api/v1/pagamentos sem mensalidadeId retorna 400 (não 500)', async () => {
    const response = await fastify.inject({
      method: 'POST',
      url: '/api/v1/pagamentos',
      headers: { authorization: `Bearer ${tokenFor('ADMIN')}` },
      payload: { valor: 100, metodo: 'PIX' },
    })

    expect(response.statusCode).toBe(400)
    const body = JSON.parse(response.body)
    expect(body.success).toBe(false)
  })

  it('POST /api/v1/mensalidades sem token retorna 401', async () => {
    const response = await fastify.inject({
      method: 'POST',
      url: '/api/v1/mensalidades',
      payload: { alunoId },
    })

    expect(response.statusCode).toBe(401)
  })
})
