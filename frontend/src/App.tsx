import { lazy, Suspense, type ReactNode } from 'react'
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
import { useAuth } from '@/hooks/useAuth'
import { canAccess, ROLE_DEFAULT_ROUTE } from '@/lib/permissions'
import type { AdminUser } from '@/types/auth.types'

// Páginas de login — carregadas imediatamente (leves, ponto de entrada)
import { AdminLoginPage } from '@/pages/AdminLoginPage'
import { AlunoLoginPage } from '@/pages/AlunoLoginPage'

// Admin — carregamento lazy por rota
const AdminDashboardPage = lazy(() => import('@/features/admin/dashboard/pages/AdminDashboardPage').then(m => ({ default: m.AdminDashboardPage })))
const AlunosPage = lazy(() => import('@/features/admin/alunos/pages/AlunosPage').then(m => ({ default: m.AlunosPage })))
const ProfessoresPage = lazy(() => import('@/features/admin/professores/pages/ProfessoresPage').then(m => ({ default: m.ProfessoresPage })))
const AgendaPage = lazy(() => import('@/features/admin/agenda/pages/AgendaPage').then(m => ({ default: m.AgendaPage })))
const FinanceiroPage = lazy(() => import('@/features/admin/financeiro/pages/FinanceiroPage').then(m => ({ default: m.FinanceiroPage })))
const PlanosPage = lazy(() => import('@/features/admin/planos/pages/PlanosPage').then(m => ({ default: m.PlanosPage })))
const RelatoriosPage = lazy(() => import('@/features/admin/relatorios/pages/RelatoriosPage').then(m => ({ default: m.RelatoriosPage })))
const NotificacoesPage = lazy(() => import('@/features/admin/notificacoes/pages/NotificacoesPage').then(m => ({ default: m.NotificacoesPage })))
const AuditoriaPage = lazy(() => import('@/features/admin/auditoria/pages/AuditoriaPage').then(m => ({ default: m.AuditoriaPage })))
const UsuariosPage = lazy(() => import('@/features/admin/usuarios/pages/UsuariosPage').then(m => ({ default: m.UsuariosPage })))
const ProfessorPerfilPage = lazy(() => import('@/features/admin/perfil/pages/ProfessorPerfilPage').then(m => ({ default: m.ProfessorPerfilPage })))

// Portal aluno — carregamento lazy por rota
const AlunoDashboardPage = lazy(() => import('@/features/aluno/dashboard/pages/AlunoDashboardPage').then(m => ({ default: m.AlunoDashboardPage })))
const AlunoAgendaPage = lazy(() => import('@/features/aluno/agenda/pages/AlunoAgendaPage').then(m => ({ default: m.AlunoAgendaPage })))
const AlunoPresencaPage = lazy(() => import('@/features/aluno/presenca/pages/AlunoPresencaPage').then(m => ({ default: m.AlunoPresencaPage })))
const AlunoFinanceiroPage = lazy(() => import('@/features/aluno/financeiro/pages/AlunoFinanceiroPage').then(m => ({ default: m.AlunoFinanceiroPage })))
const AlunoPerfilPage = lazy(() => import('@/features/aluno/perfil/pages/AlunoPerfilPage').then(m => ({ default: m.AlunoPerfilPage })))

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <div className="w-6 h-6 rounded-full border-2 border-roxo-profundo border-t-transparent animate-spin" />
    </div>
  )
}

// Redireciona /admin para a rota padrão do role do usuário logado
function RoleRedirect() {
  const { user } = useAuth()
  const adminUser = user as AdminUser | null
  const destination = adminUser ? (ROLE_DEFAULT_ROUTE[adminUser.role] ?? '/admin/agenda') : '/admin/login'
  return <Navigate to={destination} replace />
}

