import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PresencaService } from '../presenca.service'

vi.mock('../../../database/prisma.client', () => ({
  prisma: {
    aluno: { findUnique: vi.fn().mockResolvedValue({ id: 'aluno-1' }) },
    aula: { findUnique: vi.fn().mockResolvedValue({ id: 'aula-1', status: 'AGENDADA' }) },
  },
}))

vi.mock('../../../events/event-bus', () => ({
  eventBus: { emit: vi.fn() },
}))

describe('PresencaService', () => {
  let service: PresencaService
  let mockRepo: any

  beforeEach(() => {
    mockRepo = {
      findById: vi.fn(),
      findByAlunoAula: vi.fn(),
      findAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    }
    service = new PresencaService(mockRepo)
  })

  describe('registrar', () => {
    it('deve registrar presença com dados válidos', async () => {
      mockRepo.findByAlunoAula.mockResolvedValue(null)
      const presencaFake = { id: 'p-1', alunoId: 'aluno-1', aulaId: 'aula-1', status: 'PRESENTE' }
      mockRepo.create.mockResolvedValue(presencaFake)

      const result = await service.registrar({ alunoId: 'aluno-1', aulaId: 'aula-1' })
      expect(result.status).toBe('PRESENTE')
    })

    it('deve lançar erro se presença já registrada', async () => {
      mockRepo.findByAlunoAula.mockResolvedValue({ id: 'p-existente' })
      await expect(service.registrar({ alunoId: 'aluno-1', aulaId: 'aula-1' })).rejects.toThrow()
    })
  })

  describe('buscarPorId', () => {
    it('deve lançar 404 se não existe', async () => {
      mockRepo.findById.mockResolvedValue(null)
      await expect(service.buscarPorId('inexistente')).rejects.toThrow('Presença')
    })
  })
})
