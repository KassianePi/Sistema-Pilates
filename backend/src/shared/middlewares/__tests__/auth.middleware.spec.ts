/**
 * Testes do middleware de autenticação
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { authenticateToken, optionalAuth, requireRole } from '../auth.middleware'
import { UnauthorizedError } from '../../errors/UnauthorizedError'
import { generateTokens } from '../../utils/jwt'

/**
 * Mock de FastifyRequest
 */
function mockRequest(overrides = {}) {
  return {
    id: 'req-123',
    url: '/api/v1/test',
    ip: '127.0.0.1',
    headers: {},
    ...overrides,
  }
}

/**
 * Mock de FastifyReply
 */
function mockReply() {
  return {}
}

describe('Auth Middleware', () => {
  describe('authenticateToken', () => {
    it('deve extrair e validar token válido', async () => {
      const { accessToken } = generateTokens({
        usuarioId: '123',
        email: 'user@pilates.local',
        funcao: 'ADMIN',
      })

      const request = mockRequest({
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      })

      const reply = mockReply()

      await authenticateToken(request as any, reply as any)

      expect(request.usuarioId).toBe('123')
      expect(request.email).toBe('user@pilates.local')
      expect(request.funcao).toBe('ADMIN')
      expect(request.payload).toBeDefined()
    })

    it('deve lançar erro se token não fornecido', async () => {
      const request = mockRequest({
        headers: {},
      })

      const reply = mockReply()

      await expect(authenticateToken(request as any, reply as any)).rejects.toThrow(UnauthorizedError)
    })

    it('deve lançar erro se header Authorization inválido', async () => {
      const request = mockRequest({
        headers: {
          authorization: 'InvalidFormat token',
        },
      })

      const reply = mockReply()

      await expect(authenticateToken(request as any, reply as any)).rejects.toThrow(UnauthorizedError)
    })
  })

  describe('optionalAuth', () => {
    it('deve continuar sem erro se sem token', async () => {
      const request = mockRequest({
        headers: {},
      })

      const reply = mockReply()

      // Não deve lançar erro
      await expect(optionalAuth(request as any, reply as any)).resolves.toBeUndefined()
      expect(request.usuarioId).toBeUndefined()
    })

    it('deve validar token se fornecido', async () => {
      const { accessToken } = generateTokens({
        usuarioId: '456',
        email: 'admin@pilates.local',
        funcao: 'ADMIN',
      })

      const request = mockRequest({
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      })

      const reply = mockReply()

      await optionalAuth(request as any, reply as any)

      expect(request.usuarioId).toBe('456')
      expect(request.funcao).toBe('ADMIN')
    })
  })

  describe('requireRole', () => {
    it('deve permitir acesso para rol correto', async () => {
      const { accessToken } = generateTokens({
        usuarioId: '123',
        email: 'admin@pilates.local',
        funcao: 'ADMIN',
      })

      const request = mockRequest({
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        usuarioId: '123',
        funcao: 'ADMIN',
      })

      const reply = mockReply()
      const middleware = requireRole('ADMIN')

      await expect(middleware(request as any, reply as any)).resolves.toBeUndefined()
    })

    it('deve negar acesso para rol incorreto', async () => {
      const request = mockRequest({
        usuarioId: '123',
        funcao: 'PROFESSOR',
      })

      const reply = mockReply()
      const middleware = requireRole('ADMIN')

      await expect(middleware(request as any, reply as any)).rejects.toThrow(UnauthorizedError)
    })

    it('deve permitir múltiplos roles', async () => {
      const request = mockRequest({
        usuarioId: '123',
        funcao: 'FINANCEIRO',
      })

      const reply = mockReply()
      const middleware = requireRole('ADMIN', 'FINANCEIRO')

      await expect(middleware(request as any, reply as any)).resolves.toBeUndefined()
    })
  })
})
