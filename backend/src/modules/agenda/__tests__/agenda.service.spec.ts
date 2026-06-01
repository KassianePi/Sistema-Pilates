import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AgendaService } from '../agenda.service'

vi.mock('../../../database/prisma.client', () => ({
  prisma: {
    professor: { findUnique: vi.fn().mockResolvedValue({ id: 'prof-1' }) },
  },
}))

vi.mock('../../../events/event-bus', () => ({
  eventBus: { emit: vi.fn() },
}))

describe('AgendaService', () => {
  let service: AgendaService
  let mockRepo: any

  beforeEach(() => {
    mockRepo = {
      findById: vi.fn(),
      findAll: vi.fn(),
      findConflito: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    }
    service = new AgendaService(mockRepo)
  })

  describe('buscarPorId', () => {
    it('deve retornar aula existente', async () => {
      const aula = { id: 'aula-1', status: 'AGENDADA' }
      mockRepo.findById.mockResolvedValue(aula)
      expect(await service.buscarPorId('aula-1')).toEqual(aula)
    })

    it('deve lançar 404 se aula não existe', async () => {
      mockRepo.findById.mockResolvedValue(null)
      await expect(service.buscarPorId('inexistente')).rejects.toThrow('Aula')
    })
  })

  describe('cancelar', () => {
    it('deve cancelar aula agendada', async () => {
      mockRepo.findById.mockResolvedValue({ id: 'aula-1', status: 'AGENDADA' })
      mockRepo.update.mockResolvedValue({ id: 'aula-1', status: 'CANCELADA' })
      const aula = await service.cancelar('aula-1')
      expect(aula.status).toBe('CANCELADA')
    })

    it('deve lançar erro ao cancelar aula já realizada', async () => {
      mockRepo.findById.mockResolvedValue({ id: 'aula-1', status: 'REALIZADA' })
      await expect(service.cancelar('aula-1')).rejects.toThrow('realizada')
    })
  })

  describe('criar', () => {
    it('deve lançar erro de conflito de horário', async () => {
      mockRepo.findConflito.mockResolvedValue(true)
      await expect(service.criar({
        professorId: 'prof-1',
        dataHoraInicio: new Date(Date.now() + 86400000).toISOString(),
        sala: 'Sala 1',
      })).rejects.toThrow()
    })
  })
})
