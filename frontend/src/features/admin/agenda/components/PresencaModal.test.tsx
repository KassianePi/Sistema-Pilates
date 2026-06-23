import { describe, it, expect } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/server'
import { renderWithProviders } from '@/test/test-utils'
import { PresencaModal } from './PresencaModal'
import type { Aula } from '@/types/domain.types'

const aulaFake: Aula = {
  id: 'aula-1',
  titulo: 'Pilates Solo',
  data: '2026-06-23',
  horaInicio: '08:00',
  horaFim: '09:00',
} as Aula

describe('PresencaModal', () => {
  it('exibe estado vazio quando não há alunos matriculados na aula', async () => {
    server.use(http.get('/api/v1/aulas/aula-1/inscricoes', () => HttpResponse.json({ success: true, data: [] })))

    renderWithProviders(<PresencaModal aula={aulaFake} onClose={() => {}} />)

    await waitFor(() => {
      expect(screen.getByText(/Nenhum aluno matriculado nesta aula/)).toBeInTheDocument()
    })

    // Botão de salvar deve ficar desabilitado sem alunos
    expect(screen.getByRole('button', { name: 'Salvar e Finalizar Aula' })).toBeDisabled()
  })

  it('lista os alunos matriculados e permite marcar presença', async () => {
    server.use(
      http.get('/api/v1/aulas/aula-1/inscricoes', () =>
        HttpResponse.json({
          success: true,
          data: [{ id: 'aluno-1', usuario: { nomeCompleto: 'Maria Silva' }, planoAtual: null }],
        }),
      ),
    )

    renderWithProviders(<PresencaModal aula={aulaFake} onClose={() => {}} />)

    await waitFor(() => {
      expect(screen.getByText('Maria Silva')).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: 'Salvar e Finalizar Aula' })).toBeEnabled()
  })
})
