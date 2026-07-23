import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ReposicoesService } from '../reposicoes.service'
import { AppError, ValidationError } from '../../../shared/errors'

vi.mock('../../../events/event-bus', () => ({
  eventBus: { on: vi.fn(), emit: vi.fn() },
}))

vi.mock('../../notificacoes/notificacoes.service', () => ({
  notificacoesService: { criar: vi.fn().mockResolvedValue(undefined) },
}))

vi.mock('../../../database/prisma.client', () => ({
  prisma: {
    aluno: { findUnique: vi.fn().mockResolvedValue({ id: 'aluno-1', usuarioId: 'usuario-1' }) },
    aula: { findUnique: vi.fn() },
    inscricaoAula: { findUnique: vi.fn().mockResolvedValue({ alunoId: 'aluno-1', aulaId: 'aula-original-1' }) },
  },
}))

const ALUNO_ID = '11111111-1111-1111-1111-111111111111'
const AULA_ORIGINAL_ID = '22222222-2222-2222-2222-222222222222'
const AULA_REPOSICAO_ID = '33333333-3333-3333-3333-333333333333'

function aulaFake(overrides: Partial<{ status: string; dataHoraInicio: Date; capacidade: number; sala: string }> = {}) {
  return {
    id: AULA_ORIGINAL_ID,
    status: 'REALIZADA',
    dataHoraInicio: new Date('2026-07-05T10:00:00.000Z'),
    capacidade: 10,
    sala: 'Sala 1',
    ...overrides,
  }
}

