import { describe, it, expect, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { renderWithProviders } from '@/test/test-utils'
import { server } from '@/test/server'
import { AlunoLoginPage } from './AlunoLoginPage'

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}))

import { toast } from 'sonner'

describe('AlunoLoginPage', () => {
  it('renderiza o campo CPF (não e-mail)', () => {
    renderWithProviders(<AlunoLoginPage />, { initialEntries: ['/aluno/login'] })

    expect(screen.getByLabelText('CPF')).toBeInTheDocument()
    expect(screen.queryByLabelText('E-mail')).not.toBeInTheDocument()
  })

  it('exibe erro de validação para CPF com formato inválido', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AlunoLoginPage />, { initialEntries: ['/aluno/login'] })

    await user.click(screen.getByRole('button', { name: 'Acessar minha conta' }))

    await waitFor(() => {
      expect(screen.getByText('CPF deve ter 11 dígitos')).toBeInTheDocument()
    })
  })

  it('faz login com CPF e senha válidos e navega para o dashboard', async () => {
    let corpoRecebido: any = null
    server.use(
      http.post('/api/v1/auth/aluno/login', async ({ request }) => {
        corpoRecebido = await request.json()
        return HttpResponse.json({
          success: true,
          data: {
            usuarioId: 'aluno-1',
            email: 'aluno@pilates.local',
            nome: 'Aluno Teste',
            funcao: 'ALUNO',
            accessToken: 'fake-access-token',
            refreshToken: 'fake-refresh-token',
            expiresIn: 900,
          },
        })
      }),
    )

    const user = userEvent.setup()
    renderWithProviders(<AlunoLoginPage />, { initialEntries: ['/aluno/login'] })

    await user.type(screen.getByLabelText('CPF'), '11122233344')
    await user.type(screen.getByLabelText('Senha'), 'senha123')
    await user.click(screen.getByRole('button', { name: 'Acessar minha conta' }))

    await waitFor(() => expect(corpoRecebido).not.toBeNull())
    expect(corpoRecebido).toEqual({ cpf: '11122233344', senha: 'senha123' })
  })

  it('mostra erro quando as credenciais estão incorretas', async () => {
    server.use(
      http.post('/api/v1/auth/aluno/login', () =>
        HttpResponse.json(
          { success: false, message: 'CPF ou senha incorretos.', code: 'INVALID_CREDENTIALS' },
          { status: 401 },
        ),
      ),
    )

    const user = userEvent.setup()
    renderWithProviders(<AlunoLoginPage />, { initialEntries: ['/aluno/login'] })

    await user.type(screen.getByLabelText('CPF'), '11122233344')
    await user.type(screen.getByLabelText('Senha'), 'senhaErrada')
    await user.click(screen.getByRole('button', { name: 'Acessar minha conta' }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('CPF ou senha incorretos.')
    })
  })
})
