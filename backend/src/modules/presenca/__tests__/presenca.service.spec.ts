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

  const ALUNO_ID = '11111111-1111-1111-1111-111111111111'
  const AULA_ID = '22222222-2222-2222-2222-222222222222'

  describe('registrar', () => {
    it('deve registrar presença com dados válidos', async () => {
      mockRepo.findByAlunoAula.mockResolvedValue(null)
      const presencaFake = { id: 'p-1', alunoId: ALUNO_ID, aulaId: AULA_ID, status: 'PRESENTE' }
      mockRepo.create.mockResolvedValue(presencaFake)

      const result = await service.registrar({ alunoId: ALUNO_ID, aulaId: AULA_ID })
      expect(result.status).toBe('PRESENTE')
    })

    it('deve lançar erro se presença já registrada', async () => {
      mockRepo.findByAlunoAula.mockResolvedValue({ id: 'p-existente' })
      await expect(service.registrar({ alunoId: ALUNO_ID, aulaId: AULA_ID })).rejects.toThrow()
    })
  })

  describe('buscarPorId', () => {
    it('deve lançar 404 se não existe', async () => {
      mockRepo.findById.mockResolvedValue(null)
      await expect(service.buscarPorId('inexistente')).rejects.toThrow('Presença')
    })
  })
})
