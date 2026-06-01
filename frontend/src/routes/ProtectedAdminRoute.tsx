import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export function ProtectedAdminRoute() {
  const { isAuthenticated, userType } = useAuth()

  if (!isAuthenticated) return <Navigate to="/admin/login" replace />
  if (userType !== 'admin') return <Navigate to="/admin/login" replace />

  return <Outlet />
}
