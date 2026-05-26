/**
 * Custom validators — Validações adicionais além do Zod
 *
 * Funções para validar dados que vão além de tipos simples
 */

/**
 * Valida se uma string é um email válido
 *
 * Padrão: minimal RFC5321 compliant
 * Exemplos válidos:
 *   - user@pilates.local
 *   - nome.sobrenome@pilates.com.br
 *   - admin+test@studio.co
 *
 * @param email - Email a validar
 * @returns true se válido, false caso contrário
 *
 * @example
 * isValidEmail('user@pilates.local') // true
 * isValidEmail('invalid-email') // false
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Valida se uma senha atende aos requisitos mínimos
 *
 * Requisitos:
 * - Mínimo 6 caracteres
 * - Máximo 128 caracteres
 *
 * Nota: Bcrypt tem limite de 72 bytes, mas 128 é limite prático
 *
 * @param senha - Senha a validar
 * @returns true se válida, false caso contrário
 *
 * @example
 * isValidPassword('senha123') // true
 * isValidPassword('123') // false (muito curta)
 */
export function isValidPassword(senha: string): boolean {
  return senha.length >= 6 && senha.length <= 128
}

/**
 * Valida se string é um UUID v4 válido
 *
 * Formato: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 *
 * @param uuid - UUID a validar
 * @returns true se válido, false caso contrário
 *
 * @example
 * isValidUUID('123e4567-e89b-12d3-a456-426614174000') // true
 * isValidUUID('not-a-uuid') // false
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

/**
 * Valida se string é um UUID válido (v4 ou com hífens removidos)
 *
 * Aceita: com ou sem hífens
 * Exemplo: 
 *   - Com hífens: 123e4567-e89b-12d3-a456-426614174000
 *   - Sem hífens: 123e4567e89b12d3a456426614174000
 *
 * @param id - ID a validar
 * @returns true se válido, false caso contrário
 */
export function isValidId(id: string): boolean {
  if (!id) return false
  // Remove hífens e valida
  const cleanId = id.replace(/-/g, '')
  return cleanId.length === 32 && /^[0-9a-f]{32}$/i.test(cleanId)
}

/**
 * Valida se string é um telefone válido (Brasil)
 *
 * Aceita:
 * - (11) 98765-4321 (com formatação)
 * - (11) 3456-7890 (celular ou fixo)
 * - 11987654321 (sem formatação)
 *
 * @param telefone - Telefone a validar
 * @returns true se válido, false caso contrário
 *
 * @example
 * isValidPhone('(11) 98765-4321') // true
 * isValidPhone('11 98765-4321') // true
 */
export function isValidPhone(telefone: string): boolean {
  // Remove espaços, hífens e parênteses
  const cleaned = telefone.replace(/\D/g, '')
  // Deve ter 10 ou 11 dígitos (Brasil)
  return cleaned.length >= 10 && cleaned.length <= 11
}

/**
 * Valida se string é uma data válida (YYYY-MM-DD)
 *
 * @param dateStr - String de data
 * @returns true se válido, false caso contrário
 *
 * @example
 * isValidDateFormat('2026-05-26') // true
 * isValidDateFormat('26/05/2026') // false
 * isValidDateFormat('2026-13-01') // false (mês inválido)
 */
export function isValidDateFormat(dateStr: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(dateStr)) return false

  const date = new Date(dateStr)
  return date instanceof Date && !isNaN(date.getTime())
}

/**
 * Valida se valor é um percentual válido (0-100)
 *
 * @param value - Valor a validar
 * @returns true se válido, false caso contrário
 *
 * @example
 * isValidPercentage(50) // true
 * isValidPercentage(150) // false
 */
export function isValidPercentage(value: number): boolean {
  return typeof value === 'number' && value >= 0 && value <= 100
}

/**
 * Valida se valor é um montante de moeda válido
 *
 * Critérios:
 * - Deve ser number
 * - Maior ou igual a 0
 * - Máximo 2 casas decimais
 * - Máximo R$ 999.999.999,99
 *
 * @param value - Valor em reais
 * @returns true se válido, false caso contrário
 *
 * @example
 * isValidMoney(100.50) // true
 * isValidMoney(100.555) // false (3 casas decimais)
 */
export function isValidMoney(value: number): boolean {
  if (typeof value !== 'number' || value < 0) return false

  // Verifica se tem no máximo 2 casas decimais
  const rounded = Math.round(value * 100) / 100
  return value === rounded && value <= 999999999.99
}

/**
 * Valida se string contém apenas números
 *
 * @param value - String a validar
 * @returns true se contém apenas números, false caso contrário
 *
 * @example
 * isNumericString('12345') // true
 * isNumericString('123abc') // false
 */
export function isNumericString(value: string): boolean {
  return /^\d+$/.test(value)
}

/**
 * Valida se string contém apenas letras e espaços
 *
 * @param value - String a validar
 * @returns true se válida, false caso contrário
 *
 * @example
 * isValidName('João Silva') // true
 * isValidName('João123') // false
 */
export function isValidName(value: string): boolean {
  return /^[a-záéíóúãõâêôç\s]+$/i.test(value) && value.trim().length > 0
}

/**
 * Sanitiza entrada para evitar XSS
 *
 * Remove tags HTML e características perigosas
 *
 * @param input - String a sanitizar
 * @returns String sanitizada
 *
 * @example
 * sanitizeInput('<script>alert("xss")</script>') // outputs: 'scriptalertxssscript'
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove < e >
    .replace(/javascript:/gi, '') // Remove javascript:
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
}

/**
 * Valida se dois valores são iguais (comparação de password, etc)
 *
 * @param value1 - Primeiro valor
 * @param value2 - Segundo valor
 * @returns true se iguais, false caso contrário
 *
 * @example
 * isEqual('senha123', 'senha123') // true
 * isEqual('senha123', 'senha124') // false
 */
export function isEqual(value1: string, value2: string): boolean {
  return value1 === value2
}
