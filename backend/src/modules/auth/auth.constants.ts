/**
 * Constantes do módulo de autenticação
 */

/**
 * Mensagens de erro
 */
export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: 'Email ou senha incorretos',
  USER_NOT_FOUND: 'Usuário não encontrado',
  USER_ALREADY_EXISTS: 'Email já cadastrado',
  INVALID_TOKEN: 'Token inválido ou expirado',
  TOKEN_EXPIRED: 'Token expirado',
  REFRESH_TOKEN_EXPIRED: 'Refresh token expirado',
  WEAK_PASSWORD: 'Senha deve ter no mínimo 6 caracteres',
  PASSWORD_MISMATCH: 'Senhas não correspondem',
  INSUFFICIENT_PERMISSION: 'Permissão insuficiente',
  USER_INACTIVE: 'Usuário inativo',
} as const

/**
 * Códigos de erro
 */
export const AUTH_ERROR_CODES = {
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  REFRESH_TOKEN_EXPIRED: 'REFRESH_TOKEN_EXPIRED',
} as const

/**
 * Roles padrão
 */
export const DEFAULT_ROLES = {
  ADMIN: 'ADMIN',
  PROFESSOR: 'PROFESSOR',
  RECEPCIONISTA: 'RECEPCIONISTA',
  FINANCEIRO: 'FINANCEIRO',
} as const

/**
 * Tipos de usuário
 */
export const USER_TYPES = ['ADMIN', 'PROFESSOR', 'RECEPCIONISTA', 'FINANCEIRO'] as const

/**
 * Status de usuário
 */
export const USER_STATUS = {
  ATIVO: true,
  INATIVO: false,
} as const
