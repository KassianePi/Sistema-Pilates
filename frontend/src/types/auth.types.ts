export type UserRole = 'ADMIN' | 'RECEPCIONISTA' | 'PROFESSOR' | 'FINANCEIRO'

export interface AdminUser {
  id: string
  nome: string
  email: string
  role: UserRole
}

export interface AlunoUser {
  id: string
  nome: string
  email: string
  plano?: string
}

export interface AuthState {
  accessToken: string | null
  user: AdminUser | AlunoUser | null
  userType: 'admin' | 'aluno' | null
}

export interface LoginCredentials {
  email: string
  senha: string
}

export interface AuthResponse {
  accessToken: string
  user: AdminUser | AlunoUser
}
