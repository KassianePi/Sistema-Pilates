/**
 * Testes dos schemas de aluno
 */

import { describe, it, expect } from 'vitest'
import { createAlunoSchema, updateAlunoSchema, listAlunosSchema } from '../schemas/aluno.schema'
import { ZodError } from 'zod'

describe('Aluno Schemas', () => {
  const validAlunoData = {
    nome: 'Maria Silva',
    email: 'maria@pilates.local',
    telefone: '11987654321',
    dataNascimento: '1990-05-15',
    planoId: '123e4567-e89b-12d3-a456-426614174000',
  }

  describe('createAlunoSchema', () => {
    it('deve validar aluno com dados obrigatórios', () => {
      const result = createAlunoSchema.parse(validAlunoData)
      expect(result.nome).toBe('Maria Silva')
      expect(result.email).toBe('maria@pilates.local')
    })

    it('deve rejeitar nome muito curto', () => {
      const data = { ...validAlunoData, nome: 'Ma' }
      expect(() => createAlunoSchema.parse(data)).toThrow(ZodError)
    })

    it('deve rejeitar email inválido', () => {
      const data = { ...validAlunoData, email: 'invalid-email' }
      expect(() => createAlunoSchema.parse(data)).toThrow(ZodError)
    })

    it('deve rejeitar telefone com formato inválido', () => {
      const data = { ...validAlunoData, telefone: '123' }
      expect(() => createAlunoSchema.parse(data)).toThrow(ZodError)
    })

    it('deve rejeitar aluno menor de idade', () => {
      const data = {
        ...validAlunoData,
        dataNascimento: new Date().toISOString().split('T')[0],
      }
      expect(() => createAlunoSchema.parse(data)).toThrow(ZodError)
    })

    it('deve rejeitar CPF com formato inválido', () => {
      const data = { ...validAlunoData, cpf: '123' }
      expect(() => createAlunoSchema.parse(data)).toThrow(ZodError)
    })

    it('deve aceitar CPF válido', () => {
      const data = { ...validAlunoData, cpf: '12345678901' }
      const result = createAlunoSchema.parse(data)
      expect(result.cpf).toBe('12345678901')
    })

    it('deve aceitar campos opcionais como null', () => {
      const data = {
        ...validAlunoData,
        cpf: null,
        endereco: null,
      }
      const result = createAlunoSchema.parse(data)
      expect(result.cpf).toBeNull()
      expect(result.endereco).toBeNull()
    })
  })

  describe('updateAlunoSchema', () => {
    it('deve aceitar atualização parcial', () => {
      const data = { nome: 'Novo Nome' }
      const result = updateAlunoSchema.parse(data)
      expect(result.nome).toBe('Novo Nome')
      expect(result.email).toBeUndefined()
    })

    it('deve aceitar atualização vazia', () => {
      const data = {}
      const result = updateAlunoSchema.parse(data)
      expect(result).toEqual({})
    })
  })

  describe('listAlunosSchema', () => {
    it('deve validar filtros padrão', () => {
      const data = {}
      const result = listAlunosSchema.parse(data)
      expect(result.limite).toBe(20)
      expect(result.pagina).toBe(1)
      expect(result.ordenarPor).toBe('dataCriacao')
      expect(result.ordem).toBe('desc')
    })

    it('deve validar filtros customizados', () => {
      const data = {
        search: 'Maria',
        ativo: true,
        limite: 50,
        pagina: 2,
      }
      const result = listAlunosSchema.parse(data)
      expect(result.search).toBe('Maria')
      expect(result.ativo).toBe(true)
      expect(result.limite).toBe(50)
      expect(result.pagina).toBe(2)
    })

    it('deve rejeitar limite muito alto', () => {
      const data = { limite: 200 }
      expect(() => listAlunosSchema.parse(data)).toThrow(ZodError)
    })

    it('deve rejeitar página 0', () => {
      const data = { pagina: 0 }
      expect(() => listAlunosSchema.parse(data)).toThrow(ZodError)
    })
  })
})
