import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AvaliacoesService } from '../avaliacoes.service'
import { AppError, ValidationError } from '../../../shared/errors'

vi.mock('../../../database/prisma.client', () => ({
  prisma: {
    aluno: { findUnique: vi.fn().mockResolvedValue({ id: 'aluno-1' }) },
  },
}))

const ALUNO_ID = '11111111-1111-1111-1111-111111111111'
const REGISTRADO_POR_ID = '22222222-2222-2222-2222-222222222222'

describe('AvaliacoesService', () => {
  let service: AvaliacoesService
  let mockRepo: any

  beforeEach(() => {
    mockRepo = {
      findById: vi.fn(),
      findAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    }
    service = new AvaliacoesService(mockRepo)
  })

  describe('criar', () => {
    it('cria avaliação com dados válidos e calcula o IMC', async () => {
      mockRepo.create.mockResolvedValue({
        id: 'aval-1',
        alunoId: ALUNO_ID,
        registradoPorId: REGISTRADO_POR_ID,
        dataAvaliacao: new Date('2026-07-01'),
        peso: 70,
        altura: 1.75,
        medidas: null,
        queixaPrincipal: null,
        historicoMedico: null,
        observacoesPostura: null,
        observacoesGerais: null,
        criadoEm: new Date(),
        atualizadoEm: new Date(),
        fotos: [],
      })

      const result = await service.criar({
        alunoId: ALUNO_ID,
        registradoPorId: REGISTRADO_POR_ID,
        dataAvaliacao: '2026-07-01',
        peso: 70,
        altura: 1.75,
      })

      expect(mockRepo.create).toHaveBeenCalledOnce()
      expect(result.imc).toBeCloseTo(22.86, 1)
    })

    it('lança erro se o aluno não existe', async () => {
      const { prisma } = await import('../../../database/prisma.client')
      vi.mocked(prisma.aluno.findUnique).mockResolvedValueOnce(null as any)

      await expect(
        service.criar({
          alunoId: ALUNO_ID,
          registradoPorId: REGISTRADO_POR_ID,
          dataAvaliacao: '2026-07-01',
        }),
      ).rejects.toThrow(ValidationError)
      expect(mockRepo.create).not.toHaveBeenCalled()
    })

    it('lança erro de validação para data inválida', async () => {
      await expect(
        service.criar({ alunoId: ALUNO_ID, registradoPorId: REGISTRADO_POR_ID, dataAvaliacao: 'não-é-data' }),
      ).rejects.toThrow()
      expect(mockRepo.create).not.toHaveBeenCalled()
    })

    it('rejeita foto com tipo de arquivo não permitido', async () => {
      let erroCapturado: any
      try {
        await service.criar({
          alunoId: ALUNO_ID,
          registradoPorId: REGISTRADO_POR_ID,
          dataAvaliacao: '2026-07-01',
          fotos: [{ arquivo: 'YWJj', tipoArquivo: 'application/pdf' }],
        })
      } catch (error) {
        erroCapturado = error
      }

      expect(erroCapturado).toBeInstanceOf(ValidationError)
      expect(erroCapturado.details[0].message).toBe('Tipo de arquivo não permitido. Use JPG, PNG ou WEBP.')
      expect(mockRepo.create).not.toHaveBeenCalled()
    })
  })

  describe('buscarPorId', () => {
    it('retorna avaliação existente com imc calculado', async () => {
      mockRepo.findById.mockResolvedValue({
        id: 'aval-1',
        alunoId: ALUNO_ID,
        peso: null,
        altura: null,
      })

      const result = await service.buscarPorId('aval-1')
      expect(result.imc).toBeNull()
    })

    it('lança AppError 404 se não existe', async () => {
      mockRepo.findById.mockResolvedValue(null)
      await expect(service.buscarPorId('inexistente')).rejects.toThrow(AppError)
    })
  })

  describe('excluir', () => {
    it('exclui avaliação existente', async () => {
      mockRepo.findById.mockResolvedValue({ id: 'aval-1', peso: null, altura: null })
      await service.excluir('aval-1')
      expect(mockRepo.delete).toHaveBeenCalledWith('aval-1')
    })

    it('lança AppError 404 quando não existe', async () => {
      mockRepo.findById.mockResolvedValue(null)
      await expect(service.excluir('inexistente')).rejects.toThrow(AppError)
    })
  })
})
