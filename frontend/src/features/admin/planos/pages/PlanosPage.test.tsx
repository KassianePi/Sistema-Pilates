import { describe, it, expect } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/server'
import { renderWithProviders } from '@/test/test-utils'
import { PlanosPage } from './PlanosPage'

// Formato real retornado pelo backend (ver planos.service.ts -> mapPlano)
const planoFakeBackend = {
  id: 'plano-1',
  nome: 'Plano Mensal',
  descricao: '4 aulas por mês',
  preco: 200,
  aulas: 1,
  tipo: 'MENSAL',
  ativo: true,
  createdAt: '2026-06-01T00:00:00.000Z',
  updatedAt: '2026-06-01T00:00:00.000Z',
}

function planosListResponse() {
  return HttpResponse.json({
    success: true,
    data: { planos: [planoFakeBackend], total: 1, page: 1, limit: 50, totalPages: 1 },
  })
}

describe('PlanosPage — confirmação de exclusão (ação financeira sensível)', () => {
  it('pede confirmação antes de excluir um plano e cancela sem chamar a API', async () => {
    server.use(http.get('/api/v1/planos', planosListResponse))
    let deleteChamado = false
    server.use(
      http.delete('/api/v1/planos/plano-1', () => {
        deleteChamado = true
        return new HttpResponse(null, { status: 204 })
      }),
    )

    const user = userEvent.setup()
    renderWithProviders(<PlanosPage />)

    await waitFor(() => expect(screen.getByText('Plano Mensal')).toBeInTheDocument())

    await user.click(screen.getByTitle('Excluir'))

    // O diálogo de confirmação deve aparecer com o nome do plano
    const dialog = await screen.findByRole('alertdialog')
    expect(within(dialog).getByText('Remover plano?')).toBeInTheDocument()
    expect(
      within(dialog).getByText(
        (_, node) =>
          node?.textContent ===
          'Esta ação removerá permanentemente o plano Plano Mensal. Alunos vinculados a este plano não serão afetados.',
      ),
    ).toBeInTheDocument()

    // Cancelar não deve chamar a API
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(deleteChamado).toBe(false)
  })

  it('confirma a exclusão e chama a API de remoção', async () => {
    server.use(http.get('/api/v1/planos', planosListResponse))
    let deleteChamado = false
    server.use(
      http.delete('/api/v1/planos/plano-1', () => {
        deleteChamado = true
        return new HttpResponse(null, { status: 204 })
      }),
    )

    const user = userEvent.setup()
    renderWithProviders(<PlanosPage />)

    await waitFor(() => expect(screen.getByText('Plano Mensal')).toBeInTheDocument())
    await user.click(screen.getByTitle('Excluir'))

    const dialog = await screen.findByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: 'Remover' }))

    await waitFor(() => expect(deleteChamado).toBe(true))
  })
})
