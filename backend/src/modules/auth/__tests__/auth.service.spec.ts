/**
 * Testes do Auth Service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AuthService } from '../auth.service'
import { UnauthorizedError, ValidationError } from '../../../shared/errors'
import * as hashUtils from '../../../shared/utils/hash'
import * as jwtUtils from '../../../shared/utils/jwt'

/**
 * Mock do AuthRepository
 */
class MockAuthRepository {
  async findByEmail(email: string) {
    if (email === 'existing@pilates.local') {
      return {
        id: 'user-123',
        email: 'existing@pilates.local',
        nome: 'Existing User',
        senhaHash: await hashUtils.hashPassword('senha123'),
        funcao: 'ADMIN' as const,
        ativo: true,
        dataCriacao: new Date(),
        dataAtualizacao: new Date(),
      }
    }
    return null
  }

  async findById(id: string) {
    if (id === 'user-123') {
      return {
        id: 'user-123',
        email: 'existing@pilates.local',
        nome: 'Existing User',
        senhaHash: await hashUtils.hashPassword('senha123'),
        funcao: 'ADMIN' as const,
        ativo: true,
        dataCriacao: new Date(),
        dataAtualizacao: new Date(),
      }
    }
    return null
  }

  async create(data: any) {
    return {
      id: 'new-user-id',
      email: data.email,
      nome: data.nome,
      senhaHash: data.senhaHash,
      funcao: data.funcao,
      ativo: true,
      dataCriacao: new Date(),
      dataAtualizacao: new Date(),
    }
  }

  async updatePassword(usuarioId: string, novoSenhaHash: string) {
    return {
      id: usuarioId,
      email: 'existing@pilates.local',
      nome: 'Existing User',
      senhaHash: novoSenhaHash,
      funcao: 'ADMIN' as const,
      ativo: true,
      dataCriacao: new Date(),
      dataAtualizacao: new Date(),
    }
  }
}

describe('AuthService', () => {
  let service: AuthService
  let repository: MockAuthRepository

  beforeEach(() => {
    repository = new MockAuthRepository()
    service = new AuthService(repository as any)
  })

  describe('login', () => {
    it('deve fazer login com credenciais corretas', async () => {
      const result = await service.login('existing@pilates.local', 'senha123')

      expect(result.usuarioId).toBe('user-123')
      expect(result.email).toBe('existing@pilates.local')
      expect(result.accessToken).toBeDefined()
      expect(result.refreshToken).toBeDefined()
      expect(result.expiresIn).toBe(900) // 15 minutos
    })

    it('deve lançar erro com senha incorreta', async () => {
      await expect(service.login('existing@pilates.local', 'senhaErrada')).rejects.toThrow(
        UnauthorizedError,
      )
    })

    it('deve lançar erro com email não cadastrado', async () => {
      await expect(service.login('notexisting@pilates.local', 'senha123')).rejects.toThrow(
        UnauthorizedError,
      )
    })

    it('deve rejeitar email inválido', async () => {
      await expect(service.login('invalid-email', 'senha123')).rejects.toThrow(ValidationError)
    })

    it('deve rejeitar senha muito curta', async () => {
      await expect(service.login('existing@pilates.local', '12345')).rejects.toThrow(ValidationError)
    })

    it('deve converter email para minúsculas', async () => {
      const result = await service.login('EXISTING@PILATES.LOCAL', 'senha123')
      expect(result.email).toBe('existing@pilates.local')
    })
  })

  describe('register', () => {
    it('deve registrar novo usuário com dados válidos', async () => {
      const result = await service.register(
        'novo@pilates.local',
        'Novo Usuário',
        'senha123',
        'senha123',
      )

      expect(result.usuarioId).toBe('new-user-id')
      expect(result.email).toBe('novo@pilates.local')
      expect(result.nome).toBe('Novo Usuário')
      expect(result.funcao).toBe('RECEPCIONISTA')
      expect(result.accessToken).toBeDefined()
      expect(result.refreshToken).toBeDefined()
    })

    it('deve rejeitar email já cadastrado', async () => {
      await expect(
        service.register('existing@pilates.local', 'Nome', 'senha123', 'senha123'),
      ).rejects.toThrow(ValidationError)
    })

    it('deve rejeitar senhas não correspondentes', async () => {
      await expect(service.register('novo@pilates.local', 'Nome', 'senha123', 'senha456')).rejects.toThrow(
        ValidationError,
      )
    })

    it('deve rejeitar nome muito curto', async () => {
      await expect(service.register('novo@pilates.local', 'Na', 'senha123', 'senha123')).rejects.toThrow(
        ValidationError,
      )
    })

    it('deve permitir funcao customizado', async () => {
      const result = await service.register(
        'novo@pilates.local',
        'Novo Prof',
        'senha123',
        'senha123',
        'PROFESSOR',
      )

      expect(result.funcao).toBe('PROFESSOR')
    })
  })

  describe('refreshToken', () => {
    it('deve renovar token com refresh token válido', async () => {
      const { refreshToken: validRefreshToken } = jwtUtils.generateTokens({
        usuarioId: 'user-123',
        email: 'existing@pilates.local',
        funcao: 'ADMIN',
      })

      const result = await service.refreshToken(validRefreshToken)

      expect(result.accessToken).toBeDefined()
      expect(result.refreshToken).toBeDefined()
      expect(result.expiresIn).toBe(900) // 15 minutos
    })

    it('deve lançar erro com refresh token inválido', async () => {
      await expect(service.refreshToken('invalid-token')).rejects.toThrow(UnauthorizedError)
    })

    it('deve implementar rotação de token', async () => {
      const { refreshToken: tokenAntigo } = jwtUtils.generateTokens({
        usuarioId: 'user-123',
        email: 'existing@pilates.local',
        funcao: 'ADMIN',
      })

      const resultado1 = await service.refreshToken(tokenAntigo)

      // O novo token deve ser diferente do antigo
      expect(resultado1.refreshToken).not.toBe(tokenAntigo)
    })
  })

  describe('changePassword', () => {
    it('deve mudar senha com senha atual correta', async () => {
      await expect(service.changePassword('user-123', 'senha123', 'novaSenha456')).resolves.toBeUndefined()
    })

    it('deve lançar erro com senha atual incorreta', async () => {
      await expect(service.changePassword('user-123', 'senhaErrada', 'novaSenha456')).rejects.toThrow(
        UnauthorizedError,
      )
    })
  })

  describe('logout', () => {
    it('deve fazer logout sem erros', async () => {
      await expect(service.logout('user-123', 'user@pilates.local')).resolves.toBeUndefined()
    })
  })

  describe('generateTemporaryPassword', () => {
    it('deve gerar senha temporária válida', () => {
      const tempPassword = service.generateTemporaryPassword()

      expect(tempPassword).toBeDefined()
      expect(tempPassword.length).toBe(12)
      expect(/[A-Za-z0-9!@#$%&*]/.test(tempPassword)).toBe(true)
    })
  })
})
