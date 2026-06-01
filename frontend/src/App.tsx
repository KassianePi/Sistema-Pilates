import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { queryClient } from '@/lib/queryClient'
import { AuthProvider } from '@/contexts/AuthContext'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { AdminLayout } from '@/layouts/AdminLayout'
import { AlunoLayout } from '@/layouts/AlunoLayout'
import { ProtectedAdminRoute } from '@/routes/ProtectedAdminRoute'
import { ProtectedAlunoRoute } from '@/routes/ProtectedAlunoRoute'
import { AdminLoginPage } from '@/pages/AdminLoginPage'
import { AlunoLoginPage } from '@/pages/AlunoLoginPage'
import { AdminDashboardPage } from '@/features/admin/dashboard/pages/AdminDashboardPage'
import { AlunosPage } from '@/features/admin/alunos/pages/AlunosPage'
import { ProfessoresPage } from '@/features/admin/professores/pages/ProfessoresPage'
import { AgendaPage } from '@/features/admin/agenda/pages/AgendaPage'
import { FinanceiroPage } from '@/features/admin/financeiro/pages/FinanceiroPage'
import { PlanosPage } from '@/features/admin/planos/pages/PlanosPage'
import { RelatoriosPage } from '@/features/admin/relatorios/pages/RelatoriosPage'
import { NotificacoesPage } from '@/features/admin/notificacoes/pages/NotificacoesPage'
import { AuditoriaPage } from '@/features/admin/auditoria/pages/AuditoriaPage'
import { UsuariosPage } from '@/features/admin/usuarios/pages/UsuariosPage'
import { AlunoDashboardPage } from '@/features/aluno/dashboard/pages/AlunoDashboardPage'
import { AlunoAgendaPage } from '@/features/aluno/agenda/pages/AlunoAgendaPage'
import { AlunoPresencaPage } from '@/features/aluno/presenca/pages/AlunoPresencaPage'
import { AlunoFinanceiroPage } from '@/features/aluno/financeiro/pages/AlunoFinanceiroPage'
import { AlunoPerfilPage } from '@/features/aluno/perfil/pages/AlunoPerfilPage'

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <ErrorBoundary>
            <Routes>
              {/* Redirect raiz */}
              <Route path="/" element={<Navigate to="/admin/login" replace />} />

              {/* Login Admin */}
              <Route path="/admin/login" element={<AdminLoginPage />} />

              {/* Login Aluno */}
              <Route path="/aluno/login" element={<AlunoLoginPage />} />

              {/* Área protegida Admin */}
              <Route element={<ProtectedAdminRoute />}>
                <Route element={<AdminLayout />}>
                  <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                  <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
                  <Route path="/admin/alunos" element={<AlunosPage />} />
                  <Route path="/admin/professores" element={<ProfessoresPage />} />
                  <Route path="/admin/agenda" element={<AgendaPage />} />
                  <Route path="/admin/financeiro" element={<FinanceiroPage />} />
                  <Route path="/admin/planos" element={<PlanosPage />} />
                  <Route path="/admin/relatorios" element={<RelatoriosPage />} />
                  <Route path="/admin/notificacoes" element={<NotificacoesPage />} />
                  <Route path="/admin/auditoria" element={<AuditoriaPage />} />
                  <Route path="/admin/usuarios" element={<UsuariosPage />} />
                </Route>
              </Route>

              {/* Área protegida Aluno */}
              <Route element={<ProtectedAlunoRoute />}>
                <Route element={<AlunoLayout />}>
                  <Route path="/aluno" element={<Navigate to="/aluno/dashboard" replace />} />
                  <Route path="/aluno/dashboard" element={<AlunoDashboardPage />} />
                  <Route path="/aluno/agenda" element={<AlunoAgendaPage />} />
                  <Route path="/aluno/presenca" element={<AlunoPresencaPage />} />
                  <Route path="/aluno/financeiro" element={<AlunoFinanceiroPage />} />
                  <Route path="/aluno/perfil" element={<AlunoPerfilPage />} />
                </Route>
              </Route>

              {/* 404 - redireciona para login */}
              <Route path="*" element={<Navigate to="/admin/login" replace />} />
            </Routes>
          </ErrorBoundary>
        </BrowserRouter>
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </QueryClientProvider>
  )
}
