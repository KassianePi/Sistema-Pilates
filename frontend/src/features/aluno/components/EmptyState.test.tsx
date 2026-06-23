import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EmptyState } from './EmptyState'

describe('EmptyState', () => {
  it('exibe a mensagem e o título informados', () => {
    render(<EmptyState title="Nenhum resultado" message="Nenhum aluno encontrado." />)
    expect(screen.getByText('Nenhum resultado')).toBeInTheDocument()
    expect(screen.getByText('Nenhum aluno encontrado.')).toBeInTheDocument()
  })

  it('renderiza a ação customizada quando informada', () => {
    render(<EmptyState message="Vazio" action={<button>Adicionar</button>} />)
    expect(screen.getByRole('button', { name: 'Adicionar' })).toBeInTheDocument()
  })

  it('usa o ícone padrão quando nenhum é informado', () => {
    const { container } = render(<EmptyState message="Vazio" />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('usa o ícone customizado quando informado', () => {
    const CustomIcon = vi.fn(() => <svg data-testid="custom-icon" />)
    render(<EmptyState message="Vazio" icon={CustomIcon} />)
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument()
  })
})
