import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LoadingState } from './LoadingState'

describe('LoadingState', () => {
  it('exibe a mensagem padrão quando nenhum label é informado', () => {
    render(<LoadingState />)
    expect(screen.getByText('Carregando...')).toBeInTheDocument()
  })

  it('exibe um label customizado', () => {
    render(<LoadingState label="Carregando alunos..." />)
    expect(screen.getByText('Carregando alunos...')).toBeInTheDocument()
  })
})
