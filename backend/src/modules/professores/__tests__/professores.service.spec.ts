import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ProfessoresService } from '../professores.service'

vi.mock('../../../database/prisma.client', () => ({
  prisma: {
    usuario: {
      findUnique: vi.fn().mockResolvedValue(null),
    },
  },
}))

describe('ProfessoresService', () => {
  let service: ProfessoresService
  let mockRepo: any

  beforeEach(() => {
    mockRepo = {
      findById: vi.fn(),
      findAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      countAulas: vi.fn(),
    }
    service = new ProfessoresService(mockRepo)
  })

  describe('buscarPorId', () => {
    it('deve retornar professor existente', async () => {
      const prof = { id: 'uuid-1', usuarioId: 'u-1', status: 'ATIVO' }
      mockRepo.findById.mockResolvedValue(prof)
      const result = await service.buscarPorId('uuid-1')
      expect(result).toEqual(prof)
    })

    it('deve lançar 404 se professor não existe', async () => {
      mockRepo.findById.mockResolvedValue(null)
      await expect(service.buscarPorId('inexistente')).rejects.toThrow('Professor')
    })
  })

  describe('excluir', () => {
    it('deve excluir professor sem aulas agendadas', async () => {
      mockRepo.findById.mockResolvedValue({ id: 'uuid-1' })
      mockRepo.countAulas.mockResolvedValue(0)
      mockRepo.delete.mockResolvedValue(undefined)
      await expect(service.excluir('uuid-1')).resolves.not.toThrow()
    })

    it('deve lançar erro se professor tem aulas agendadas', async () => {
      mockRepo.findById.mockResolvedValue({ id: 'uuid-1' })
      mockRepo.countAulas.mockResolvedValue(3)
      await expect(service.excluir('uuid-1')).rejects.toThrow('aulas')
    })
  })
})
