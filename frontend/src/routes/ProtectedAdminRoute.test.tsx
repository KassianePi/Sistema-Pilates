import { describe, it, expect } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedAdminRoute } from './ProtectedAdminRoute'

function renderApp(initialPath: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <AuthProvider>
          <Routes>
            <Route path="/admin/login" element={<p>Página de login</p>} />
            <Route element={<ProtectedAdminRoute />}>
              <Route path="/admin/dashboard" element={<p>Dashboard protegido</p>} />
            </Route>
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('ProtectedAdminRoute', () => {
  it('redireciona para /admin/login quando não há usuário autenticado', async () => {
    renderApp('/admin/dashboard')

    await waitFor(() => {
      expect(screen.getByText('Página de login')).toBeInTheDocument()
    })
    expect(screen.queryByText('Dashboard protegido')).not.toBeInTheDocument()
  })
})
