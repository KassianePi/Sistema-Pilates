/**
 * Testes dos schemas de autenticação
 */

import { describe, it, expect } from 'vitest'
import { loginSchema, registerSchema, refreshTokenSchema, changePasswordSchema } from '../schemas/auth.schema'
import { ZodError } from 'zod'

describe('Auth Schemas', () => {
  describe('loginSchema', () => {
    it('deve validar login correto', () => {
      const data = {
        email: 'user@pilates.local',
        senha: 'senha123',
      }
      const result = loginSchema.parse(data)
      expect(result.email).toBe('user@pilates.local')
      expect(result.senha).toBe('senha123')
    })

    it('deve rejeitar email inválido', () => {
      const data = { email: 'invalid-email', senha: 'senha123' }
      expect(() => loginSchema.parse(data)).toThrow(ZodError)
    })

    it('deve rejeitar senha muito curta', () => {
      const data = { email: 'user@pilates.local', senha: '12345' }
      expect(() => loginSchema.parse(data)).toThrow(ZodError)
    })

    it('deve converter email para minúsculas', () => {
      const data = { email: 'USER@PILATES.LOCAL', senha: 'senha123' }
      const result = loginSchema.parse(data)
      expect(result.email).toBe('user@pilates.local')
    })
  })

  describe('registerSchema', () => {
    it('deve validar registro correto', () => {
      const data = {
        email: 'novo@pilates.local',
        nome: 'João Silva',
        senha: 'senha123',
        senhaConfirmacao: 'senha123',
        telefone: '11987654321',
      }
      const result = registerSchema.parse(data)
      expect(result.email).toBe('novo@pilates.local')
      expect(result.nome).toBe('João Silva')
    })

    it('deve rejeitar senhas não correspondentes', () => {
      const data = {
        email: 'novo@pilates.local',
        nome: 'João Silva',
        senha: 'senha123',
        senhaConfirmacao: 'senha456',
        telefone: '11987654321',
      }
      expect(() => registerSchema.parse(data)).toThrow(ZodError)
    })

    it('deve rejeitar nome muito curto', () => {
      const data = {
        email: 'novo@pilates.local',
        nome: 'Jo',
        senha: 'senha123',
        senhaConfirmacao: 'senha123',
        telefone: '11987654321',
      }
      expect(() => registerSchema.parse(data)).toThrow(ZodError)
    })

    it('deve aceitar telefone opcional', () => {
      const data = {
        email: 'novo@pilates.local',
        nome: 'João Silva',
        senha: 'senha123',
        senhaConfirmacao: 'senha123',
      }
      const result = registerSchema.parse(data)
      expect(result.telefone).toBeUndefined()
    })
  })

  describe('refreshTokenSchema', () => {
    it('deve validar refresh token', () => {
      const data = { refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }
      const result = refreshTokenSchema.parse(data)
      expect(result.refreshToken).toBeDefined()
    })

    it('deve rejeitar token muito curto', () => {
      const data = { refreshToken: '123' }
      expect(() => refreshTokenSchema.parse(data)).toThrow(ZodError)
    })
  })

  describe('changePasswordSchema', () => {
    it('deve validar mudança de senha correta', () => {
      const data = {
        senhaAtual: 'senha123',
        novaSenha: 'novaSenha456',
        novaSenhaConfirmacao: 'novaSenha456',
      }
      const result = changePasswordSchema.parse(data)
      expect(result.novaSenha).toBe('novaSenha456')
    })

    it('deve rejeitar nova senha igual à atual', () => {
      const data = {
        senhaAtual: 'senha123',
        novaSenha: 'senha123',
        novaSenhaConfirmacao: 'senha123',
      }
      expect(() => changePasswordSchema.parse(data)).toThrow(ZodError)
    })

    it('deve rejeitar confirmação diferente', () => {
      const data = {
        senhaAtual: 'senha123',
        novaSenha: 'novaSenha456',
        novaSenhaConfirmacao: 'novaSenha789',
      }
      expect(() => changePasswordSchema.parse(data)).toThrow(ZodError)
    })
  })
})
