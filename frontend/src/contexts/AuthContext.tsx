import { createContext, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import type { AdminUser, AlunoUser } from '@/types/auth.types'
import { setAccessToken } from '@/services/api'
import { api } from '@/services/api'

interface AuthContextValue {
  user: AdminUser | AlunoUser | null
  userType: 'admin' | 'aluno' | null
  isAuthenticated: boolean
  loginAdmin: (email: string, senha: string) => Promise<void>
  loginAluno: (email: string, senha: string) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | AlunoUser | null>(null)
  const [userType, setUserType] = useState<'admin' | 'aluno' | null>(null)

  const loginAdmin = useCallback(async (email: string, senha: string) => {
    const { data } = await api.post('/auth/login', { email, senha })
    setAccessToken(data.accessToken)
    setUser(data.user)
    setUserType('admin')
  }, [])

  const loginAluno = useCallback(async (email: string, senha: string) => {
    const { data } = await api.post('/auth/aluno/login', { email, senha })
    setAccessToken(data.accessToken)
    setUser(data.user)
    setUserType('aluno')
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } finally {
      setAccessToken(null)
      setUser(null)
      setUserType(null)
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        userType,
        isAuthenticated: user !== null,
        loginAdmin,
        loginAluno,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
