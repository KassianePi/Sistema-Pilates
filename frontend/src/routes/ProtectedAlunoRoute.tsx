import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export function ProtectedAlunoRoute() {
  const { isAuthenticated, userType } = useAuth()

  if (!isAuthenticated) return <Navigate to="/aluno/login" replace />
  if (userType !== 'aluno') return <Navigate to="/aluno/login" replace />

  return <Outlet />
}
