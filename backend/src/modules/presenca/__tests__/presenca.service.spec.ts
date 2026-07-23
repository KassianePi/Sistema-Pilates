import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PresencaService } from '../presenca.service'
import { prisma } from '../../../database/prisma.client'
import { eventBus } from '../../../events/event-bus'

vi.mock('../../../database/prisma.client', () => ({
  prisma: {
    aluno: { findUnique: vi.fn().mockResolvedValue({ id: 'aluno-1' }) },
    aula: { findUnique: vi.fn().mockResolvedValue({ id: 'aula-1', status: 'AGENDADA' }) },
    inscricaoAula: { findMany: vi.fn() },
    $transaction: vi.fn(),
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

  describe('registrarBatch', () => {
    beforeEach(() => {
      vi.mocked(eventBus.emit).mockClear()
      vi.mocked(prisma.inscricaoAula.findMany).mockResolvedValue([{ alunoId: ALUNO_ID } as any])
      vi.mocked(prisma.$transaction).mockImplementation((async (cb: any) =>
        cb({
          presenca: {
            upsert: vi.fn().mockResolvedValue({ id: 'presenca-1', alunoId: ALUNO_ID, aulaId: AULA_ID }),
          },
          aula: { update: vi.fn() },
        })) as any)
    })

    it('deve emitir presenca.registrada para cada aluno além de aula.realizada', async () => {
      await service.registrarBatch(AULA_ID, [{ alunoId: ALUNO_ID, status: 'PRESENTE' }])

      expect(eventBus.emit).toHaveBeenCalledWith('aula.realizada', { aulaId: AULA_ID, totalPresentes: 1 })
      expect(eventBus.emit).toHaveBeenCalledWith('presenca.registrada', {
        presencaId: 'presenca-1',
        alunoId: ALUNO_ID,
      })
    })

    it('deve lançar erro se aluno não estiver matriculado na aula', async () => {
      vi.mocked(prisma.inscricaoAula.findMany).mockResolvedValue([])
      await expect(service.registrarBatch(AULA_ID, [{ alunoId: ALUNO_ID, status: 'PRESENTE' }])).rejects.toThrow()
    })
  })
})
