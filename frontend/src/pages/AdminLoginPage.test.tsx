import { describe, it, expect, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { renderWithProviders } from '@/test/test-utils'
import { server } from '@/test/server'
import { AdminLoginPage } from './AdminLoginPage'

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}))

import { toast } from 'sonner'

describe('AdminLoginPage', () => {
  it('faz login com credenciais válidas e mostra a tela de sucesso', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AdminLoginPage />, { initialEntries: ['/admin/login'] })

    await user.type(screen.getByLabelText('E-mail'), 'admin@pilates.local')
    await user.type(screen.getByLabelText('Senha'), 'admin123')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    await waitFor(() => {
      expect(screen.getByText('Bem-vindo!')).toBeInTheDocument()
    })
  })

  it('mostra erro de API quando as credenciais são inválidas', async () => {
    server.use(
      http.post('/api/v1/auth/login', () =>
        HttpResponse.json(
          { success: false, message: 'Email ou senha incorretos', code: 'INVALID_CREDENTIALS' },
          { status: 401 },
        ),
      ),
    )

    const user = userEvent.setup()
    renderWithProviders(<AdminLoginPage />, { initialEntries: ['/admin/login'] })

    await user.type(screen.getByLabelText('E-mail'), 'admin@pilates.local')
    await user.type(screen.getByLabelText('Senha'), 'senhaErrada')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('E-mail ou senha incorretos.')
    })
    // Não deve mostrar a tela de sucesso
    expect(screen.queryByText('Bem-vindo!')).not.toBeInTheDocument()
  })

  it('exibe erros de validação ao submeter o formulário vazio', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AdminLoginPage />, { initialEntries: ['/admin/login'] })

    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    await waitFor(() => {
      expect(screen.getByText('E-mail inválido')).toBeInTheDocument()
    })
    expect(screen.getByText('Senha deve ter ao menos 6 caracteres')).toBeInTheDocument()
  })
})
