import { describe, it, expect } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/test-utils'
import { AlunoFormModal } from './AlunoFormModal'

describe('AlunoFormModal', () => {
  it('exibe erros de validação ao submeter o formulário de cadastro vazio', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AlunoFormModal open onClose={() => {}} />)

    await user.click(screen.getByRole('button', { name: 'Cadastrar aluno' }))

    await waitFor(() => {
      expect(screen.getByText('Nome deve ter pelo menos 3 caracteres')).toBeInTheDocument()
    })
    expect(screen.getByText('E-mail inválido')).toBeInTheDocument()
    expect(screen.getByText('CPF deve ter 11 dígitos')).toBeInTheDocument()
    expect(screen.getByText('Senha deve ter pelo menos 6 caracteres')).toBeInTheDocument()
  })

  it('não envia a requisição de cadastro enquanto o formulário for inválido', async () => {
    let chamouApi = false
    const { http, HttpResponse } = await import('msw')
    const { server } = await import('@/test/server')
    server.use(
      http.post('/api/v1/alunos', () => {
        chamouApi = true
        return HttpResponse.json({ success: true, data: {} }, { status: 201 })
      }),
    )

    const user = userEvent.setup()
    renderWithProviders(<AlunoFormModal open onClose={() => {}} />)

    // E-mail inválido, demais campos obrigatórios vazios
    await user.type(screen.getByPlaceholderText('email@exemplo.com'), 'nao-e-um-email')
    await user.click(screen.getByRole('button', { name: 'Cadastrar aluno' }))

    await new Promise((resolve) => setTimeout(resolve, 200))
    expect(chamouApi).toBe(false)
  })
})
