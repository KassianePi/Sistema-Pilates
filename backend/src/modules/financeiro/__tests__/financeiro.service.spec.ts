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

vi.mock('../../auditoria/auditoria.service', () => ({
  registrarLog: vi.fn(),
}))

vi.mock('../../notificacoes/notificacoes.service', () => ({
  notificacoesService: { criar: vi.fn(), notificarAdmins: vi.fn() },
}))

describe('FinanceiroService', () => {
  let service: FinanceiroService
  let mockRepo: any

  beforeEach(() => {
    mockRepo = {
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

  describe('registrarPagamento', () => {
    const MENS_ID = '11111111-1111-1111-1111-111111111111'

    it('deve registrar pagamento sem depender de caixa aberto', async () => {
      mockRepo.findMensalidadeById.mockResolvedValue({
        id: MENS_ID, status: 'PENDENTE', alunoId: 'a-1',
        valor: { toNumber: () => 200 }, desconto: { toNumber: () => 0 },
      })
      mockRepo.createPagamento.mockResolvedValue({ id: 'p-1' })
      mockRepo.updateMensalidadeStatus.mockResolvedValue({ id: MENS_ID, status: 'PAGO' })

      const result = await service.registrarPagamento('usuario-1', {
        mensalidadeId: MENS_ID, valor: 200, metodo: 'PIX',
      })

      expect(result.id).toBe('p-1')
      // caixaId deve ser nulo quando não informado
      expect(mockRepo.createPagamento).toHaveBeenCalledWith(expect.objectContaining({ caixaId: null }))
      // mensalidade quitada (valor >= total)
      expect(mockRepo.updateMensalidadeStatus).toHaveBeenCalledWith(MENS_ID, 'PAGO')
    })

    it('deve lançar erro se mensalidade não encontrada', async () => {
      mockRepo.findMensalidadeById.mockResolvedValue(null)
      await expect(service.registrarPagamento('usuario-1', {
        mensalidadeId: MENS_ID, valor: 200, metodo: 'PIX',
      })).rejects.toThrow()
    })

    it('deve lançar erro se mensalidade já paga', async () => {
      mockRepo.findMensalidadeById.mockResolvedValue({
        id: MENS_ID, status: 'PAGO', alunoId: 'a-1',
        valor: { toNumber: () => 200 }, desconto: { toNumber: () => 0 },
      })
      await expect(service.registrarPagamento('usuario-1', {
        mensalidadeId: MENS_ID, valor: 200, metodo: 'PIX',
      })).rejects.toThrow('paga')
    })
  })
})
