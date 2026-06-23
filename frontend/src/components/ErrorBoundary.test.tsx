import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ErrorBoundary } from './ErrorBoundary'

function ComponenteComErro(): never {
  throw new Error('Falha proposital para teste')
}

describe('ErrorBoundary', () => {
  it('renderiza os filhos normalmente quando não há erro', () => {
    render(
      <ErrorBoundary>
        <p>Conteúdo normal</p>
      </ErrorBoundary>,
    )

    expect(screen.getByText('Conteúdo normal')).toBeInTheDocument()
  })

  it('exibe o fallback quando um componente filho lança um erro', () => {
    // React loga o erro no console — silenciamos apenas para este teste
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <ErrorBoundary>
        <ComponenteComErro />
      </ErrorBoundary>,
    )

    expect(screen.getByText('Algo deu errado.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Recarregar' })).toBeInTheDocument()

    consoleSpy.mockRestore()
  })
})
