import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export function ProtectedAlunoRoute() {
  const { isAuthenticated, userType, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-creme-fundo">
        <div className="w-8 h-8 rounded-full border-2 border-roxo-profundo border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) return <Navigate to="/aluno/login" replace />
  if (userType !== 'aluno') return <Navigate to="/aluno/login" replace />

  return <Outlet />
}
