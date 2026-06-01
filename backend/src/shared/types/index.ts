export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  code?: string
}

export interface PaginationParams {
  page?: number
  limit?: number
}

export type FuncaoUsuario = 'ADMIN' | 'PROFESSOR' | 'RECEPCIONISTA' | 'FINANCEIRO'
export type StatusUsuario = 'ATIVO' | 'INATIVO' | 'SUSPENSO'
