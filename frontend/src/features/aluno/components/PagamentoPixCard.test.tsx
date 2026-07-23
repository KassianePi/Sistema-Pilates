import { describe, it, expect, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/server'
import { renderWithProviders, userEvent } from '@/test/test-utils'
import { PagamentoPixCard } from './PagamentoPixCard'

const MENSALIDADE_ID = 'mensalidade-1'
const BASE_URL = `/api/v1/aluno/mensalidades/${MENSALIDADE_ID}/pix`

function cobrancaFake(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'cobranca-1',
    mensalidadeId: MENSALIDADE_ID,
    status: 'PENDENTE',
    statusDetail: null,
    qrCode: '00020126segredo-copia-e-cola',
    qrCodeBase64: 'aGVsbG8=',
    ticketUrl: null,
    dataExpiracao: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
    dataAprovacao: null,
    valor: '150.00',
    ...overrides,
  }
}

describe('PagamentoPixCard', () => {
  it('sem cobrança: mostra CTA e gera uma nova ao clicar', async () => {
    server.use(
      http.get(BASE_URL, () => HttpResponse.json({ success: true, data: null })),
      http.post(`${BASE_URL}/sincronizar`, () => HttpResponse.json({ success: true, data: null })),
      http.post(BASE_URL, () => HttpResponse.json({ success: true, data: cobrancaFake() })),
    )

    renderWithProviders(<PagamentoPixCard mensalidadeId={MENSALIDADE_ID} onVerDetalhes={() => {}} />)

    await waitFor(() => expect(screen.getByRole('button', { name: /Gerar cobrança PIX/ })).toBeInTheDocument())

    await userEvent.click(screen.getByRole('button', { name: /Gerar cobrança PIX/ }))

    await waitFor(() => expect(screen.getByText('PIX Copia e Cola')).toBeInTheDocument())
    expect(screen.getByAltText('QR Code PIX')).toBeInTheDocument()
  })

  it('cobrança pendente: mostra QR, copia-e-cola e countdown', async () => {
    server.use(
      http.get(BASE_URL, () => HttpResponse.json({ success: true, data: cobrancaFake() })),
      http.post(`${BASE_URL}/sincronizar`, () => HttpResponse.json({ success: true, data: cobrancaFake() })),
    )

    renderWithProviders(<PagamentoPixCard mensalidadeId={MENSALIDADE_ID} onVerDetalhes={() => {}} />)

    await waitFor(() => expect(screen.getByText('PIX Copia e Cola')).toBeInTheDocument())
    expect(screen.getByText('Aguardando pagamento')).toBeInTheDocument()
    expect(screen.getByText(/Expira em/)).toBeInTheDocument()
  })

  it('pagamento aprovado: mostra confirmação e navega ao clicar em "Ver detalhes"', async () => {
    server.use(
      http.get(BASE_URL, () => HttpResponse.json({ success: true, data: cobrancaFake() })),
      http.post(`${BASE_URL}/sincronizar`, () =>
        HttpResponse.json({
          success: true,
          data: cobrancaFake({ status: 'APROVADO', dataAprovacao: new Date().toISOString() }),
        }),
      ),
    )
    const onVerDetalhes = vi.fn()

    renderWithProviders(<PagamentoPixCard mensalidadeId={MENSALIDADE_ID} onVerDetalhes={onVerDetalhes} />)

    await waitFor(() => expect(screen.getByText('Pagamento confirmado')).toBeInTheDocument())

    await userEvent.click(screen.getByRole('button', { name: 'Ver detalhes' }))
    expect(onVerDetalhes).toHaveBeenCalledTimes(1)
  })

  it('cobrança expirada (confirmada pelo servidor): mostra tela de expirado com opção de gerar novo PIX', async () => {
    server.use(
      http.get(BASE_URL, () => HttpResponse.json({ success: true, data: cobrancaFake({ status: 'EXPIRADO' }) })),
      http.post(`${BASE_URL}/sincronizar`, () =>
        HttpResponse.json({ success: true, data: cobrancaFake({ status: 'EXPIRADO' }) }),
      ),
    )

    renderWithProviders(<PagamentoPixCard mensalidadeId={MENSALIDADE_ID} onVerDetalhes={() => {}} />)

    await waitFor(() => expect(screen.getByText('PIX expirado')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: 'Gerar novo PIX' })).toBeInTheDocument()
  })

  it('erro ao consultar: mostra mensagem de erro e permite tentar novamente', async () => {
    server.use(
      http.get(BASE_URL, () => HttpResponse.json({ success: false, message: 'Erro' }, { status: 500 })),
      http.post(`${BASE_URL}/sincronizar`, () =>
        HttpResponse.json({ success: false, message: 'Erro' }, { status: 500 }),
      ),
    )

    renderWithProviders(<PagamentoPixCard mensalidadeId={MENSALIDADE_ID} onVerDetalhes={() => {}} />)

    await waitFor(() => expect(screen.getByText('Não foi possível consultar o pagamento')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: /Tentar novamente/ })).toBeInTheDocument()
  })
})
