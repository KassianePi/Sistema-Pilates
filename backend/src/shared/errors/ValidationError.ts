/**
 * ValidationError — Erro de validação de dados
 *
 * Lançado quando dados de entrada não passam na validação Zod
 */

export class ValidationError extends Error {
  readonly code = 'VALIDATION_ERROR'
  readonly statusCode = 400
  readonly details: Array<{
    field: string
    message: string
    value?: any
  }> = []

  constructor(
    message: string,
    details?: Array<{
      field: string
      message: string
      value?: any
    }>,
  ) {
    super(message)
    this.name = 'ValidationError'

    if (details) {
      this.details = details
    }

    Object.setPrototypeOf(this, ValidationError.prototype)
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
      details: this.details,
    }
  }

  /**
   * Cria instância a partir de erro Zod
   *
   * @param zodError - Erro do Zod
   * @returns ValidationError com detalhes parseados
   *
   * @example
   * try {
   *   schema.parse(data)
   * } catch (error) {
   *   throw ValidationError.fromZod(error as ZodError)
   * }
   */
  static fromZod(zodError: any): ValidationError {
    const details =
      zodError.errors?.map((err: any) => ({
        field: err.path?.join('.') || 'unknown',
        message: err.message,
        value: err.received,
      })) || []

    return new ValidationError('Dados inválidos', details)
  }

  /**
   * Cria instância com um campo específico
   *
   * @param field - Nome do campo
   * @param message - Mensagem de erro
   * @param value - Valor rejeitado (opcional)
   * @returns ValidationError
   *
   * @example
   * throw ValidationError.forField('email', 'Email inválido', 'invalid@')
   */
  static forField(field: string, message: string, value?: any): ValidationError {
    return new ValidationError(`Validação falhou: ${field}`, [{ field, message, value }])
  }
}
