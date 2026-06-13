import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AgendaService } from '../agenda.service'

vi.mock('../../../database/prisma.client', () => ({
  prisma: {
    professor: { findUnique: vi.fn().mockResolvedValue({ id: 'prof-1' }) },
    presenca: { findMany: vi.fn().mockResolvedValue([]) },
  },
}))

vi.mock('../../../events/event-bus', () => ({
  eventBus: { emit: vi.fn() },
}))

vi.mock('../../notificacoes/notificacoes.service', () => ({
  notificacoesService: { criar: vi.fn(), notificarAdmins: vi.fn() },
}))

const JUST = { justificativa: 'Professor indisponível na data' }

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
    it('deve cancelar aula agendada com justificativa', async () => {
      mockRepo.findById.mockResolvedValue({ id: 'aula-1', status: 'AGENDADA', dataHoraInicio: new Date() })
      mockRepo.update.mockResolvedValue({ id: 'aula-1', status: 'CANCELADA' })
      const aula = await service.cancelar('aula-1', 'user-1', JUST)
      expect(aula.status).toBe('CANCELADA')
      expect(mockRepo.update).toHaveBeenCalledWith('aula-1', expect.objectContaining({
        status: 'CANCELADA', justificativa: JUST.justificativa, statusAlteradoPorId: 'user-1',
      }))
    })

    it('deve exigir justificativa (mínimo de caracteres)', async () => {
      mockRepo.findById.mockResolvedValue({ id: 'aula-1', status: 'AGENDADA', dataHoraInicio: new Date() })
      await expect(service.cancelar('aula-1', 'user-1', { justificativa: 'x' } as any)).rejects.toThrow()
    })

    it('deve lançar erro ao cancelar aula já realizada', async () => {
      mockRepo.findById.mockResolvedValue({ id: 'aula-1', status: 'REALIZADA', dataHoraInicio: new Date() })
      await expect(service.cancelar('aula-1', 'user-1', JUST)).rejects.toThrow('realizada')
    })
  })

  describe('suspender', () => {
    it('deve suspender aula agendada', async () => {
      mockRepo.findById.mockResolvedValue({ id: 'aula-1', status: 'AGENDADA', dataHoraInicio: new Date() })
      mockRepo.update.mockResolvedValue({ id: 'aula-1', status: 'SUSPENSA' })
      const aula = await service.suspender('aula-1', 'user-1', JUST)
      expect(aula.status).toBe('SUSPENSA')
    })
  })

  describe('reagendar', () => {
    it('deve reagendar guardando a data anterior', async () => {
      const antes = new Date(Date.now() + 86400000)
      mockRepo.findById.mockResolvedValue({ id: 'aula-1', status: 'AGENDADA', dataHoraInicio: antes, professorId: 'prof-1', duracao: 50 })
      mockRepo.findConflito.mockResolvedValue(false)
      mockRepo.update.mockResolvedValue({ id: 'aula-1', status: 'AGENDADA' })
      const nova = new Date(Date.now() + 172800000).toISOString()
      await service.reagendar('aula-1', 'user-1', { dataHoraInicio: nova, justificativa: JUST.justificativa })
      expect(mockRepo.update).toHaveBeenCalledWith('aula-1', expect.objectContaining({
        dataHoraAnterior: antes, dataHoraInicio: new Date(nova),
      }))
    })

    it('deve lançar conflito ao reagendar para horário ocupado', async () => {
      mockRepo.findById.mockResolvedValue({ id: 'aula-1', status: 'AGENDADA', dataHoraInicio: new Date(), professorId: 'prof-1', duracao: 50 })
      mockRepo.findConflito.mockResolvedValue(true)
      const nova = new Date(Date.now() + 172800000).toISOString()
      await expect(service.reagendar('aula-1', 'user-1', { dataHoraInicio: nova, justificativa: JUST.justificativa })).rejects.toThrow()
    })
  })

  describe('excluir', () => {
    it('deve fazer soft delete (status EXCLUIDA)', async () => {
      mockRepo.findById.mockResolvedValue({ id: 'aula-1', status: 'AGENDADA', dataHoraInicio: new Date() })
      mockRepo.update.mockResolvedValue({ id: 'aula-1', status: 'EXCLUIDA' })
      const aula = await service.excluir('aula-1', 'user-1', JUST)
      expect(aula.status).toBe('EXCLUIDA')
      expect(mockRepo.update).toHaveBeenCalledWith('aula-1', expect.objectContaining({ status: 'EXCLUIDA' }))
      expect(mockRepo.delete).not.toHaveBeenCalled()
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
