import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AlunosService } from '../alunos.service'

vi.mock('../../../database/prisma.client', () => ({
  prisma: {
    usuario: { findUnique: vi.fn().mockResolvedValue(null) },
    plano: { findUnique: vi.fn().mockResolvedValue({ id: 'plano-1', nome: 'Mensal' }) },
  },
}))

describe('AlunosService', () => {
  let service: AlunosService
  let mockRepo: any

  beforeEach(() => {
    mockRepo = {
      findById: vi.fn(),
      findAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    }
    service = new AlunosService(mockRepo)
  })

  describe('buscarPorId', () => {
    it('deve retornar aluno existente', async () => {
      const aluno = { id: 'uuid-1', usuarioId: 'u-1', status: 'ATIVO' }
      mockRepo.findById.mockResolvedValue(aluno)
      const result = await service.buscarPorId('uuid-1')
      expect(result).toEqual(aluno)
    })

    it('deve lançar 404 se aluno não existe', async () => {
      mockRepo.findById.mockResolvedValue(null)
      await expect(service.buscarPorId('inexistente')).rejects.toThrow('Aluno')
    })
  })

  describe('criar', () => {
    it('deve lançar erro se CPF inválido', async () => {
      await expect(service.criar({
        email: 'a@b.com', nomeCompleto: 'Nome', cpf: '123', senha: 'senha123', dataInicio: '2026-01-01',
      })).rejects.toThrow()
    })
  })

  describe('listar', () => {
    it('deve listar alunos com paginação', async () => {
      mockRepo.findAll.mockResolvedValue({ alunos: [], total: 0 })
      const result = await service.listar({ page: 1, limit: 10 })
      expect(result.total).toBe(0)
      expect(result.totalPages).toBe(0)
    })
  })
})
