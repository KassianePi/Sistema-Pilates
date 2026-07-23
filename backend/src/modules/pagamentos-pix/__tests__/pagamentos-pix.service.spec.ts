import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PagamentosPixService, mapStatusGateway } from '../pagamentos-pix.service'
import { AppError } from '../../../shared/errors'
import type { PaymentGatewayPix } from '../gateway/payment-gateway-pix.interface'

vi.mock('../../../database/prisma.client', () => ({
  prisma: {
    mensalidade: { findUnique: vi.fn() },
  },
}))

vi.mock('../../financeiro/financeiro.service', () => ({
  financeiroService: { baixarMensalidadePorGateway: vi.fn().mockResolvedValue({ processado: true }) },
}))

const ALUNO_ID = '11111111-1111-1111-1111-111111111111'
const OUTRO_ALUNO_ID = '99999999-9999-9999-9999-999999999999'
const MENSALIDADE_ID = '22222222-2222-2222-2222-222222222222'

function mensalidadeFake(
  overrides: Partial<{ status: string; valor: number; desconto: number; dataVencimento: Date }> = {},
) {
  return {
    id: MENSALIDADE_ID,
    alunoId: ALUNO_ID,
    status: 'PENDENTE',
    valor: overrides.valor ?? 100,
    desconto: overrides.desconto ?? 0,
    // Por padrão vence hoje — dentro da janela de cobrança em qualquer config.
    dataVencimento: overrides.dataVencimento ?? new Date(),
    aluno: { usuario: { email: 'aluno@example.com' } },
    ...overrides,
  }
}

