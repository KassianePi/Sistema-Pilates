import { describe, it, expect } from 'vitest'
import { canAccess, ROLE_ALLOWED_ROUTES, ROLE_DEFAULT_ROUTE } from './permissions'

describe('canAccess', () => {
  it('ADMIN acessa todas as rotas administrativas', () => {
    for (const rota of ROLE_ALLOWED_ROUTES.ADMIN) {
      expect(canAccess('ADMIN', rota)).toBe(true)
    }
  })

  it('RECEPCIONISTA não acessa rotas fora da sua lista (ex: professores, planos)', () => {
    expect(canAccess('RECEPCIONISTA', '/admin/professores')).toBe(false)
    expect(canAccess('RECEPCIONISTA', '/admin/planos')).toBe(false)
    expect(canAccess('RECEPCIONISTA', '/admin/usuarios')).toBe(false)
  })

  it('RECEPCIONISTA acessa as rotas permitidas (alunos, agenda)', () => {
    expect(canAccess('RECEPCIONISTA', '/admin/alunos')).toBe(true)
    expect(canAccess('RECEPCIONISTA', '/admin/agenda')).toBe(true)
  })

  it('PROFESSOR não acessa usuários nem planos', () => {
    expect(canAccess('PROFESSOR', '/admin/usuarios')).toBe(false)
    expect(canAccess('PROFESSOR', '/admin/planos')).toBe(false)
  })

  it('FINANCEIRO não acessa alunos nem agenda', () => {
    expect(canAccess('FINANCEIRO', '/admin/alunos')).toBe(false)
    expect(canAccess('FINANCEIRO', '/admin/agenda')).toBe(false)
  })

  it('retorna false para uma rota desconhecida', () => {
    expect(canAccess('ADMIN', '/admin/rota-que-nao-existe')).toBe(false)
  })
})

describe('ROLE_DEFAULT_ROUTE', () => {
  it('a rota padrão de cada role está dentro das rotas permitidas para a role', () => {
    for (const role of Object.keys(ROLE_DEFAULT_ROUTE) as Array<keyof typeof ROLE_DEFAULT_ROUTE>) {
      const rotaPadrao = ROLE_DEFAULT_ROUTE[role]
      expect(canAccess(role, rotaPadrao)).toBe(true)
    }
  })
})
