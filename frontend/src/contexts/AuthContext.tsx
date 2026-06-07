import { createContext, useState, useCallback, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { AdminUser, AlunoUser } from '@/types/auth.types'
import { setAccessToken, setRefreshToken, getStoredRefreshToken, api } from '@/services/api'

const STORAGE_USER = 'pilates_user'
const STORAGE_USER_TYPE = 'pilates_user_type'

interface AuthContextValue {
  user: AdminUser | AlunoUser | null
  userType: 'admin' | 'aluno' | null
  isAuthenticated: boolean
  isLoading: boolean
  loginAdmin: (email: string, senha: string) => Promise<AdminUser>
  loginAluno: (email: string, senha: string) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | AlunoUser | null>(null)
  const [userType, setUserType] = useState<'admin' | 'aluno' | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function restoreSession() {
      const storedRefresh = getStoredRefreshToken()
      const storedType = localStorage.getItem(STORAGE_USER_TYPE) as 'admin' | 'aluno' | null
      const storedUser = localStorage.getItem(STORAGE_USER)

      if (!storedRefresh || !storedType || !storedUser) {
        setIsLoading(false)
        return
      }

      try {
        const { data } = await api.post('/auth/refresh', { refreshToken: storedRefresh })
        const { accessToken, refreshToken } = data.data

        setAccessToken(accessToken)
        setRefreshToken(refreshToken)

        const parsed = JSON.parse(storedUser)
        setUser(parsed)
        setUserType(storedType)
      } catch {
        setAccessToken(null)
        setRefreshToken(null)
        localStorage.removeItem(STORAGE_USER)
        localStorage.removeItem(STORAGE_USER_TYPE)
      } finally {
        setIsLoading(false)
      }
    }

    restoreSession()
  }, [])

  const loginAdmin = useCallback(async (email: string, senha: string): Promise<AdminUser> => {
    const { data } = await api.post('/auth/login', { email, senha })
    const payload = data.data
    setAccessToken(payload.accessToken)
    setRefreshToken(payload.refreshToken)
    const userData: AdminUser = { id: payload.usuarioId, nome: payload.nome, email: payload.email, role: payload.funcao }
    localStorage.setItem(STORAGE_USER, JSON.stringify(userData))
    localStorage.setItem(STORAGE_USER_TYPE, 'admin')
    setUser(userData)
    setUserType('admin')
    return userData
  }, [])

  const loginAluno = useCallback(async (email: string, senha: string) => {
    const { data } = await api.post('/auth/aluno/login', { email, senha })
    const payload = data.data
    setAccessToken(payload.accessToken)
    setRefreshToken(payload.refreshToken)
    const userData: AlunoUser = { id: payload.usuarioId, nome: payload.nome, email: payload.email }
    localStorage.setItem(STORAGE_USER, JSON.stringify(userData))
    localStorage.setItem(STORAGE_USER_TYPE, 'aluno')
    setUser(userData)
    setUserType('aluno')
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } finally {
      setAccessToken(null)
      setRefreshToken(null)
      localStorage.removeItem(STORAGE_USER)
      localStorage.removeItem(STORAGE_USER_TYPE)
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
        isLoading,
        loginAdmin,
        loginAluno,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
