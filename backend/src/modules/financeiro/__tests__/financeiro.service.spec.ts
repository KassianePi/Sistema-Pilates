import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FinanceiroService } from '../financeiro.service'

vi.mock('../../../database/prisma.client', () => ({
  prisma: {
    aluno: { findUnique: vi.fn().mockResolvedValue({ id: 'aluno-1' }) },
    plano: { findUnique: vi.fn().mockResolvedValue({ id: 'plano-1', nome: 'Mensal' }) },
  },
}))

vi.mock('../../../events/event-bus', () => ({
  eventBus: { emit: vi.fn() },
}))

describe('FinanceiroService', () => {
  let service: FinanceiroService
  let mockRepo: any

  beforeEach(() => {
    mockRepo = {
      findCaixaAtivo: vi.fn(),
      findCaixaById: vi.fn(),
      abrirCaixa: vi.fn(),
      fecharCaixa: vi.fn(),
      findMensalidadeById: vi.fn(),
      findMensalidades: vi.fn(),
      createMensalidade: vi.fn(),
      updateMensalidadeStatus: vi.fn(),
      findPagamentoById: vi.fn(),
      findPagamentos: vi.fn(),
      createPagamento: vi.fn(),
    }
    service = new FinanceiroService(mockRepo)
  })

  describe('abrirCaixa', () => {
    it('deve abrir caixa quando não há caixa aberto', async () => {
      mockRepo.findCaixaAtivo.mockResolvedValue(null)
      const caixaFake = { id: 'c-1', saldoAbertura: '0' }
      mockRepo.abrirCaixa.mockResolvedValue(caixaFake)

      const result = await service.abrirCaixa('usuario-1', { saldoAbertura: 0 })
      expect(result.id).toBe('c-1')
    })

    it('deve lançar erro se já há caixa aberto', async () => {
      mockRepo.findCaixaAtivo.mockResolvedValue({ id: 'c-existente' })
      await expect(service.abrirCaixa('usuario-1', { saldoAbertura: 0 })).rejects.toThrow('aberto')
    })
  })

  describe('fecharCaixa', () => {
    it('deve lançar erro se caixa não existe', async () => {
      mockRepo.findCaixaById.mockResolvedValue(null)
      await expect(service.fecharCaixa('c-1', 'usuario-1', { saldoFechamento: 100 })).rejects.toThrow('Caixa')
    })

    it('deve lançar erro se caixa já fechado', async () => {
      mockRepo.findCaixaById.mockResolvedValue({ id: 'c-1', dataFechamento: new Date() })
      await expect(service.fecharCaixa('c-1', 'usuario-1', { saldoFechamento: 100 })).rejects.toThrow('fechado')
    })
  })

  describe('registrarPagamento', () => {
    it('deve lançar erro se mensalidade já paga', async () => {
      mockRepo.findMensalidadeById.mockResolvedValue({ id: 'm-1', status: 'PAGO', valor: '200', desconto: '0', alunoId: 'a-1' })
      mockRepo.findCaixaById.mockResolvedValue({ id: 'c-1', dataFechamento: null })
      await expect(service.registrarPagamento('usuario-1', {
        mensalidadeId: 'm-1', caixaId: 'c-1', valor: 200, metodo: 'PIX',
      })).rejects.toThrow('paga')
    })
  })
})
