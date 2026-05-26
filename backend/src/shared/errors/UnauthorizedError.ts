/**
 * UnauthorizedError — Erro de autenticação/autorização
 *
 * Lançado quando:
 * - Usuário não autenticado (401)
 * - Usuário autenticado mas sem permissão (403)
 */

export class UnauthorizedError extends Error {
  readonly code: 'INVALID_CREDENTIALS' | 'TOKEN_EXPIRED' | 'TOKEN_INVALID' | 'INSUFFICIENT_PERMISSION' = 'INVALID_CREDENTIALS'
  readonly statusCode: 401 | 403
  readonly details?: Record<string, any>

  constructor(
    message: string,
    code: 'INVALID_CREDENTIALS' | 'TOKEN_EXPIRED' | 'TOKEN_INVALID' | 'INSUFFICIENT_PERMISSION' = 'INVALID_CREDENTIALS',
    statusCode: 401 | 403 = 401,
    details?: Record<string, any>,
  ) {
    super(message)
    this.name = 'UnauthorizedError'
    this.code = code
    this.statusCode = statusCode
    this.details = details

    Object.setPrototypeOf(this, UnauthorizedError.prototype)
  }

  /**
   * Converte para JSON para resposta HTTP
   */
  toJSON() {
    return {
      success: false,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      ...(this.details && { details: this.details }),
    }
  }

  /**
   * Cria erro de credenciais inválidas (401)
   *
   * @param message - Mensagem de erro
   * @returns UnauthorizedError com status 401
   *
   * @example
   * throw UnauthorizedError.invalidCredentials('Email ou senha incorretos')
   */
  static invalidCredentials(message = 'Email ou senha incorretos'): UnauthorizedError {
    return new UnauthorizedError(message, 'INVALID_CREDENTIALS', 401)
  }

  /**
   * Cria erro de token expirado (401)
   *
   * @param message - Mensagem de erro
   * @returns UnauthorizedError com status 401
   *
   * @example
   * throw UnauthorizedError.tokenExpired()
   */
  static tokenExpired(message = 'Access token expirado'): UnauthorizedError {
    return new UnauthorizedError(message, 'TOKEN_EXPIRED', 401)
  }

  /**
   * Cria erro de token inválido (401)
   *
   * @param message - Mensagem de erro
   * @returns UnauthorizedError com status 401
   *
   * @example
   * throw UnauthorizedError.tokenInvalid()
   */
  static tokenInvalid(message = 'Access token inválido'): UnauthorizedError {
    return new UnauthorizedError(message, 'TOKEN_INVALID', 401)
  }

  /**
   * Cria erro de permissão insuficiente (403)
   *
   * @param message - Mensagem de erro
   * @param requiredRole - Role necessário (opcional, para logs)
   * @returns UnauthorizedError com status 403
   *
   * @example
   * throw UnauthorizedError.insufficientPermission(
   *   'Apenas admin pode acessar',
   *   'ADMIN'
   * )
   */
  static insufficientPermission(message = 'Permissão insuficiente', requiredRole?: string): UnauthorizedError {
    return new UnauthorizedError(
      message,
      'INSUFFICIENT_PERMISSION',
      403,
      requiredRole ? { requiredRole } : undefined,
    )
  }

  /**
   * Cria erro de autenticação requerida
   *
   * @param message - Mensagem de erro
   * @returns UnauthorizedError com status 401
   *
   * @example
   * throw UnauthorizedError.authRequired()
   */
  static authRequired(message = 'Autenticação necessária'): UnauthorizedError {
    return new UnauthorizedError(message, 'INVALID_CREDENTIALS', 401)
  }
}
