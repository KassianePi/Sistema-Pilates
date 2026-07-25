/**
 * Testes do middleware de autenticação
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { authenticateToken, optionalAuth, requireRole } from '../auth.middleware'
import { UnauthorizedError } from '../../errors/UnauthorizedError'
import { generateTokens } from '../../utils/jwt'

vi.mock('../../../database/prisma.client', () => ({
  prisma: { usuario: { findUnique: vi.fn() } },
}))

/**
 * Mock de FastifyRequest
 */
function mockRequest(overrides: Record<string, unknown> = {}): Record<string, any> {
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
  beforeEach(async () => {
    vi.clearAllMocks()
    const { prisma } = await import('../../../database/prisma.client')
    vi.mocked(prisma.usuario.findUnique).mockResolvedValue({ status: 'ATIVO' } as any)
  })

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

    it('deve rejeitar token válido de usuário excluído (não encontrado no banco)', async () => {
      const { prisma } = await import('../../../database/prisma.client')
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(null)

      const { accessToken } = generateTokens({ usuarioId: 'excluido-1', email: 'x@pilates.local', funcao: 'ALUNO' })
      const request = mockRequest({ headers: { authorization: `Bearer ${accessToken}` } })
      const reply = mockReply()

      await expect(authenticateToken(request as any, reply as any)).rejects.toThrow(UnauthorizedError)
      expect(request.usuarioId).toBeUndefined()
    })

    it('deve rejeitar token válido de usuário inativado', async () => {
      const { prisma } = await import('../../../database/prisma.client')
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue({ status: 'INATIVO' } as any)

      const { accessToken } = generateTokens({ usuarioId: 'inativo-1', email: 'y@pilates.local', funcao: 'ALUNO' })
      const request = mockRequest({ headers: { authorization: `Bearer ${accessToken}` } })
      const reply = mockReply()

      await expect(authenticateToken(request as any, reply as any)).rejects.toThrow(UnauthorizedError)
      expect(request.usuarioId).toBeUndefined()
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

    it('ignora silenciosamente token válido de usuário excluído/inativo', async () => {
      const { prisma } = await import('../../../database/prisma.client')
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(null)

      const { accessToken } = generateTokens({ usuarioId: '789', email: 'z@pilates.local', funcao: 'ALUNO' })
      const request = mockRequest({ headers: { authorization: `Bearer ${accessToken}` } })
      const reply = mockReply()

      await expect(optionalAuth(request as any, reply as any)).resolves.toBeUndefined()
      expect(request.usuarioId).toBeUndefined()
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
