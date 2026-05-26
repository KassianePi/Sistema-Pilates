/**
 * JWT utilities — Token management com renovação automática
 *
 * Implementa 2 tokens:
 * - Access token: 15 minutos em memória (header Authorization)
 * - Refresh token: 7 dias em cookie httpOnly (renovável)
 *
 * Rotação obrigatória: refresh token muda a cada uso
 */

import jwt from 'jsonwebtoken'

export interface TokenPayload {
  usuarioId: string
  email: string
  funcao: 'ADMIN' | 'PROFESSOR' | 'RECEPCIONISTA' | 'FINANCEIRO'
  iat?: number
  exp?: number
}

export interface TokenResponse {
  accessToken: string
  refreshToken: string
  expiresIn: number // em segundos
}

/**
 * Gera access token (15 minutos)
 *
 * @param payload - Dados do usuário
 * @returns Access token JWT
 * @throws Error se JWT_SECRET não está configurado
 *
 * @example
 * const accessToken = generateAccessToken({
 *   usuarioId: '123',
 *   email: 'user@pilates.local',
 *   funcao: 'ADMIN'
 * })
 */
export function generateAccessToken(payload: TokenPayload): string {
  const secret = process.env.JWT_SECRET

  if (!secret) {
    throw new Error('JWT_SECRET não configurado')
  }

  const token = jwt.sign(payload, secret, {
    expiresIn: '15m', // 15 minutos
    algorithm: 'HS256',
    issuer: 'studio-pilates',
  })

  return token
}

/**
 * Gera refresh token (7 dias)
 *
 * @param payload - Dados do usuário
 * @returns Refresh token JWT
 * @throws Error se JWT_REFRESH_SECRET não está configurado
 *
 * @example
 * const refreshToken = generateRefreshToken({
 *   usuarioId: '123',
 *   email: 'user@pilates.local',
 *   funcao: 'ADMIN'
 * })
 */
export function generateRefreshToken(payload: TokenPayload): string {
  const secret = process.env.JWT_REFRESH_SECRET

  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET não configurado')
  }

  const token = jwt.sign(payload, secret, {
    expiresIn: '7d', // 7 dias
    algorithm: 'HS256',
    issuer: 'studio-pilates',
  })

  return token
}

/**
 * Gera par de tokens (access + refresh)
 *
 * @param payload - Dados do usuário
 * @returns { accessToken, refreshToken, expiresIn }
 * @throws Error se secrets não estão configurados
 *
 * @example
 * const { accessToken, refreshToken } = generateTokens({
 *   usuarioId: '123',
 *   email: 'user@pilates.local',
 *   funcao: 'ADMIN'
 * })
 */
export function generateTokens(payload: TokenPayload): TokenResponse {
  const accessToken = generateAccessToken(payload)
  const refreshToken = generateRefreshToken(payload)

  return {
    accessToken,
    refreshToken,
    expiresIn: 15 * 60, // 15 minutos em segundos
  }
}

/**
 * Verifica e decodifica access token
 *
 * @param token - Access token JWT
 * @returns Payload decodificado
 * @throws Error se token inválido, expirado ou secret não configurado
 *
 * @example
 * const payload = verifyAccessToken('eyJhbGc...')
 * console.log(payload.email)
 */
export function verifyAccessToken(token: string): TokenPayload {
  const secret = process.env.JWT_SECRET

  if (!secret) {
    throw new Error('JWT_SECRET não configurado')
  }

  try {
    const decoded = jwt.verify(token, secret, {
      algorithms: ['HS256'],
      issuer: 'studio-pilates',
    })

    return decoded as TokenPayload
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Access token expirado')
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Access token inválido')
    }
    throw error
  }
}

/**
 * Verifica e decodifica refresh token
 *
 * Utilizado para rotação: ao usar um refresh token, é gerado um novo
 * O antigo é invalidado (aplicação responsável)
 *
 * @param token - Refresh token JWT
 * @returns Payload decodificado
 * @throws Error se token inválido, expirado ou secret não configurado
 *
 * @example
 * const payload = verifyRefreshToken('eyJhbGc...')
 * // Gerar novo refresh token com os mesmos dados
 * const newRefreshToken = generateRefreshToken(payload)
 */
export function verifyRefreshToken(token: string): TokenPayload {
  const secret = process.env.JWT_REFRESH_SECRET

  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET não configurado')
  }

  try {
    const decoded = jwt.verify(token, secret, {
      algorithms: ['HS256'],
      issuer: 'studio-pilates',
    })

    return decoded as TokenPayload
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh token expirado')
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Refresh token inválido')
    }
    throw error
  }
}

/**
 * Extrai token do header Authorization
 *
 * Formato esperado: "Bearer <token>"
 *
 * @param authHeader - Header Authorization
 * @returns Token extraído
 * @throws Error se formato inválido
 *
 * @example
 * const token = extractTokenFromHeader('Bearer eyJhbGc...')
 * // token: 'eyJhbGc...'
 */
export function extractTokenFromHeader(authHeader?: string): string {
  if (!authHeader) {
    throw new Error('Header Authorization não fornecido')
  }

  const parts = authHeader.split(' ')

  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    throw new Error('Formato inválido. Use: Bearer <token>')
  }

  return parts[1]
}

/**
 * Decodifica token SEM verificar assinatura
 *
 * ⚠️ USE COM CUIDADO — apenas para obter payload sem validação
 * Útil apenas para extrair informações antes de validação
 *
 * @param token - JWT token
 * @returns Payload decodificado (pode ser forjado)
 * @throws Error se token inválido (malformed)
 *
 * @example
 * const payload = decodeTokenWithoutVerification('eyJhbGc...')
 * // Não use para autenticação!
 */
export function decodeTokenWithoutVerification(token: string): TokenPayload | null {
  try {
    const decoded = jwt.decode(token, { complete: false })
    return decoded as TokenPayload | null
  } catch {
    throw new Error('Token malformed')
  }
}
