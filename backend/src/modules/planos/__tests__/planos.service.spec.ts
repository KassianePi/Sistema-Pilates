import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PlanosService } from '../planos.service'

describe('PlanosService', () => {
  let service: PlanosService
  let mockRepo: any

  beforeEach(() => {
    mockRepo = {
      findById: vi.fn(),
      findByNome: vi.fn(),
      findAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      countAlunos: vi.fn(),
    }
    service = new PlanosService(mockRepo)
  })

  describe('criar', () => {
    it('deve criar plano com dados válidos', async () => {
      mockRepo.findByNome.mockResolvedValue(null)
      const planoFake = { id: 'uuid-1', nome: 'Mensal', tipo: 'MENSAL', aulas: 4, preco: '200.00', ativo: true }
      mockRepo.create.mockResolvedValue(planoFake)

      const result = await service.criar({ nome: 'Mensal', tipo: 'MENSAL', aulas: 4, preco: 200 })

      expect(mockRepo.create).toHaveBeenCalledOnce()
      expect(result.nome).toBe('Mensal')
    })

    it('deve lançar erro se nome já existe', async () => {
      mockRepo.findByNome.mockResolvedValue({ id: 'outro-id', nome: 'Mensal' })

      await expect(service.criar({ nome: 'Mensal', tipo: 'MENSAL', aulas: 4, preco: 200 }))
        .rejects.toThrow('Já existe um plano com este nome')
    })

    it('deve lançar erro de validação para aulas inválidas', async () => {
      await expect(service.criar({ nome: 'X', tipo: 'MENSAL', aulas: 0, preco: 200 }))
        .rejects.toThrow()
    })
  })

  describe('buscarPorId', () => {
    it('deve retornar plano existente', async () => {
      const plano = { id: 'uuid-1', nome: 'Mensal' }
      mockRepo.findById.mockResolvedValue(plano)

      const result = await service.buscarPorId('uuid-1')
      expect(result).toEqual(plano)
    })

    it('deve lançar erro 404 se plano não existe', async () => {
      mockRepo.findById.mockResolvedValue(null)

      await expect(service.buscarPorId('uuid-inexistente')).rejects.toThrow('Plano')
    })
  })

  describe('excluir', () => {
    it('deve excluir plano sem alunos', async () => {
      mockRepo.findById.mockResolvedValue({ id: 'uuid-1', nome: 'Mensal' })
      mockRepo.countAlunos.mockResolvedValue(0)
      mockRepo.delete.mockResolvedValue(undefined)

      await expect(service.excluir('uuid-1')).resolves.not.toThrow()
    })

    it('deve lançar erro se plano tem alunos', async () => {
      mockRepo.findById.mockResolvedValue({ id: 'uuid-1', nome: 'Mensal' })
      mockRepo.countAlunos.mockResolvedValue(5)

      await expect(service.excluir('uuid-1')).rejects.toThrow('alunos')
    })
  })
})
