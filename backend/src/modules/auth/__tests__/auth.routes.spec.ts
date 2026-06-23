/**
 * Testes das rotas de autenticação
 *
 * Testa endpoints HTTP com Supertest
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { build } from '../../../app'
import type { FastifyInstance } from 'fastify'
import * as jwtUtils from '../../../shared/utils/jwt'

let fastify: FastifyInstance
// Cacheados em um único login — o rate limit estrito de login (10/15min fora
// do modo dev) é compartilhado entre todos os testes deste arquivo, então
// evitamos múltiplas chamadas reais de login além das que testam o próprio
// endpoint de login.
let adminAccessToken: string
let adminUsuarioId: string

async function loginAsAdmin(): Promise<string> {
  return adminAccessToken
}

async function getAdminUsuarioId(): Promise<string> {
  return adminUsuarioId
}

beforeAll(async () => {
  fastify = await build()

  const response = await fastify.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: { email: 'admin@pilates.local', senha: 'admin123' },
  })
  const body = JSON.parse(response.body)
  adminAccessToken = body.data.accessToken
  adminUsuarioId = body.data.usuarioId
})

afterAll(async () => {
  await fastify.close()
})

describe('Auth Routes', () => {
  describe('POST /api/v1/auth/login', () => {
    it('deve fazer login com credenciais corretas', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          email: 'admin@pilates.local',
          senha: 'admin123',
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      expect(body.data.usuarioId).toBeDefined()
      expect(body.data.accessToken).toBeDefined()
      expect(body.data.refreshToken).toBeDefined()
    })

    it('deve retornar 400 com email inválido', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          email: 'invalid-email',
          senha: 'admin123',
        },
      })

      expect(response.statusCode).toBe(400)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(false)
    })

    it('deve retornar 400 com senha muito curta', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          email: 'admin@pilates.local',
          senha: '123',
        },
      })

      expect(response.statusCode).toBe(400)
    })

    it('deve retornar 401 com credenciais incorretas', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          email: 'admin@pilates.local',
          senha: 'senhaErrada',
        },
      })

      expect(response.statusCode).toBe(401)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(false)
    })

    it('deve converter email para minúsculas', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          email: 'ADMIN@PILATES.LOCAL',
          senha: 'admin123',
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.data.email).toBe('admin@pilates.local')
    })
  })

  describe('POST /api/v1/auth/register', () => {
    // A rota é admin-only (onRequest: [authenticateToken, requireRole('ADMIN')]),
    // então todo teste precisa de um Bearer token de admin válido.
    it('deve registrar novo usuário com dados válidos', async () => {
      const cpfUnico = `${Math.random().toString().slice(2, 13)}`
      const accessToken = await loginAsAdmin()

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        headers: { authorization: `Bearer ${accessToken}` },
        payload: {
          email: `novo${Date.now()}@pilates.local`,
          nome: 'Novo Usuário',
          cpf: cpfUnico,
          telefone: '11999999999',
          senha: 'senha123',
          senhaConfirmacao: 'senha123',
          funcao: 'RECEPCIONISTA',
        },
      })

      expect(response.statusCode).toBe(201)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      expect(body.data.usuarioId).toBeDefined()
      expect(body.data.funcao).toBe('RECEPCIONISTA')
    })

    it('deve retornar 400 com senhas não correspondentes', async () => {
      const accessToken = await loginAsAdmin()

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        headers: { authorization: `Bearer ${accessToken}` },
        payload: {
          email: `novo${Date.now()}@pilates.local`,
          nome: 'Novo Usuário',
          cpf: '12345678901',
          senha: 'senha123',
          senhaConfirmacao: 'senha456',
          funcao: 'RECEPCIONISTA',
        },
      })

      expect(response.statusCode).toBe(400)
    })

    it('deve retornar 400 com CPF inválido', async () => {
      const accessToken = await loginAsAdmin()

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        headers: { authorization: `Bearer ${accessToken}` },
        payload: {
          email: `novo${Date.now()}@pilates.local`,
          nome: 'Novo Usuário',
          cpf: '123',
          senha: 'senha123',
          senhaConfirmacao: 'senha123',
          funcao: 'RECEPCIONISTA',
        },
      })

      expect(response.statusCode).toBe(400)
    })

    it('deve retornar 400 com nome muito curto', async () => {
      const accessToken = await loginAsAdmin()

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        headers: { authorization: `Bearer ${accessToken}` },
        payload: {
          email: `novo${Date.now()}@pilates.local`,
          nome: 'Na',
          cpf: '12345678901',
          senha: 'senha123',
          senhaConfirmacao: 'senha123',
          funcao: 'RECEPCIONISTA',
        },
      })

      expect(response.statusCode).toBe(400)
    })

    it('deve retornar 401 sem autenticação', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          email: `novo${Date.now()}@pilates.local`,
          nome: 'Novo Usuário',
          cpf: '12345678901',
          senha: 'senha123',
          senhaConfirmacao: 'senha123',
          funcao: 'RECEPCIONISTA',
        },
      })

      expect(response.statusCode).toBe(401)
    })
  })

  describe('POST /api/v1/auth/refresh', () => {
    it('deve renovar token com refresh token válido', async () => {
      // refreshToken() valida que o usuarioId do token corresponde a um
      // usuário real e ATIVO no banco — precisa ser um ID existente.
      const usuarioId = await getAdminUsuarioId()
      const tokens = jwtUtils.generateTokens({
        usuarioId,
        email: 'admin@pilates.local',
        funcao: 'ADMIN',
      })

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/auth/refresh',
        payload: {
          refreshToken: tokens.refreshToken,
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      expect(body.data.accessToken).toBeDefined()
      expect(body.data.refreshToken).toBeDefined()
      // Novo token deve ser diferente do antigo (rotação)
      expect(body.data.refreshToken).not.toBe(tokens.refreshToken)
    })

    it('deve retornar 400 com refresh token malformado (corpo inválido)', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/auth/refresh',
        payload: {
          refreshToken: 'curto', // menor que o minLength:10 do schema da rota
        },
      })

      expect(response.statusCode).toBe(400)
    })

    it('deve retornar 401 com refresh token que não é um JWT válido', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/auth/refresh',
        payload: {
          refreshToken: 'invalid-token-mas-com-mais-de-10-chars',
        },
      })

      expect(response.statusCode).toBe(401)
    })

    it('deve retornar 401 com refresh token expirado', async () => {
      // Criar um token expirado
      const expiredToken = jwtUtils.generateRefreshToken({
        usuarioId: 'user-123',
        email: 'test@pilates.local',
        funcao: 'ADMIN',
      })

      // Aguardar um momento para garantir que está expirado
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/auth/refresh',
        payload: {
          refreshToken: expiredToken,
        },
      })

      // Pode ser 401 ou 400 dependendo da implementação
      expect([400, 401]).toContain(response.statusCode)
    })
  })

  describe('POST /api/v1/auth/logout', () => {
    it('deve fazer logout com autenticação válida', async () => {
      const accessToken = adminAccessToken

      // Depois fazer logout
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/auth/logout',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
    })

    it('deve retornar 401 sem autenticação', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/auth/logout',
      })

      expect(response.statusCode).toBe(401)
    })

    it('deve retornar 401 com token inválido', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/auth/logout',
        headers: {
          authorization: 'Bearer invalid-token',
        },
      })

      expect(response.statusCode).toBe(401)
    })
  })

  describe('POST /api/v1/auth/change-password', () => {
    it('deve mudar senha com autenticação e senha atual correta', async () => {
      const accessToken = adminAccessToken

      // Depois mudar senha
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/auth/change-password',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: {
          senhaAtual: 'admin123',
          novaSenha: 'novaSenha456',
          novaSenhaConfirmacao: 'novaSenha456',
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)

      // Reverte a senha para não quebrar os demais testes/execuções que
      // dependem da senha original do usuário seedado (admin123)
      const revertResponse = await fastify.inject({
        method: 'POST',
        url: '/api/v1/auth/change-password',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: {
          senhaAtual: 'novaSenha456',
          novaSenha: 'admin123',
          novaSenhaConfirmacao: 'admin123',
        },
      })
      expect(revertResponse.statusCode).toBe(200)
    })

    it('deve retornar 401 sem autenticação', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/auth/change-password',
        payload: {
          senhaAtual: 'admin123',
          novaSenha: 'novaSenha456',
          novaSenhaConfirmacao: 'novaSenha456',
        },
      })

      expect(response.statusCode).toBe(401)
    })

    it('deve retornar 401 com senha atual incorreta', async () => {
      const accessToken = adminAccessToken

      // Tentar mudar com senha errada
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/auth/change-password',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: {
          senhaAtual: 'senhaErrada',
          novaSenha: 'novaSenha456',
          novaSenhaConfirmacao: 'novaSenha456',
        },
      })

      expect(response.statusCode).toBe(401)
    })

    it('deve retornar 400 com senhas de confirmação não correspondentes', async () => {
      const accessToken = adminAccessToken

      // Tentar mudar com senhas não correspondentes
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/auth/change-password',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: {
          senhaAtual: 'admin123',
          novaSenha: 'novaSenha456',
          novaSenhaConfirmacao: 'novaSenha789',
        },
      })

      expect(response.statusCode).toBe(400)
    })
  })
})
