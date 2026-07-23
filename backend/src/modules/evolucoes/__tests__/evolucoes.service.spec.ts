import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EvolucoesService } from '../evolucoes.service'
import { AppError, ValidationError } from '../../../shared/errors'

vi.mock('../../../database/prisma.client', () => ({
  prisma: {
    aluno: { findUnique: vi.fn().mockResolvedValue({ id: 'aluno-1' }) },
    aula: { findUnique: vi.fn().mockResolvedValue({ id: 'aula-1' }) },
  },
}))

const ALUNO_ID = '11111111-1111-1111-1111-111111111111'
const AULA_ID = '22222222-2222-2222-2222-222222222222'
const REGISTRADO_POR_ID = '33333333-3333-3333-3333-333333333333'

describe('EvolucoesService', () => {
  let service: EvolucoesService
  let mockRepo: any

  beforeEach(() => {
    mockRepo = {
      findById: vi.fn(),
      findAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    }
    service = new EvolucoesService(mockRepo)
  })

  describe('criar', () => {
    it('cria evolução com dados válidos', async () => {
      mockRepo.create.mockResolvedValue({
        id: 'evo-1',
        alunoId: ALUNO_ID,
        aulaId: AULA_ID,
        registradoPorId: REGISTRADO_POR_ID,
        observacao: 'Aluno evoluiu bem no exercício de prancha.',
      })

      const result = await service.criar({
        alunoId: ALUNO_ID,
        aulaId: AULA_ID,
        registradoPorId: REGISTRADO_POR_ID,
        observacao: 'Aluno evoluiu bem no exercício de prancha.',
      })

      expect(mockRepo.create).toHaveBeenCalledOnce()
      expect(result.id).toBe('evo-1')
    })

    it('lança erro se o aluno não existe', async () => {
      const { prisma } = await import('../../../database/prisma.client')
      vi.mocked(prisma.aluno.findUnique).mockResolvedValueOnce(null as any)

      await expect(
        service.criar({ alunoId: ALUNO_ID, aulaId: AULA_ID, registradoPorId: REGISTRADO_POR_ID, observacao: 'Nota' }),
      ).rejects.toThrow(ValidationError)
      expect(mockRepo.create).not.toHaveBeenCalled()
    })

    it('lança erro se a aula não existe', async () => {
      const { prisma } = await import('../../../database/prisma.client')
      vi.mocked(prisma.aula.findUnique).mockResolvedValueOnce(null as any)

      await expect(
        service.criar({ alunoId: ALUNO_ID, aulaId: AULA_ID, registradoPorId: REGISTRADO_POR_ID, observacao: 'Nota' }),
      ).rejects.toThrow(ValidationError)
      expect(mockRepo.create).not.toHaveBeenCalled()
    })

    it('rejeita observação vazia', async () => {
      await expect(
        service.criar({ alunoId: ALUNO_ID, aulaId: AULA_ID, registradoPorId: REGISTRADO_POR_ID, observacao: '' }),
      ).rejects.toThrow()
      expect(mockRepo.create).not.toHaveBeenCalled()
    })
  })

  describe('buscarPorId', () => {
    it('lança AppError 404 quando não existe', async () => {
      mockRepo.findById.mockResolvedValue(null)
      await expect(service.buscarPorId('inexistente')).rejects.toThrow(AppError)
    })
  })

  describe('atualizar', () => {
    it('atualiza a observação de uma evolução existente', async () => {
      mockRepo.findById.mockResolvedValue({ id: 'evo-1', observacao: 'Antiga' })
      mockRepo.update.mockResolvedValue({ id: 'evo-1', observacao: 'Nova observação' })

      const result = await service.atualizar('evo-1', { observacao: 'Nova observação' })
      expect(result.observacao).toBe('Nova observação')
    })
  })

  describe('excluir', () => {
    it('exclui evolução existente', async () => {
      mockRepo.findById.mockResolvedValue({ id: 'evo-1' })
      await service.excluir('evo-1')
      expect(mockRepo.delete).toHaveBeenCalledWith('evo-1')
    })

    it('lança AppError 404 quando não existe', async () => {
      mockRepo.findById.mockResolvedValue(null)
      await expect(service.excluir('inexistente')).rejects.toThrow(AppError)
    })
  })
})