describe('PagamentosPixService', () => {
  let service: PagamentosPixService
  let mockRepo: any
  let mockGateway: PaymentGatewayPix & { criarCobranca: any; buscarPagamento: any; validarAssinaturaWebhook: any }
  let mockConfiguracaoRepo: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockRepo = {
      buscarPendentePorMensalidade: vi.fn(),
      criarCobranca: vi.fn(),
      atualizarAposCriacao: vi.fn(),
      atualizarStatus: vi.fn(),
      buscarUltimaPorMensalidade: vi.fn(),
      buscarPendentesExpiradas: vi.fn(),
      existeEventoProcessado: vi.fn().mockResolvedValue(false),
      registrarEventoWebhook: vi.fn().mockResolvedValue({}),
      marcarEventoProcessado: vi.fn().mockResolvedValue(undefined),
      buscarPorExternalPaymentId: vi.fn(),
    }
    mockGateway = {
      criarCobranca: vi.fn(),
      buscarPagamento: vi.fn(),
      validarAssinaturaWebhook: vi.fn(),
    }
    mockConfiguracaoRepo = { find: vi.fn().mockResolvedValue({ diasAntesGeracao: 5 }) }
    service = new PagamentosPixService(mockRepo, mockGateway, mockConfiguracaoRepo)
  })

  describe('mapStatusGateway', () => {
    it('mapeia approved/processed para APROVADO', () => {
      expect(mapStatusGateway('approved')).toBe('APROVADO')
      expect(mapStatusGateway('processed')).toBe('APROVADO')
    })
    it('mapeia rejected/cancelled para REJEITADO', () => {
      expect(mapStatusGateway('rejected')).toBe('REJEITADO')
      expect(mapStatusGateway('cancelled')).toBe('REJEITADO')
    })
    it('mapeia qualquer outro status para PENDENTE', () => {
      expect(mapStatusGateway('action_required')).toBe('PENDENTE')
      expect(mapStatusGateway('created')).toBe('PENDENTE')
    })
  })

  describe('solicitarCobranca', () => {
    it('cria cobrança nova quando não há nenhuma pendente', async () => {
      const { prisma } = await import('../../../database/prisma.client')
      vi.mocked(prisma.mensalidade.findUnique).mockResolvedValue(mensalidadeFake() as any)
      mockRepo.buscarPendentePorMensalidade.mockResolvedValue(null)
      mockRepo.criarCobranca.mockResolvedValue({ id: 'cobranca-1' })
      mockGateway.criarCobranca.mockResolvedValue({
        externalPaymentId: 'ORD123',
        status: 'action_required',
        statusDetail: 'waiting_transfer',
        qrCode: 'copia-e-cola',
        qrCodeBase64: 'base64img',
        ticketUrl: 'https://ticket',
        dataExpiracao: new Date('2026-07-22T00:00:00.000Z'),
      })
      mockRepo.atualizarAposCriacao.mockResolvedValue({ id: 'cobranca-1', status: 'PENDENTE' })

      const result = await service.solicitarCobranca(ALUNO_ID, MENSALIDADE_ID)

      expect(mockGateway.criarCobranca).toHaveBeenCalledWith(
        expect.objectContaining({ externalReference: MENSALIDADE_ID, valor: 100, payerEmail: 'aluno@example.com' }),
      )
      expect(mockRepo.atualizarAposCriacao).toHaveBeenCalledWith(
        'cobranca-1',
        expect.objectContaining({ externalPaymentId: 'ORD123', status: 'PENDENTE' }),
      )
      expect(result.id).toBe('cobranca-1')
    })

    it('reaproveita cobrança PENDENTE existente sem chamar o gateway', async () => {
      const { prisma } = await import('../../../database/prisma.client')
      vi.mocked(prisma.mensalidade.findUnique).mockResolvedValue(mensalidadeFake() as any)
      mockRepo.buscarPendentePorMensalidade.mockResolvedValue({ id: 'cobranca-existente', status: 'PENDENTE' })

      const result = await service.solicitarCobranca(ALUNO_ID, MENSALIDADE_ID)

      expect(mockGateway.criarCobranca).not.toHaveBeenCalled()
      expect(mockRepo.criarCobranca).not.toHaveBeenCalled()
      expect(result.id).toBe('cobranca-existente')
    })

    it('calcula o valor sempre a partir da mensalidade (valor - desconto), nunca do client', async () => {
      const { prisma } = await import('../../../database/prisma.client')
      vi.mocked(prisma.mensalidade.findUnique).mockResolvedValue(mensalidadeFake({ valor: 150, desconto: 20 }) as any)
      mockRepo.buscarPendentePorMensalidade.mockResolvedValue(null)
      mockRepo.criarCobranca.mockResolvedValue({ id: 'cobranca-1' })
      mockGateway.criarCobranca.mockResolvedValue({
        externalPaymentId: 'ORD123',
        status: 'created',
        statusDetail: null,
        qrCode: null,
        qrCodeBase64: null,
        ticketUrl: null,
        dataExpiracao: null,
      })
      mockRepo.atualizarAposCriacao.mockResolvedValue({ id: 'cobranca-1' })

      await service.solicitarCobranca(ALUNO_ID, MENSALIDADE_ID)

      expect(mockGateway.criarCobranca).toHaveBeenCalledWith(expect.objectContaining({ valor: 130 }))
    })

    it('rejeita se a mensalidade não existe', async () => {
      const { prisma } = await import('../../../database/prisma.client')
      vi.mocked(prisma.mensalidade.findUnique).mockResolvedValue(null)

      await expect(service.solicitarCobranca(ALUNO_ID, MENSALIDADE_ID)).rejects.toThrow(AppError)
      expect(mockGateway.criarCobranca).not.toHaveBeenCalled()
    })

    it('rejeita se a mensalidade não pertence ao aluno', async () => {
      const { prisma } = await import('../../../database/prisma.client')
      vi.mocked(prisma.mensalidade.findUnique).mockResolvedValue(mensalidadeFake() as any)

      await expect(service.solicitarCobranca(OUTRO_ALUNO_ID, MENSALIDADE_ID)).rejects.toThrow(AppError)
      expect(mockGateway.criarCobranca).not.toHaveBeenCalled()
    })

    it('rejeita se a mensalidade já está paga', async () => {
      const { prisma } = await import('../../../database/prisma.client')
      vi.mocked(prisma.mensalidade.findUnique).mockResolvedValue(mensalidadeFake({ status: 'PAGO' }) as any)

      await expect(service.solicitarCobranca(ALUNO_ID, MENSALIDADE_ID)).rejects.toThrow(AppError)
      expect(mockGateway.criarCobranca).not.toHaveBeenCalled()
    })

    it('marca a cobrança local como REJEITADO se o gateway falhar', async () => {
      const { prisma } = await import('../../../database/prisma.client')
      vi.mocked(prisma.mensalidade.findUnique).mockResolvedValue(mensalidadeFake() as any)
      mockRepo.buscarPendentePorMensalidade.mockResolvedValue(null)
      mockRepo.criarCobranca.mockResolvedValue({ id: 'cobranca-1' })
      mockGateway.criarCobranca.mockRejectedValue(AppError.internal('Falha no gateway'))
      mockRepo.atualizarStatus.mockResolvedValue({ id: 'cobranca-1', status: 'REJEITADO' })

      await expect(service.solicitarCobranca(ALUNO_ID, MENSALIDADE_ID)).rejects.toThrow(AppError)
      expect(mockRepo.atualizarStatus).toHaveBeenCalledWith(
        'cobranca-1',
        expect.objectContaining({ status: 'REJEITADO' }),
      )
    })

    it('rejeita gerar QR Code quando o vencimento ainda está longe (fora da janela de dias)', async () => {
      const { prisma } = await import('../../../database/prisma.client')
      const daquiA30Dias = new Date()
      daquiA30Dias.setDate(daquiA30Dias.getDate() + 30)
      vi.mocked(prisma.mensalidade.findUnique).mockResolvedValue(
        mensalidadeFake({ dataVencimento: daquiA30Dias }) as any,
      )

      await expect(service.solicitarCobranca(ALUNO_ID, MENSALIDADE_ID)).rejects.toThrow(AppError)
      expect(mockGateway.criarCobranca).not.toHaveBeenCalled()
      expect(mockRepo.criarCobranca).not.toHaveBeenCalled()
    })

    it('permite gerar QR Code quando já está dentro da janela de dias antes do vencimento', async () => {
      const { prisma } = await import('../../../database/prisma.client')
      mockConfiguracaoRepo.find.mockResolvedValue({ diasAntesGeracao: 5 })
      const daquiA3Dias = new Date()
      daquiA3Dias.setDate(daquiA3Dias.getDate() + 3)
      vi.mocked(prisma.mensalidade.findUnique).mockResolvedValue(
        mensalidadeFake({ dataVencimento: daquiA3Dias }) as any,
      )
      mockRepo.buscarPendentePorMensalidade.mockResolvedValue(null)
      mockRepo.criarCobranca.mockResolvedValue({ id: 'cobranca-1' })
      mockGateway.criarCobranca.mockResolvedValue({
        externalPaymentId: 'ORD123',
        status: 'created',
        statusDetail: null,
        qrCode: null,
        qrCodeBase64: null,
        ticketUrl: null,
        dataExpiracao: null,
      })
      mockRepo.atualizarAposCriacao.mockResolvedValue({ id: 'cobranca-1' })

      await service.solicitarCobranca(ALUNO_ID, MENSALIDADE_ID)

      expect(mockGateway.criarCobranca).toHaveBeenCalled()
    })
  })

  describe('consultarCobranca', () => {
    it('retorna a última cobrança da mensalidade — leitura pura, sem chamar o gateway', async () => {
      const { prisma } = await import('../../../database/prisma.client')
      vi.mocked(prisma.mensalidade.findUnique).mockResolvedValue(mensalidadeFake() as any)
      mockRepo.buscarUltimaPorMensalidade.mockResolvedValue({ id: 'cobranca-1', status: 'APROVADO' })

      const result = await service.consultarCobranca(ALUNO_ID, MENSALIDADE_ID)

      expect(result?.status).toBe('APROVADO')
      expect(mockGateway.buscarPagamento).not.toHaveBeenCalled()
      expect(mockRepo.atualizarStatus).not.toHaveBeenCalled()
    })

    it('nunca reconcilia com o gateway, mesmo com uma cobrança PENDENTE já expirada', async () => {
      const { prisma } = await import('../../../database/prisma.client')
      vi.mocked(prisma.mensalidade.findUnique).mockResolvedValue(mensalidadeFake() as any)
      mockRepo.buscarUltimaPorMensalidade.mockResolvedValue({
        id: 'cobranca-1',
        status: 'PENDENTE',
        externalPaymentId: 'ORD123',
        dataExpiracao: new Date(Date.now() - 60_000),
      })

      const result = await service.consultarCobranca(ALUNO_ID, MENSALIDADE_ID)

      expect(result?.status).toBe('PENDENTE')
      expect(mockGateway.buscarPagamento).not.toHaveBeenCalled()
    })

    it('rejeita se a mensalidade não pertence ao aluno', async () => {
      const { prisma } = await import('../../../database/prisma.client')
      vi.mocked(prisma.mensalidade.findUnique).mockResolvedValue(mensalidadeFake() as any)

      await expect(service.consultarCobranca(OUTRO_ALUNO_ID, MENSALIDADE_ID)).rejects.toThrow(AppError)
    })
  })

  describe('sincronizarCobranca', () => {
    it('rejeita se a mensalidade não pertence ao aluno', async () => {
      const { prisma } = await import('../../../database/prisma.client')
      vi.mocked(prisma.mensalidade.findUnique).mockResolvedValue(mensalidadeFake() as any)

      await expect(service.sincronizarCobranca(OUTRO_ALUNO_ID, MENSALIDADE_ID)).rejects.toThrow(AppError)
      expect(mockGateway.buscarPagamento).not.toHaveBeenCalled()
    })

    it('reconcilia mesmo quando a cobrança PENDENTE ainda não expirou (cobre "fechei e voltei antes da expiração")', async () => {
      const { prisma } = await import('../../../database/prisma.client')
      vi.mocked(prisma.mensalidade.findUnique).mockResolvedValue(mensalidadeFake() as any)
      mockRepo.buscarUltimaPorMensalidade.mockResolvedValue({
        id: 'cobranca-1',
        status: 'PENDENTE',
        externalPaymentId: 'ORD123',
        valor: 100,
        dataExpiracao: new Date(Date.now() + 20 * 60_000),
      })
      mockGateway.buscarPagamento.mockResolvedValue({
        externalPaymentId: 'ORD123',
        status: 'action_required',
        statusDetail: 'waiting_transfer',
        valor: 100,
        externalReference: MENSALIDADE_ID,
        dataAprovacao: null,
      })
      mockRepo.atualizarStatus.mockResolvedValue({ id: 'cobranca-1', status: 'PENDENTE' })

      const result = await service.sincronizarCobranca(ALUNO_ID, MENSALIDADE_ID)

      expect(mockGateway.buscarPagamento).toHaveBeenCalledWith('ORD123')
      expect(mockRepo.atualizarStatus).toHaveBeenCalledWith(
        'cobranca-1',
        expect.objectContaining({ status: 'PENDENTE' }),
      )
      expect(result?.status).toBe('PENDENTE')
    })

    it('marca EXPIRADO quando a cobrança PENDENTE já passou da validade e o gateway confirma que não foi paga', async () => {
      const { prisma } = await import('../../../database/prisma.client')
      vi.mocked(prisma.mensalidade.findUnique).mockResolvedValue(mensalidadeFake() as any)
      mockRepo.buscarUltimaPorMensalidade.mockResolvedValue({
        id: 'cobranca-1',
        status: 'PENDENTE',
        externalPaymentId: 'ORD123',
        valor: 100,
        dataExpiracao: new Date(Date.now() - 60_000),
      })
      mockGateway.buscarPagamento.mockResolvedValue({
        externalPaymentId: 'ORD123',
        status: 'action_required',
        statusDetail: 'waiting_transfer',
        valor: 100,
        externalReference: MENSALIDADE_ID,
        dataAprovacao: null,
      })
      mockRepo.atualizarStatus.mockResolvedValue({ id: 'cobranca-1', status: 'EXPIRADO' })

      const result = await service.sincronizarCobranca(ALUNO_ID, MENSALIDADE_ID)

      expect(mockRepo.atualizarStatus).toHaveBeenCalledWith(
        'cobranca-1',
        expect.objectContaining({ status: 'EXPIRADO' }),
      )
      expect(result?.status).toBe('EXPIRADO')
    })

    it('marca REJEITADO quando o gateway confirma recusa', async () => {
      const { prisma } = await import('../../../database/prisma.client')
      vi.mocked(prisma.mensalidade.findUnique).mockResolvedValue(mensalidadeFake() as any)
      mockRepo.buscarUltimaPorMensalidade.mockResolvedValue({
        id: 'cobranca-1',
        status: 'PENDENTE',
        externalPaymentId: 'ORD123',
        valor: 100,
        dataExpiracao: new Date(Date.now() + 20 * 60_000),
      })
      mockGateway.buscarPagamento.mockResolvedValue({
        externalPaymentId: 'ORD123',
        status: 'rejected',
        statusDetail: 'cc_rejected',
        valor: 100,
        externalReference: MENSALIDADE_ID,
        dataAprovacao: null,
      })
      mockRepo.atualizarStatus.mockResolvedValue({ id: 'cobranca-1', status: 'REJEITADO' })

      const result = await service.sincronizarCobranca(ALUNO_ID, MENSALIDADE_ID)

      expect(mockRepo.atualizarStatus).toHaveBeenCalledWith(
        'cobranca-1',
        expect.objectContaining({ status: 'REJEITADO' }),
      )
      expect(result?.status).toBe('REJEITADO')
    })

    it('baixa a mensalidade em vez de expirar se o gateway revelar que foi aprovada no limite', async () => {
      const { prisma } = await import('../../../database/prisma.client')
      const { financeiroService } = await import('../../financeiro/financeiro.service')
      vi.mocked(prisma.mensalidade.findUnique).mockResolvedValue(mensalidadeFake() as any)
      mockRepo.buscarUltimaPorMensalidade.mockResolvedValue({
        id: 'cobranca-1',
        status: 'PENDENTE',
        externalPaymentId: 'ORD123',
        mensalidadeId: MENSALIDADE_ID,
        valor: 100,
        dataExpiracao: new Date(Date.now() - 60_000),
      })
      mockGateway.buscarPagamento.mockResolvedValue({
        externalPaymentId: 'ORD123',
        status: 'approved',
        statusDetail: 'accredited',
        valor: 100,
        externalReference: MENSALIDADE_ID,
        dataAprovacao: new Date(),
      })
      mockRepo.atualizarStatus.mockResolvedValue({ id: 'cobranca-1', status: 'APROVADO' })

      const result = await service.sincronizarCobranca(ALUNO_ID, MENSALIDADE_ID)

      expect(financeiroService.baixarMensalidadePorGateway).toHaveBeenCalledWith(
        expect.objectContaining({ mensalidadeId: MENSALIDADE_ID }),
      )
      expect(result?.status).toBe('APROVADO')
    })

    it('não chama o gateway se a cobrança não está PENDENTE', async () => {
      const { prisma } = await import('../../../database/prisma.client')
      vi.mocked(prisma.mensalidade.findUnique).mockResolvedValue(mensalidadeFake() as any)
      mockRepo.buscarUltimaPorMensalidade.mockResolvedValue({ id: 'cobranca-1', status: 'APROVADO' })

      const result = await service.sincronizarCobranca(ALUNO_ID, MENSALIDADE_ID)

      expect(mockGateway.buscarPagamento).not.toHaveBeenCalled()
      expect(result?.status).toBe('APROVADO')
    })
  })

  describe('processarCobrancasExpiradas', () => {
    it('resolve cada cobrança expirada e continua mesmo se uma delas falhar', async () => {
      mockRepo.buscarPendentesExpiradas.mockResolvedValue([
        {
          id: 'cobranca-1',
          status: 'PENDENTE',
          externalPaymentId: 'ORD1',
          dataExpiracao: new Date(Date.now() - 60_000),
        },
        {
          id: 'cobranca-2',
          status: 'PENDENTE',
          externalPaymentId: 'ORD2',
          dataExpiracao: new Date(Date.now() - 60_000),
        },
      ])
      mockGateway.buscarPagamento.mockRejectedValueOnce(new Error('falha ao consultar ORD1')).mockResolvedValueOnce({
        externalPaymentId: 'ORD2',
        status: 'action_required',
        statusDetail: 'waiting_transfer',
        valor: 50,
        externalReference: 'x',
        dataAprovacao: null,
      })
      mockRepo.atualizarStatus.mockResolvedValue({ id: 'cobranca-2', status: 'EXPIRADO' })

      await service.processarCobrancasExpiradas()

      expect(mockRepo.atualizarStatus).toHaveBeenCalledWith(
        'cobranca-2',
        expect.objectContaining({ status: 'EXPIRADO' }),
      )
      expect(mockRepo.atualizarStatus).toHaveBeenCalledTimes(1)
    })

    it('não faz nada quando não há cobranças expiradas', async () => {
      mockRepo.buscarPendentesExpiradas.mockResolvedValue([])

      await service.processarCobrancasExpiradas()

      expect(mockGateway.buscarPagamento).not.toHaveBeenCalled()
      expect(mockRepo.atualizarStatus).not.toHaveBeenCalled()
    })
  })

  describe('processarWebhook', () => {
    const webhookInput = {
      headers: { 'x-signature': 'ts=1,v1=abc', 'x-request-id': 'req-1' },
      query: { 'data.id': 'ORD123', type: 'order' },
      body: { id: 'evento-1', type: 'order', data: { id: 'ORD123' } },
    }

    it('rejeita sem processar nada se a assinatura for inválida', async () => {
      mockGateway.validarAssinaturaWebhook.mockImplementation(() => {
        throw new Error('assinatura inválida')
      })

      await expect(service.processarWebhook(webhookInput)).rejects.toThrow('assinatura inválida')
      expect(mockRepo.existeEventoProcessado).not.toHaveBeenCalled()
      expect(mockGateway.buscarPagamento).not.toHaveBeenCalled()
    })

    it('ignora evento já processado (idempotência de ingestão)', async () => {
      mockRepo.existeEventoProcessado.mockResolvedValue(true)

      await service.processarWebhook(webhookInput)

      expect(mockRepo.registrarEventoWebhook).not.toHaveBeenCalled()
      expect(mockGateway.buscarPagamento).not.toHaveBeenCalled()
    })

    it('ignora tópicos que não sejam "order"', async () => {
      await service.processarWebhook({ ...webhookInput, body: { id: 'evento-2', type: 'payment_method', data: {} } })

      expect(mockGateway.buscarPagamento).not.toHaveBeenCalled()
      expect(mockRepo.marcarEventoProcessado).toHaveBeenCalledWith('evento-2', true)
    })

    it('busca o pagamento canônico e baixa a mensalidade quando aprovado', async () => {
      const { financeiroService } = await import('../../financeiro/financeiro.service')
      mockGateway.buscarPagamento.mockResolvedValue({
        externalPaymentId: 'ORD123',
        status: 'approved',
        statusDetail: 'accredited',
        valor: 100,
        externalReference: MENSALIDADE_ID,
        dataAprovacao: new Date('2026-07-21T00:00:00.000Z'),
      })
      mockRepo.buscarPorExternalPaymentId.mockResolvedValue({
        id: 'cobranca-1',
        mensalidadeId: MENSALIDADE_ID,
        valor: 100,
      })
      mockRepo.atualizarStatus.mockResolvedValue({ id: 'cobranca-1', status: 'APROVADO' })

      await service.processarWebhook(webhookInput)

      expect(mockRepo.atualizarStatus).toHaveBeenCalledWith(
        'cobranca-1',
        expect.objectContaining({ status: 'APROVADO' }),
      )
      expect(financeiroService.baixarMensalidadePorGateway).toHaveBeenCalledWith(
        expect.objectContaining({ mensalidadeId: MENSALIDADE_ID, valor: 100 }),
      )
      expect(mockRepo.marcarEventoProcessado).toHaveBeenCalledWith('evento-1', true)
    })

    it('não baixa a mensalidade quando o pagamento ainda está pendente', async () => {
      const { financeiroService } = await import('../../financeiro/financeiro.service')
      mockGateway.buscarPagamento.mockResolvedValue({
        externalPaymentId: 'ORD123',
        status: 'action_required',
        statusDetail: 'waiting_transfer',
        valor: 100,
        externalReference: MENSALIDADE_ID,
        dataAprovacao: null,
      })
      mockRepo.buscarPorExternalPaymentId.mockResolvedValue({
        id: 'cobranca-1',
        mensalidadeId: MENSALIDADE_ID,
        valor: 100,
      })
      mockRepo.atualizarStatus.mockResolvedValue({ id: 'cobranca-1', status: 'PENDENTE' })

      await service.processarWebhook(webhookInput)

      expect(financeiroService.baixarMensalidadePorGateway).not.toHaveBeenCalled()
    })

    it('marca o evento como processado sem erro quando nenhuma cobrança corresponde', async () => {
      mockGateway.buscarPagamento.mockResolvedValue({
        externalPaymentId: 'ORD999',
        status: 'approved',
        statusDetail: 'accredited',
        valor: 100,
        externalReference: null,
        dataAprovacao: null,
      })
      mockRepo.buscarPorExternalPaymentId.mockResolvedValue(null)

      await service.processarWebhook(webhookInput)

      expect(mockRepo.atualizarStatus).not.toHaveBeenCalled()
      expect(mockRepo.marcarEventoProcessado).toHaveBeenCalledWith('evento-1', true)
    })
  })
})
