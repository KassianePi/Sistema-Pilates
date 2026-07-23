import { describe, it, expect } from 'vitest'
import { mapearEstadoPagamentoPix } from './mapearEstadoPagamentoPix'
import type { PagamentoPix } from '@/services/pagamentosPix.service'
import type { StatusCobrancaPix } from './tipos'

function pagamentoFake(status: StatusCobrancaPix): PagamentoPix {
  return {
    id: 'cobranca-1',
    mensalidadeId: 'mensalidade-1',
    status,
    statusDetail: null,
    qrCode: 'copia-e-cola',
    qrCodeImagem: 'base64',
    ticketUrl: null,
    expiraEm: null,
    aprovadoEm: null,
    valor: 100,
  }
}

const baseParams = { isLoading: false, isGenerating: false, isError: false, countdownExpirado: false }

describe('mapearEstadoPagamentoPix', () => {
  it('GENERATING tem prioridade sobre qualquer outro estado', () => {
    expect(mapearEstadoPagamentoPix({ ...baseParams, pagamento: null, isGenerating: true, isLoading: true })).toBe(
      'GENERATING',
    )
  })

  it('LOADING quando a query inicial ainda não resolveu', () => {
    expect(mapearEstadoPagamentoPix({ ...baseParams, pagamento: null, isLoading: true })).toBe('LOADING')
  })

  it('ERROR quando a query falhou', () => {
    expect(mapearEstadoPagamentoPix({ ...baseParams, pagamento: null, isError: true })).toBe('ERROR')
  })

  it('NO_CHARGE quando não existe cobrança', () => {
    expect(mapearEstadoPagamentoPix({ ...baseParams, pagamento: null })).toBe('NO_CHARGE')
  })

  it('mapeia cada status de cobrança para o estado de UI correspondente', () => {
    expect(mapearEstadoPagamentoPix({ ...baseParams, pagamento: pagamentoFake('APROVADO') })).toBe('APPROVED')
    expect(mapearEstadoPagamentoPix({ ...baseParams, pagamento: pagamentoFake('REJEITADO') })).toBe('REJECTED')
    expect(mapearEstadoPagamentoPix({ ...baseParams, pagamento: pagamentoFake('CANCELADO') })).toBe('CANCELED')
    expect(mapearEstadoPagamentoPix({ ...baseParams, pagamento: pagamentoFake('EXPIRADO') })).toBe('EXPIRED')
  })

  it('PENDENTE vira PENDING enquanto o countdown local não zerou', () => {
    expect(
      mapearEstadoPagamentoPix({ ...baseParams, pagamento: pagamentoFake('PENDENTE'), countdownExpirado: false }),
    ).toBe('PENDING')
  })

  it('PENDENTE vira EXPIRED de forma otimista quando o countdown local zera (evita mostrar QR morto)', () => {
    expect(
      mapearEstadoPagamentoPix({ ...baseParams, pagamento: pagamentoFake('PENDENTE'), countdownExpirado: true }),
    ).toBe('EXPIRED')
  })
})
