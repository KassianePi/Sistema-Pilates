/**
 * Testes do middleware RBAC
 */

import { describe, it, expect } from 'vitest'
import { hasPermission, authorize, authorizeAny, authorizeAll, ROLE_PERMISSIONS } from '../rbac.middleware'
import { UnauthorizedError } from '../../errors/UnauthorizedError'

function mockRequest(funcao: any) {
  return {
    id: 'req-123',
    url: '/api/v1/test',
    usuarioId: '123',
    funcao,
  }
}

function mockReply() {
  return {}
}

describe('RBAC Middleware', () => {
  describe('hasPermission', () => {
    it('ADMIN deve ter acesso total', () => {
      expect(hasPermission('ADMIN', 'usuarios', 'create')).toBe(true)
      expect(hasPermission('ADMIN', 'usuarios', 'delete')).toBe(true)
      expect(hasPermission('ADMIN', 'alunos', 'delete')).toBe(true)
      expect(hasPermission('ADMIN', 'qualquer_recurso', 'qualquer_acao')).toBe(false) // recurso não existe
    })

    it('PROFESSOR tem acesso limitado', () => {
      expect(hasPermission('PROFESSOR', 'alunos', 'read')).toBe(true)
      expect(hasPermission('PROFESSOR', 'alunos', 'delete')).toBe(false)
      expect(hasPermission('PROFESSOR', 'presenca', 'create')).toBe(true)
      expect(hasPermission('PROFESSOR', 'pagamentos', 'read')).toBe(false)
    })

    it('RECEPCIONISTA pode gerenciar aulas e alunos', () => {
      expect(hasPermission('RECEPCIONISTA', 'alunos', 'create')).toBe(true)
      expect(hasPermission('RECEPCIONISTA', 'alunos', 'delete')).toBe(false)
      expect(hasPermission('RECEPCIONISTA', 'agenda', 'create')).toBe(true)
      expect(hasPermission('RECEPCIONISTA', 'sistema', 'config')).toBe(false)
    })

    it('FINANCEIRO acessa apenas financeiro', () => {
      expect(hasPermission('FINANCEIRO', 'pagamentos', 'create')).toBe(true)
      expect(hasPermission('FINANCEIRO', 'relatorios', 'read')).toBe(true)
      expect(hasPermission('FINANCEIRO', 'usuarios', 'read')).toBe(false)
      expect(hasPermission('FINANCEIRO', 'sistema', 'config')).toBe(false)
    })
  })

  describe('authorize middleware', () => {
    it('deve permitir acesso quando tem permissão', async () => {
      const request = mockRequest('ADMIN')
      const reply = mockReply()

      const middleware = authorize('usuarios', 'delete')

      await expect(middleware(request as any, reply as any)).resolves.toBeUndefined()
    })

    it('deve negar acesso quando sem permissão', async () => {
      const request = mockRequest('PROFESSOR')
      const reply = mockReply()

      const middleware = authorize('usuarios', 'delete')

      await expect(middleware(request as any, reply as any)).rejects.toThrow(UnauthorizedError)
    })

    it('deve lançar erro se não autenticado', async () => {
      const request = mockRequest(undefined)
      const reply = mockReply()

      const middleware = authorize('usuarios', 'delete')

      await expect(middleware(request as any, reply as any)).rejects.toThrow(UnauthorizedError)
    })
  })

  describe('authorizeAny middleware', () => {
    it('deve permitir se tem uma das permissões', async () => {
      const request = mockRequest('ADMIN')
      const reply = mockReply()

      const middleware = authorizeAny([
        ['alunos', 'create'],
        ['usuarios', 'delete'],
      ])

      await expect(middleware(request as any, reply as any)).resolves.toBeUndefined()
    })

    it('deve negar se não tem nenhuma permissão', async () => {
      const request = mockRequest('PROFESSOR')
      const reply = mockReply()

      const middleware = authorizeAny([
        ['usuarios', 'create'],
        ['usuarios', 'delete'],
      ])

      await expect(middleware(request as any, reply as any)).rejects.toThrow(UnauthorizedError)
    })
  })

  describe('authorizeAll middleware', () => {
    it('deve permitir se tem todas as permissões', async () => {
      const request = mockRequest('ADMIN')
      const reply = mockReply()

      const middleware = authorizeAll([
        ['alunos', 'create'],
        ['usuarios', 'delete'],
      ])

      await expect(middleware(request as any, reply as any)).resolves.toBeUndefined()
    })

    it('deve negar se falta uma permissão', async () => {
      const request = mockRequest('RECEPCIONISTA')
      const reply = mockReply()

      const middleware = authorizeAll([
        ['alunos', 'create'],
        ['alunos', 'delete'], // recepcionista não pode deletar
      ])

      await expect(middleware(request as any, reply as any)).rejects.toThrow(UnauthorizedError)
    })
  })
})
