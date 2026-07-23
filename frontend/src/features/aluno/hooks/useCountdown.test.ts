import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCountdown } from './useCountdown'

describe('useCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('não marca como expirado no primeiro render, mesmo antes da primeira leitura assíncrona', () => {
    const expiraEm = new Date(Date.now() + 20 * 60 * 1000)
    const { result } = renderHook(() => useCountdown(expiraEm))

    // Antes do setTimeout(0) disparar: não pode reportar "expirado" com um
    // prazo de 20 minutos no futuro (bug corrigido: estado inicial não deve
    // vazar um `expirado=true` só porque a leitura ainda não chegou).
    expect(result.current.expirado).toBe(false)
  })

  it('calcula os segundos restantes após a primeira leitura', () => {
    const expiraEm = new Date(Date.now() + 90 * 1000)
    const { result } = renderHook(() => useCountdown(expiraEm))

    act(() => {
      vi.advanceTimersByTime(0)
    })

    expect(result.current.expirado).toBe(false)
    expect(result.current.segundosRestantes).toBeGreaterThan(85)
    expect(result.current.formatado).toBe('01:30')
  })

  it('marca como expirado quando o tempo se esgota', () => {
    const expiraEm = new Date(Date.now() + 2000)
    const { result } = renderHook(() => useCountdown(expiraEm))

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(result.current.expirado).toBe(true)
    expect(result.current.segundosRestantes).toBe(0)
  })

  it('não vaza o "expirado" de um alvo anterior ao trocar para uma nova data (gerar novo PIX)', () => {
    let expiraEm = new Date(Date.now() + 1000)
    const { result, rerender } = renderHook(({ alvo }: { alvo: Date | null }) => useCountdown(alvo), {
      initialProps: { alvo: expiraEm },
    })

    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(result.current.expirado).toBe(true)

    // Aluno clicou "Gerar novo PIX" — novo prazo de 20 minutos no futuro.
    expiraEm = new Date(Date.now() + 20 * 60 * 1000)
    rerender({ alvo: expiraEm })

    // Antes da primeira leitura do novo alvo chegar, não deve continuar
    // reportando o "expirado" do prazo anterior.
    expect(result.current.expirado).toBe(false)

    act(() => {
      vi.advanceTimersByTime(0)
    })
    expect(result.current.expirado).toBe(false)
    expect(result.current.segundosRestantes).toBeGreaterThan(1000)
  })

  it('retorna não-expirado e 00:00 quando não há data-alvo', () => {
    const { result } = renderHook(() => useCountdown(null))

    expect(result.current.expirado).toBe(false)
    expect(result.current.formatado).toBe('00:00')
    expect(result.current.segundosRestantes).toBe(0)
  })
})
