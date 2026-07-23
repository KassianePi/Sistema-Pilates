import type { ReactNode } from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { usePagamentoPix } from './usePagamentoPix'
import { pagamentosPixService } from '@/services/pagamentosPix.service'
import { PIX_POLLING_INTERVAL_MS } from '../constants/pagamentoPix'
import type { PagamentoPix } from '@/services/pagamentosPix.service'

vi.mock('@/services/pagamentosPix.service', () => ({
  pagamentosPixService: {
    consultarCobranca: vi.fn(),
    sincronizarCobranca: vi.fn(),
    gerarCobranca: vi.fn(),
  },
}))

const toastSuccess = vi.fn()
vi.mock('sonner', () => ({ toast: { success: (...args: unknown[]) => toastSuccess(...args), error: vi.fn() } }))

const mockedService = vi.mocked(pagamentosPixService)

function pendenteFake(expiraEmMs: number): PagamentoPix {
  return {
    id: 'cobranca-1',
    mensalidadeId: 'mensalidade-1',
    status: 'PENDENTE',
    statusDetail: null,
    qrCode: 'copia-e-cola',
    qrCodeImagem: 'base64',
    ticketUrl: null,
    expiraEm: new Date(Date.now() + expiraEmMs),
    aprovadoEm: null,
    valor: 100,
  }
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

/**
 * Com fake timers, `waitFor` do Testing Library nunca resolve (ele próprio
 * depende de `setTimeout`, que fica congelado). Em vez disso, avançamos o
 * relógio virtual explicitamente para permitir que as promises mockadas e os
 * efeitos do React assentem antes de cada asserção.
 */
async function flush(ms = 0) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms)
  })
}

describe('usePagamentoPix', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mockedService.consultarCobranca.mockReset()
    mockedService.sincronizarCobranca.mockReset()
    mockedService.gerarCobranca.mockReset()
    toastSuccess.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('não consulta nem sincroniza quando não há mensalidadeId', async () => {
    renderHook(() => usePagamentoPix(null), { wrapper: createWrapper() })
    await flush()

    expect(mockedService.consultarCobranca).not.toHaveBeenCalled()
    expect(mockedService.sincronizarCobranca).not.toHaveBeenCalled()
  })

  it('sincroniza uma vez ao montar, mesmo sem cobrança existente', async () => {
    mockedService.consultarCobranca.mockResolvedValue(null)
    mockedService.sincronizarCobranca.mockResolvedValue(null)

    const { result } = renderHook(() => usePagamentoPix('mensalidade-1'), { wrapper: createWrapper() })
    await flush()

    expect(result.current.estado).toBe('NO_CHARGE')
    expect(mockedService.sincronizarCobranca).toHaveBeenCalledTimes(1)
  })

  it('o polling de rotina nunca chama a sincronização (só o GET puro)', async () => {
    mockedService.consultarCobranca.mockResolvedValue(pendenteFake(20 * 60 * 1000))
    mockedService.sincronizarCobranca.mockResolvedValue(pendenteFake(20 * 60 * 1000))

    const { result } = renderHook(() => usePagamentoPix('mensalidade-1'), { wrapper: createWrapper() })
    await flush()

    expect(result.current.estado).toBe('PENDING')
    expect(mockedService.sincronizarCobranca).toHaveBeenCalledTimes(1)

    const chamadasConsultaAntes = mockedService.consultarCobranca.mock.calls.length

    await flush(PIX_POLLING_INTERVAL_MS * 3)

    expect(mockedService.consultarCobranca.mock.calls.length).toBeGreaterThan(chamadasConsultaAntes)
    // Sincronização continua tendo sido chamada só a única vez do mount.
    expect(mockedService.sincronizarCobranca).toHaveBeenCalledTimes(1)
  })

  it('sincroniza de novo ao voltar de outra aba (visibilitychange)', async () => {
    mockedService.consultarCobranca.mockResolvedValue(pendenteFake(20 * 60 * 1000))
    mockedService.sincronizarCobranca.mockResolvedValue(pendenteFake(20 * 60 * 1000))

    const { result } = renderHook(() => usePagamentoPix('mensalidade-1'), { wrapper: createWrapper() })
    await flush()
    expect(result.current.estado).toBe('PENDING')
    expect(mockedService.sincronizarCobranca).toHaveBeenCalledTimes(1)

    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'))
      await vi.advanceTimersByTimeAsync(0)
    })

    expect(mockedService.sincronizarCobranca).toHaveBeenCalledTimes(2)
  })

  it('sincroniza quando o countdown local zera, e só uma vez', async () => {
    mockedService.consultarCobranca.mockResolvedValue(pendenteFake(2000))
    mockedService.sincronizarCobranca.mockResolvedValue(pendenteFake(2000))

    const { result } = renderHook(() => usePagamentoPix('mensalidade-1'), { wrapper: createWrapper() })
    await flush()
    expect(result.current.estado).toBe('PENDING')
    expect(mockedService.sincronizarCobranca).toHaveBeenCalledTimes(1)

    await flush(3000)
    expect(mockedService.sincronizarCobranca).toHaveBeenCalledTimes(2)

    await flush(3000)
    expect(mockedService.sincronizarCobranca).toHaveBeenCalledTimes(2)
  })

  it('ao detectar aprovação, mostra toast de sucesso uma única vez', async () => {
    mockedService.consultarCobranca.mockResolvedValue(null)
    mockedService.sincronizarCobranca.mockResolvedValue({ ...pendenteFake(0), status: 'APROVADO', expiraEm: null })

    const { result } = renderHook(() => usePagamentoPix('mensalidade-1'), { wrapper: createWrapper() })
    await flush()

    expect(result.current.estado).toBe('APPROVED')
    expect(toastSuccess).toHaveBeenCalledTimes(1)
  })
})
