import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ConfiguracaoService } from '../configuracao.service'

describe('ConfiguracaoService', () => {
  let service: ConfiguracaoService
  let mockRepo: any

  beforeEach(() => {
    mockRepo = {
      find: vi.fn(),
      upsert: vi.fn(),
    }
    service = new ConfiguracaoService(mockRepo)
  })

  describe('buscar', () => {
    it('retorna null quando ainda não há configuração salva', async () => {
      mockRepo.find.mockResolvedValue(null)
      const result = await service.buscar()
      expect(result).toBeNull()
    })

    it('retorna a configuração existente', async () => {
      mockRepo.find.mockResolvedValue({ id: 'studio', chavePix: 'pix@studio.com', tipoChavePix: 'EMAIL' })
      const result = await service.buscar()
      expect(result?.chavePix).toBe('pix@studio.com')
    })
  })

  describe('salvar', () => {
    it('salva configuração válida', async () => {
      mockRepo.upsert.mockResolvedValue({
        id: 'studio',
        chavePix: '12345678901',
        tipoChavePix: 'CPF',
        nomeRecebedor: 'Studio Pilates',
      })

      const result = await service.salvar({
        chavePix: '12345678901',
        tipoChavePix: 'CPF',
        nomeRecebedor: 'Studio Pilates',
      })

      expect(mockRepo.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ chavePix: '12345678901', tipoChavePix: 'CPF', nomeRecebedor: 'Studio Pilates' }),
      )
      expect(result.tipoChavePix).toBe('CPF')
    })

    it('rejeita tipoChavePix fora do enum permitido', async () => {
      await expect(service.salvar({ tipoChavePix: 'BITCOIN' as any })).rejects.toThrow()
      expect(mockRepo.upsert).not.toHaveBeenCalled()
    })

    it('rejeita chavePix acima de 255 caracteres', async () => {
      await expect(service.salvar({ chavePix: 'x'.repeat(256) })).rejects.toThrow()
      expect(mockRepo.upsert).not.toHaveBeenCalled()
    })

    it('rejeita nomeRecebedor acima de 255 caracteres', async () => {
      await expect(service.salvar({ nomeRecebedor: 'x'.repeat(256) })).rejects.toThrow()
      expect(mockRepo.upsert).not.toHaveBeenCalled()
    })

    it('aceita campos nulos/ausentes (todos opcionais)', async () => {
      mockRepo.upsert.mockResolvedValue({ id: 'studio' })
      await expect(service.salvar({})).resolves.toBeDefined()
    })
  })
})
