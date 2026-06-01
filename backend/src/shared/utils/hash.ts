/**
 * Hash utilities — Bcrypt para segurança de senhas
 *
 * Utiliza bcryptjs com 10 rounds de salt para hash irreversível
 * Seguro contra rainbow tables e força bruta
 */

import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 10

/**
 * Gera hash seguro de uma senha
 *
 * @param senha - Senha em texto plano
 * @returns Promise com hash bcrypt (irreversível)
 * @throws Error se falhar ao gerar hash
 *
 * @example
 * const hash = await hashPassword('minha-senha-123')
 * // hash: '$2a$10$N9qo8uLOickgx2ZMRZoMye...'
 */
export async function hashPassword(senha: string): Promise<string> {
  if (!senha || typeof senha !== 'string') {
    throw new Error('Senha deve ser uma string não-vazia')
  }

  if (senha.length < 6) {
    throw new Error('Senha deve ter no mínimo 6 caracteres')
  }

  try {
    const hash = await bcrypt.hash(senha, SALT_ROUNDS)
    return hash
  } catch (error) {
    throw new Error(`Erro ao gerar hash da senha: ${error instanceof Error ? error.message : 'Desconhecido'}`)
  }
}

/**
 * Verifica se uma senha corresponde ao seu hash
 *
 * @param senha - Senha em texto plano
 * @param senhaHash - Hash bcrypt armazenado
 * @returns Promise<boolean> - true se senha bate com hash
 * @throws Error se falhar na comparação
 *
 * @example
 * const match = await verifyPassword('minha-senha-123', '$2a$10$N9qo8uLOickgx2ZMRZoMye...')
 * if (match) {
 *   console.log('Senha correta!')
 * }
 */
export async function verifyPassword(senha: string, senhaHash: string): Promise<boolean> {
  if (!senha || typeof senha !== 'string') {
    throw new Error('Senha deve ser uma string não-vazia')
  }

  if (!senhaHash || typeof senhaHash !== 'string') {
    throw new Error('Hash da senha deve ser uma string não-vazia')
  }

  try {
    const match = await bcrypt.compare(senha, senhaHash)
    return match
  } catch (error) {
    throw new Error(`Erro ao verificar senha: ${error instanceof Error ? error.message : 'Desconhecido'}`)
  }
}

/**
 * Gera uma senha aleatória (útil para resets)
 *
 * @returns Senha aleatória de 12 caracteres
 *
 * @example
 * const senhaTemporaria = generateRandomPassword()
 * // '4kM9pL2xN7qR'
 */
export function generateRandomPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*'
  let senha = ''

  for (let i = 0; i < 12; i++) {
    senha += chars.charAt(Math.floor(Math.random() * chars.length))
  }

  return senha
}
