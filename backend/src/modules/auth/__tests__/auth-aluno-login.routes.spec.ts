/**
 * Testes de rota do login do aluno por CPF (POST /api/v1/auth/aluno/login).
 *
 * Arquivo separado de `auth.routes.spec.ts` de propósito: aquele arquivo
 * depende de um usuário admin já semeado no banco (`admin@pilates.local`)
 * para o `beforeAll`; este aqui cria seu próprio usuário aluno de teste com
 * hash de senha real, sem depender de nenhum dado pré-existente.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { randomUUID } from 'node:crypto'
import { build } from '../../../app'
import { prisma } from '../../../database/prisma.client'
import { hashPassword } from '../../../shared/utils/hash'
import type { FastifyInstance } from 'fastify'

let fastify: FastifyInstance
const CPF_TESTE = '11122233344'
const SENHA_TESTE = 'senha123'
let usuarioId: string

beforeAll(async () => {
  fastify = await build()

  const usuario = await prisma.usuario.create({
    data: {
      email: `aluno-cpf-login-${randomUUID()}@pilates.local`,
      senhaHash: await hashPassword(SENHA_TESTE),
      nomeCompleto: 'Aluno Login CPF',
      cpf: CPF_TESTE,
      funcao: 'ALUNO' as any,
      status: 'ATIVO',
    },
  })
  usuarioId = usuario.id
})

afterAll(async () => {
  await prisma.usuario.deleteMany({ where: { id: usuarioId } })
  await fastify.close()
})

describe('POST /api/v1/auth/aluno/login (por CPF)', () => {
  it('autentica com CPF e senha corretos', async () => {
    const response = await fastify.inject({
      method: 'POST',
      url: '/api/v1/auth/aluno/login',
      payload: { cpf: CPF_TESTE, senha: SENHA_TESTE },
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.success).toBe(true)
    expect(body.data.funcao).toBe('ALUNO')
    expect(body.data.accessToken).toBeDefined()
  })

  it('rejeita CPF com formato inválido (400, não 500)', async () => {
    const response = await fastify.inject({
      method: 'POST',
      url: '/api/v1/auth/aluno/login',
      payload: { cpf: '123', senha: SENHA_TESTE },
    })

    expect(response.statusCode).toBe(400)
  })

  it('rejeita senha incorreta (401)', async () => {
    const response = await fastify.inject({
      method: 'POST',
      url: '/api/v1/auth/aluno/login',
      payload: { cpf: CPF_TESTE, senha: 'senhaErrada' },
    })

    expect(response.statusCode).toBe(401)
    const body = JSON.parse(response.body)
    expect(body.code).toBe('INVALID_CREDENTIALS')
  })
})
