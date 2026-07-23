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

vi.mock('../../mensalidades-automaticas/mensalidades-automaticas.service', () => ({
  mensalidadesAutomaticasService: { gerarProximaAposPagamento: vi.fn().mockResolvedValue(undefined) },
}))

describe('FinanceiroService', () => {
  let service: FinanceiroService
  let mockRepo: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockRepo = {
      findMensalidadeById: vi.fn(),
      findMensalidades: vi.fn(),
      createMensalidade: vi.fn(),
      updateMensalidadeStatus: vi.fn(),
      findPagamentoById: vi.fn(),
      findPagamentos: vi.fn(),
      createPagamento: vi.fn(),
      baixarComPagamentoAutomatico: vi.fn(),
    }
    service = new FinanceiroService(mockRepo)
  })

  describe('registrarPagamento', () => {
    const MENS_ID = '11111111-1111-1111-1111-111111111111'

    it('deve registrar pagamento sem depender de caixa aberto', async () => {
      const { mensalidadesAutomaticasService } =
        await import('../../mensalidades-automaticas/mensalidades-automaticas.service')
      mockRepo.findMensalidadeById.mockResolvedValue({
        id: MENS_ID,
        status: 'PENDENTE',
        alunoId: 'a-1',
        valor: { toNumber: () => 200 },
        desconto: { toNumber: () => 0 },
      })
      mockRepo.createPagamento.mockResolvedValue({ id: 'p-1' })
      mockRepo.updateMensalidadeStatus.mockResolvedValue({ id: MENS_ID, status: 'PAGO' })

      const result = await service.registrarPagamento('usuario-1', {
        mensalidadeId: MENS_ID,
        valor: 200,
        metodo: 'PIX',
      })

      expect(result.id).toBe('p-1')
      // caixaId deve ser nulo quando não informado
      expect(mockRepo.createPagamento).toHaveBeenCalledWith(expect.objectContaining({ caixaId: null }))
      // mensalidade quitada (valor >= total)
      expect(mockRepo.updateMensalidadeStatus).toHaveBeenCalledWith(MENS_ID, 'PAGO')
      // quitação total → já dispara a geração da próxima mensalidade
      expect(mensalidadesAutomaticasService.gerarProximaAposPagamento).toHaveBeenCalledWith(MENS_ID)
    })

    it('não deve gerar a próxima mensalidade quando o pagamento é só parcial', async () => {
      const { mensalidadesAutomaticasService } =
        await import('../../mensalidades-automaticas/mensalidades-automaticas.service')
      mockRepo.findMensalidadeById.mockResolvedValue({
        id: MENS_ID,
        status: 'PENDENTE',
        alunoId: 'a-1',
        valor: { toNumber: () => 200 },
        desconto: { toNumber: () => 0 },
      })
      mockRepo.createPagamento.mockResolvedValue({ id: 'p-1' })
      mockRepo.updateMensalidadeStatus.mockResolvedValue({ id: MENS_ID, status: 'PARCIAL' })

      await service.registrarPagamento('usuario-1', {
        mensalidadeId: MENS_ID,
        valor: 100,
        metodo: 'PIX',
      })

      expect(mockRepo.updateMensalidadeStatus).toHaveBeenCalledWith(MENS_ID, 'PARCIAL')
      expect(mensalidadesAutomaticasService.gerarProximaAposPagamento).not.toHaveBeenCalled()
    })

    it('deve lançar erro se mensalidade não encontrada', async () => {
      mockRepo.findMensalidadeById.mockResolvedValue(null)
      await expect(
        service.registrarPagamento('usuario-1', {
          mensalidadeId: MENS_ID,
          valor: 200,
          metodo: 'PIX',
        }),
      ).rejects.toThrow()
    })

    it('deve lançar erro se mensalidade já paga', async () => {
      mockRepo.findMensalidadeById.mockResolvedValue({
        id: MENS_ID,
        status: 'PAGO',
        alunoId: 'a-1',
        valor: { toNumber: () => 200 },
        desconto: { toNumber: () => 0 },
      })
      await expect(
        service.registrarPagamento('usuario-1', {
          mensalidadeId: MENS_ID,
          valor: 200,
          metodo: 'PIX',
        }),
      ).rejects.toThrow('paga')
    })
  })

  describe('baixarMensalidadePorGateway', () => {
    const MENS_ID = '11111111-1111-1111-1111-111111111111'

    it('baixa a mensalidade e emite pagamento.realizado quando processado', async () => {
      const { eventBus } = await import('../../../events/event-bus')
      mockRepo.findMensalidadeById.mockResolvedValue({ id: MENS_ID, alunoId: 'aluno-1', status: 'PENDENTE' })
      mockRepo.baixarComPagamentoAutomatico.mockResolvedValue({
        processado: true,
        pagamento: { id: 'pag-1' },
      })

      const result = await service.baixarMensalidadePorGateway({
        mensalidadeId: MENS_ID,
        valor: 100,
        referenciaExterna: 'MercadoPago:ORD123',
      })

      expect(result.processado).toBe(true)
      expect(eventBus.emit).toHaveBeenCalledWith(
        'pagamento.realizado',
        expect.objectContaining({ pagamentoId: 'pag-1', alunoId: 'aluno-1', valor: 100 }),
      )
      const { mensalidadesAutomaticasService } =
        await import('../../mensalidades-automaticas/mensalidades-automaticas.service')
      expect(mensalidadesAutomaticasService.gerarProximaAposPagamento).toHaveBeenCalledWith(MENS_ID)
    })

    it('é idempotente: não emite evento nem duplica quando já processado antes', async () => {
      const { eventBus } = await import('../../../events/event-bus')
      const { mensalidadesAutomaticasService } =
        await import('../../mensalidades-automaticas/mensalidades-automaticas.service')
      mockRepo.findMensalidadeById.mockResolvedValue({ id: MENS_ID, alunoId: 'aluno-1', status: 'PAGO' })
      mockRepo.baixarComPagamentoAutomatico.mockResolvedValue({ processado: false, pagamento: null })

      const result = await service.baixarMensalidadePorGateway({
        mensalidadeId: MENS_ID,
        valor: 100,
        referenciaExterna: 'MercadoPago:ORD123',
      })

      expect(result.processado).toBe(false)
      expect(eventBus.emit).not.toHaveBeenCalled()
      expect(mensalidadesAutomaticasService.gerarProximaAposPagamento).not.toHaveBeenCalled()
    })

    it('lança erro se a mensalidade não existe', async () => {
      mockRepo.findMensalidadeById.mockResolvedValue(null)

      await expect(
        service.baixarMensalidadePorGateway({ mensalidadeId: MENS_ID, valor: 100, referenciaExterna: 'ref' }),
      ).rejects.toThrow()
      expect(mockRepo.baixarComPagamentoAutomatico).not.toHaveBeenCalled()
    })
  })
})