describe('ReposicoesService', () => {
  let service: ReposicoesService
  let mockRepo: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockRepo = {
      findById: vi.fn(),
      findPendenteOuAgendadaPorAula: vi.fn(),
      findAll: vi.fn(),
      create: vi.fn(),
      countInscricoesAtivas: vi.fn(),
      agendar: vi.fn(),
      atualizarStatus: vi.fn(),
      marcarRealizadasPorAulaDestino: vi.fn(),
    }
    service = new ReposicoesService(mockRepo)
  })

  describe('solicitar', () => {
    it('cria a reposição quando a aula já ocorreu e o aluno estava matriculado', async () => {
      const { prisma } = await import('../../../database/prisma.client')
      vi.mocked(prisma.aula.findUnique).mockResolvedValue(aulaFake() as any)
      mockRepo.findPendenteOuAgendadaPorAula.mockResolvedValue(null)
      mockRepo.create.mockResolvedValue({ id: 'rep-1', status: 'PENDENTE', alunoId: ALUNO_ID })

      const result = await service.solicitar({
        alunoId: ALUNO_ID,
        aulaOriginalId: AULA_ORIGINAL_ID,
        motivo: 'Fiquei doente',
      })

      expect(mockRepo.create).toHaveBeenCalledOnce()
      expect(result.status).toBe('PENDENTE')
    })

    it('rejeita se a aula original ainda não ocorreu', async () => {
      const { prisma } = await import('../../../database/prisma.client')
      vi.mocked(prisma.aula.findUnique).mockResolvedValue(aulaFake({ status: 'AGENDADA' }) as any)

      await expect(
        service.solicitar({ alunoId: ALUNO_ID, aulaOriginalId: AULA_ORIGINAL_ID, motivo: 'Motivo válido' }),
      ).rejects.toThrow(AppError)
      expect(mockRepo.create).not.toHaveBeenCalled()
    })

    it('rejeita se o aluno não estava matriculado na aula', async () => {
      const { prisma } = await import('../../../database/prisma.client')
      vi.mocked(prisma.aula.findUnique).mockResolvedValue(aulaFake() as any)
      vi.mocked(prisma.inscricaoAula.findUnique).mockResolvedValueOnce(null as any)

      await expect(
        service.solicitar({ alunoId: ALUNO_ID, aulaOriginalId: AULA_ORIGINAL_ID, motivo: 'Motivo válido' }),
      ).rejects.toThrow(AppError)
      expect(mockRepo.create).not.toHaveBeenCalled()
    })

    it('rejeita se já existe solicitação pendente/agendada para a mesma aula', async () => {
      const { prisma } = await import('../../../database/prisma.client')
      vi.mocked(prisma.aula.findUnique).mockResolvedValue(aulaFake() as any)
      mockRepo.findPendenteOuAgendadaPorAula.mockResolvedValue({ id: 'rep-existente' })

      await expect(
        service.solicitar({ alunoId: ALUNO_ID, aulaOriginalId: AULA_ORIGINAL_ID, motivo: 'Motivo válido' }),
      ).rejects.toThrow(AppError)
      expect(mockRepo.create).not.toHaveBeenCalled()
    })
  })

  describe('agendar', () => {
    it('agenda quando a aula de destino está no mesmo mês e tem vaga', async () => {
      mockRepo.findById.mockResolvedValue({
        id: 'rep-1',
        status: 'PENDENTE',
        alunoId: ALUNO_ID,
        aulaOriginalId: AULA_ORIGINAL_ID,
      })
      const { prisma } = await import('../../../database/prisma.client')
      vi.mocked(prisma.aula.findUnique)
        .mockResolvedValueOnce(aulaFake({ dataHoraInicio: new Date('2026-07-05T10:00:00.000Z') }) as any)
        .mockResolvedValueOnce(
          aulaFake({ id: AULA_REPOSICAO_ID, dataHoraInicio: new Date('2026-07-20T10:00:00.000Z') }) as any,
        )
      mockRepo.countInscricoesAtivas.mockResolvedValue(3)
      mockRepo.agendar.mockResolvedValue({ id: 'rep-1', status: 'AGENDADA', aulaReposicaoId: AULA_REPOSICAO_ID })

      const result = await service.agendar('rep-1', { aulaReposicaoId: AULA_REPOSICAO_ID })

      expect(mockRepo.agendar).toHaveBeenCalledWith('rep-1', ALUNO_ID, AULA_REPOSICAO_ID)
      expect(result.status).toBe('AGENDADA')
    })

    it('rejeita se a aula de destino é em outro mês', async () => {
      mockRepo.findById.mockResolvedValue({
        id: 'rep-1',
        status: 'PENDENTE',
        alunoId: ALUNO_ID,
        aulaOriginalId: AULA_ORIGINAL_ID,
      })
      const { prisma } = await import('../../../database/prisma.client')
      vi.mocked(prisma.aula.findUnique)
        .mockResolvedValueOnce(aulaFake({ dataHoraInicio: new Date('2026-07-05T10:00:00.000Z') }) as any)
        .mockResolvedValueOnce(
          aulaFake({ id: AULA_REPOSICAO_ID, dataHoraInicio: new Date('2026-08-05T10:00:00.000Z') }) as any,
        )

      await expect(service.agendar('rep-1', { aulaReposicaoId: AULA_REPOSICAO_ID })).rejects.toThrow(ValidationError)
      expect(mockRepo.agendar).not.toHaveBeenCalled()
    })

    it('rejeita se a aula de destino não tem vaga', async () => {
      mockRepo.findById.mockResolvedValue({
        id: 'rep-1',
        status: 'PENDENTE',
        alunoId: ALUNO_ID,
        aulaOriginalId: AULA_ORIGINAL_ID,
      })
      const { prisma } = await import('../../../database/prisma.client')
      vi.mocked(prisma.aula.findUnique)
        .mockResolvedValueOnce(aulaFake({ dataHoraInicio: new Date('2026-07-05T10:00:00.000Z') }) as any)
        .mockResolvedValueOnce(
          aulaFake({
            id: AULA_REPOSICAO_ID,
            dataHoraInicio: new Date('2026-07-20T10:00:00.000Z'),
            capacidade: 5,
          }) as any,
        )
      mockRepo.countInscricoesAtivas.mockResolvedValue(5)

      await expect(service.agendar('rep-1', { aulaReposicaoId: AULA_REPOSICAO_ID })).rejects.toThrow(ValidationError)
      expect(mockRepo.agendar).not.toHaveBeenCalled()
    })

    it('rejeita se a reposição não está mais pendente', async () => {
      mockRepo.findById.mockResolvedValue({ id: 'rep-1', status: 'AGENDADA', alunoId: ALUNO_ID })

      await expect(service.agendar('rep-1', { aulaReposicaoId: AULA_REPOSICAO_ID })).rejects.toThrow(AppError)
      expect(mockRepo.agendar).not.toHaveBeenCalled()
    })
  })

  describe('cancelar', () => {
    it('cancela reposição pendente', async () => {
      mockRepo.findById.mockResolvedValue({ id: 'rep-1', status: 'PENDENTE' })
      mockRepo.atualizarStatus.mockResolvedValue({ id: 'rep-1', status: 'CANCELADA' })

      const result = await service.cancelar('rep-1')
      expect(result.status).toBe('CANCELADA')
    })

    it('rejeita cancelar reposição já realizada', async () => {
      mockRepo.findById.mockResolvedValue({ id: 'rep-1', status: 'REALIZADA' })
      await expect(service.cancelar('rep-1')).rejects.toThrow(AppError)
      expect(mockRepo.atualizarStatus).not.toHaveBeenCalled()
    })
  })
})
