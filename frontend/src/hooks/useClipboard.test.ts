import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useClipboard } from './useClipboard'

describe('useClipboard', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('copia usando a Clipboard API quando disponível', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } })

    const { result } = renderHook(() => useClipboard())

    await act(async () => {
      const ok = await result.current.copiar('00020126...')
      expect(ok).toBe(true)
    })

    expect(writeText).toHaveBeenCalledWith('00020126...')
    expect(result.current.copiado).toBe(true)
    expect(result.current.erro).toBe(false)
  })

  it('cai para o fallback de execCommand quando a Clipboard API falha', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('sem permissão'))
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } })
    const execCommand = vi.fn().mockReturnValue(true)
    document.execCommand = execCommand

    const { result } = renderHook(() => useClipboard())

    await act(async () => {
      const ok = await result.current.copiar('texto')
      expect(ok).toBe(true)
    })

    expect(execCommand).toHaveBeenCalledWith('copy')
    expect(result.current.copiado).toBe(true)
    expect(result.current.erro).toBe(false)
  })

  it('reporta erro quando nenhuma das duas estratégias funciona', async () => {
    vi.stubGlobal('navigator', { ...navigator, clipboard: undefined })
    document.execCommand = vi.fn().mockReturnValue(false)

    const { result } = renderHook(() => useClipboard())

    await act(async () => {
      const ok = await result.current.copiar('texto')
      expect(ok).toBe(false)
    })

    expect(result.current.copiado).toBe(false)
    expect(result.current.erro).toBe(true)
  })

  it('reseta "copiado" para false depois do tempo configurado', async () => {
    vi.useFakeTimers()
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } })

    const { result } = renderHook(() => useClipboard(2000))

    await act(async () => {
      await result.current.copiar('texto')
    })
    expect(result.current.copiado).toBe(true)

    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(result.current.copiado).toBe(false)

    vi.useRealTimers()
  })
})
