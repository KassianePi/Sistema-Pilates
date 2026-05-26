/**
 * AppError — Base class para erros da aplicação
 *
 * Todos os erros customizados devem estender essa classe
 */

export class AppError extends Error {
  readonly code: string
  readonly statusCode: number
  readonly isOperational: boolean

  constructor(message: string, code: string = 'INTERNAL_ERROR', statusCode: number = 500, isOperational: boolean = true) {
    super(message)
    this.name = this.constructor.name
    this.code = code
    this.statusCode = statusCode
    this.isOperational = isOperational

    Object.setPrototypeOf(this, AppError.prototype)
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
    }
  }

  /**
   * Cria erro genérico de servidor (500)
   *
   * @param message - Mensagem do erro
   * @returns AppError com status 500
   *
   * @example
   * throw AppError.internal('Erro ao processar requisição')
   */
  static internal(message = 'Erro interno do servidor'): AppError {
    return new AppError(message, 'INTERNAL_ERROR', 500, true)
  }

  /**
   * Cria erro de recurso não encontrado (404)
   *
   * @param resource - Nome do recurso
   * @param id - ID do recurso (opcional)
   * @returns AppError com status 404
   *
   * @example
   * throw AppError.notFound('Aluno', 'id-123')
   */
  static notFound(resource: string, id?: string): AppError {
    const message = id ? `${resource} com ID ${id} não encontrado` : `${resource} não encontrado`
    return new AppError(message, 'NOT_FOUND', 404, true)
  }

  /**
   * Cria erro de conflito/duplicação (409)
   *
   * @param message - Mensagem do erro
   * @returns AppError com status 409
   *
   * @example
   * throw AppError.conflict('Email já cadastrado')
   */
  static conflict(message: string): AppError {
    return new AppError(message, 'CONFLICT', 409, true)
  }

  /**
   * Cria erro de operação não permitida (400)
   *
   * @param message - Mensagem do erro
   * @returns AppError com status 400
   *
   * @example
   * throw AppError.badRequest('Operação não permitida neste estado')
   */
  static badRequest(message: string): AppError {
    return new AppError(message, 'BAD_REQUEST', 400, true)
  }

  /**
   * Verifica se é um erro operacional
   *
   * Erros operacionais são esperados (validação, not found, etc)
   * Erros não operacionais são inesperados (bugs, crashes, etc)
   *
   * @returns true se é erro operacional
   */
  isOperationalError(): boolean {
    return this.isOperational
  }
}
