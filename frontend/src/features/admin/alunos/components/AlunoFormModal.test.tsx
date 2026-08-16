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
    // E-mail é opcional (login do aluno é por CPF) — não deve validar como erro quando vazio
    expect(screen.queryByText('E-mail inválido')).not.toBeInTheDocument()
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

  it('cadastra aluno com plano sem exigir comprovante de pagamento', async () => {
    let corpoRecebido: any = null
    const { http, HttpResponse } = await import('msw')
    const { server } = await import('@/test/server')
    server.use(
      http.get('/api/v1/planos', () =>
        HttpResponse.json({
          success: true,
          data: {
            planos: [
              {
                id: 'plano-1',
                nome: 'Mensal',
                preco: 100,
                aulas: 2,
                tipo: 'MENSAL',
                ativo: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ],
            total: 1,
            page: 1,
            limit: 100,
            totalPages: 1,
          },
        }),
      ),
      http.post('/api/v1/alunos', async ({ request }) => {
        corpoRecebido = await request.json()
        return HttpResponse.json({ success: true, data: { id: 'aluno-1' } }, { status: 201 })
      }),
    )

    const user = userEvent.setup()
    renderWithProviders(<AlunoFormModal open onClose={() => {}} />)

    await user.type(screen.getByLabelText('Nome completo *'), 'Aluno Teste')
    await user.type(screen.getByPlaceholderText('email@exemplo.com'), 'aluno@teste.com')
    await user.type(screen.getByPlaceholderText('000.000.000-00'), '12345678900')
    await user.type(screen.getByPlaceholderText('Mínimo 6 caracteres'), 'senha123')
    await user.type(screen.getByPlaceholderText('Dia da data de início'), '10')

    const combobox = screen.getByRole('combobox')
    combobox.focus()
    await user.keyboard('{Enter}')
    await screen.findByRole('option', { name: 'Mensal' }, { timeout: 3000 })
    await user.keyboard('{ArrowDown}{Enter}')

    await user.click(screen.getByRole('button', { name: 'Cadastrar aluno' }))

    await waitFor(() => expect(corpoRecebido).not.toBeNull())
    expect(corpoRecebido).not.toHaveProperty('comprovante')
    expect(corpoRecebido.planoId).toBe('plano-1')
    expect(screen.queryByText(/comprovante/i)).not.toBeInTheDocument()
  })

  it('cadastra aluno sem preencher e-mail (opcional — login do aluno é por CPF)', async () => {
    let corpoRecebido: any = null
    const { http, HttpResponse } = await import('msw')
    const { server } = await import('@/test/server')
    server.use(
      http.post('/api/v1/alunos', async ({ request }) => {
        corpoRecebido = await request.json()
        return HttpResponse.json({ success: true, data: { id: 'aluno-2' } }, { status: 201 })
      }),
    )

    const user = userEvent.setup()
    renderWithProviders(<AlunoFormModal open onClose={() => {}} />)

    await user.type(screen.getByLabelText('Nome completo *'), 'Aluno Sem Email')
    await user.type(screen.getByPlaceholderText('000.000.000-00'), '98765432100')
    await user.type(screen.getByPlaceholderText('Mínimo 6 caracteres'), 'senha123')
    await user.type(screen.getByPlaceholderText('Dia da data de início'), '10')
    // campo de e-mail deliberadamente não preenchido
    await user.click(screen.getByRole('button', { name: 'Cadastrar aluno' }))

    await waitFor(() => expect(corpoRecebido).not.toBeNull())
    expect(corpoRecebido).not.toHaveProperty('email')
  })
})