// Guard de permissão por rota — redireciona para a rota padrão do role se não tiver acesso
function RoleGuard({ path, children }: { path: string; children: ReactNode }) {
  const { user } = useAuth()
  const adminUser = user as AdminUser | null
  if (!adminUser || !canAccess(adminUser.role, path)) {
    const fallback = adminUser ? (ROLE_DEFAULT_ROUTE[adminUser.role] ?? '/admin/agenda') : '/admin/login'
    return <Navigate to={fallback} replace />
  }
  return <>{children}</>
}

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
                  <Route path="/admin" element={<RoleRedirect />} />

                  {/* Rotas acessíveis por múltiplos roles */}
                  <Route path="/admin/agenda" element={<Suspense fallback={<PageLoader />}><AgendaPage /></Suspense>} />
                  <Route path="/admin/notificacoes" element={<Suspense fallback={<PageLoader />}><NotificacoesPage /></Suspense>} />

                  {/* Rotas restritas (ADMIN, RECEPCIONISTA, FINANCEIRO) */}
                  <Route path="/admin/dashboard" element={<RoleGuard path="/admin/dashboard"><Suspense fallback={<PageLoader />}><AdminDashboardPage /></Suspense></RoleGuard>} />
                  <Route path="/admin/alunos" element={<RoleGuard path="/admin/alunos"><Suspense fallback={<PageLoader />}><AlunosPage /></Suspense></RoleGuard>} />
                  <Route path="/admin/professores" element={<RoleGuard path="/admin/professores"><Suspense fallback={<PageLoader />}><ProfessoresPage /></Suspense></RoleGuard>} />

                  {/* Rotas financeiras (ADMIN, FINANCEIRO) */}
                  <Route path="/admin/financeiro" element={<RoleGuard path="/admin/financeiro"><Suspense fallback={<PageLoader />}><FinanceiroPage /></Suspense></RoleGuard>} />
                  <Route path="/admin/planos" element={<RoleGuard path="/admin/planos"><Suspense fallback={<PageLoader />}><PlanosPage /></Suspense></RoleGuard>} />
                  <Route path="/admin/relatorios" element={<RoleGuard path="/admin/relatorios"><Suspense fallback={<PageLoader />}><RelatoriosPage /></Suspense></RoleGuard>} />

                  {/* Rotas exclusivas ADMIN */}
                  <Route path="/admin/auditoria" element={<RoleGuard path="/admin/auditoria"><Suspense fallback={<PageLoader />}><AuditoriaPage /></Suspense></RoleGuard>} />
                  <Route path="/admin/usuarios" element={<RoleGuard path="/admin/usuarios"><Suspense fallback={<PageLoader />}><UsuariosPage /></Suspense></RoleGuard>} />

                  {/* Perfil próprio — PROFESSOR e outros roles com acesso */}
                  <Route path="/admin/perfil" element={<RoleGuard path="/admin/perfil"><Suspense fallback={<PageLoader />}><ProfessorPerfilPage /></Suspense></RoleGuard>} />
                </Route>
              </Route>

              {/* Área protegida Aluno */}
              <Route element={<ProtectedAlunoRoute />}>
                <Route element={<AlunoLayout />}>
                  <Route path="/aluno" element={<Navigate to="/aluno/dashboard" replace />} />
                  <Route path="/aluno/dashboard" element={<Suspense fallback={<PageLoader />}><AlunoDashboardPage /></Suspense>} />
                  <Route path="/aluno/agenda" element={<Suspense fallback={<PageLoader />}><AlunoAgendaPage /></Suspense>} />
                  <Route path="/aluno/presenca" element={<Suspense fallback={<PageLoader />}><AlunoPresencaPage /></Suspense>} />
                  <Route path="/aluno/financeiro" element={<Suspense fallback={<PageLoader />}><AlunoFinanceiroPage /></Suspense>} />
                  <Route path="/aluno/perfil" element={<Suspense fallback={<PageLoader />}><AlunoPerfilPage /></Suspense>} />
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
