/**
 * Tipos e interfaces do módulo de autenticação
 */

import type { FuncaoUsuario, StatusUsuario } from '@prisma/client'

/**
 * Usuário armazenado no banco de dados
 * Mapeia 1:1 com o model Usuario do Prisma
 */
export interface Usuario {
  id: string
  email: string
  nomeCompleto: string
  senhaHash: string
  telefone: string | null
  cpf: string
  funcao: FuncaoUsuario
  status: StatusUsuario
  ultimoAcessoEm: Date | null
  criadoEm: Date
  atualizadoEm: Date
}

/**
 * Dados do usuário para criar (sem senhaHash)
 */
export interface CreateUsuarioData {
  email: string
  nomeCompleto: string
  cpf: string
  telefone?: string | null
  senha: string // texto plano, será hashado
  funcao: FuncaoUsuario
}

/**
 * Dados retornados após login bem-sucedido
 */
export interface LoginResponse {
  usuarioId: string
  email: string
  nome: string
  funcao: FuncaoUsuario
  accessToken: string
  refreshToken: string
  expiresIn: number
}

/**
 * Dados retornados após registro bem-sucedido
 */
export interface RegisterResponse extends LoginResponse {}

/**
 * Resultado da validação de credentials
 */
export interface ValidateCredentialsResult {
  isValid: boolean
  usuario?: Usuario
  error?: string
}

/**
 * Resultado da renovação de token
 */
export interface RefreshTokenResult {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

/**
 * Payload do JWT
 */
export interface TokenPayload {
  usuarioId: string
  email: string
  funcao: FuncaoUsuario
  iat?: number
  exp?: number
}
