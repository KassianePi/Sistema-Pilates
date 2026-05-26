/**
 * Schemas de Autenticação
 *
 * Validação de dados para login, register e refresh token
 * Compartilhado entre frontend e backend via @shared/schemas
 */

import { z } from 'zod'

/**
 * Schema para login
 *
 * @example
 * const data = { email: 'user@pilates.local', senha: 'senha123' }
 * const validated = loginSchema.parse(data)
 */
export const loginSchema = z.object({
  email: z
    .string({
      required_error: 'Email é obrigatório',
      invalid_type_error: 'Email deve ser uma string',
    })
    .email('Email inválido')
    .toLowerCase()
    .trim(),

  senha: z
    .string({
      required_error: 'Senha é obrigatória',
    })
    .min(6, 'Senha deve ter no mínimo 6 caracteres')
    .max(128, 'Senha muito longa'),
})

export type LoginDTO = z.infer<typeof loginSchema>

/**
 * Schema para registrar novo usuário
 *
 * @example
 * const data = {
 *   email: 'novo@pilates.local',
 *   nome: 'João Silva',
 *   senha: 'senha123',
 *   senhaConfirmacao: 'senha123'
 * }
 * const validated = registerSchema.parse(data)
 */
export const registerSchema = z
  .object({
    email: z
      .string({
        required_error: 'Email é obrigatório',
      })
      .email('Email inválido')
      .toLowerCase()
      .trim(),

    nome: z
      .string({
        required_error: 'Nome é obrigatório',
      })
      .min(3, 'Nome deve ter no mínimo 3 caracteres')
      .max(255, 'Nome muito longo'),

    senha: z
      .string({
        required_error: 'Senha é obrigatória',
      })
      .min(6, 'Senha deve ter no mínimo 6 caracteres')
      .max(128, 'Senha muito longa'),

    senhaConfirmacao: z.string({
      required_error: 'Confirmação de senha é obrigatória',
    }),

    telefone: z
      .string()
      .regex(/^\d{10,11}$/, 'Telefone deve ter 10 ou 11 dígitos')
      .optional()
      .nullable(),

    cpf: z
      .string()
      .regex(/^\d{11}$/, 'CPF deve ter 11 dígitos')
      .optional()
      .nullable(),
  })
  .refine((data) => data.senha === data.senhaConfirmacao, {
    message: 'Senhas não correspondem',
    path: ['senhaConfirmacao'],
  })

export type RegisterDTO = z.infer<typeof registerSchema>

/**
 * Schema para renovar token (refresh)
 *
 * @example
 * const data = { refreshToken: 'eyJhbGc...' }
 * const validated = refreshTokenSchema.parse(data)
 */
export const refreshTokenSchema = z.object({
  refreshToken: z
    .string({
      required_error: 'Refresh token é obrigatório',
    })
    .min(10, 'Refresh token inválido'),
})

export type RefreshTokenDTO = z.infer<typeof refreshTokenSchema>

/**
 * Schema para response de login/register
 *
 * Resposta após autenticação bem-sucedida
 */
export const authResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    usuarioId: z.string().uuid(),
    email: z.string().email(),
    nome: z.string(),
    funcao: z.enum(['ADMIN', 'PROFESSOR', 'RECEPCIONISTA', 'FINANCEIRO']),
    accessToken: z.string(),
    refreshToken: z.string(),
    expiresIn: z.number().int().positive(),
  }),
})

export type AuthResponseDTO = z.infer<typeof authResponseSchema>

/**
 * Schema para validar token JWT (apenas estrutura, não validação criptográfica)
 *
 * Use apenas para sanitação de dados antes de validação real
 */
export const tokenPayloadSchema = z.object({
  usuarioId: z.string().uuid(),
  email: z.string().email(),
  funcao: z.enum(['ADMIN', 'PROFESSOR', 'RECEPCIONISTA', 'FINANCEIRO']),
  iat: z.number().int().optional(),
  exp: z.number().int().optional(),
})

export type TokenPayloadDTO = z.infer<typeof tokenPayloadSchema>

/**
 * Schema para mudança de senha
 *
 * @example
 * const data = {
 *   senhaAtual: 'senha123',
 *   novaSenha: 'novaSenha456',
 *   novaSenhaConfirmacao: 'novaSenha456'
 * }
 */
export const changePasswordSchema = z
  .object({
    senhaAtual: z
      .string({
        required_error: 'Senha atual é obrigatória',
      })
      .min(6, 'Senha inválida'),

    novaSenha: z
      .string({
        required_error: 'Nova senha é obrigatória',
      })
      .min(6, 'Senha deve ter no mínimo 6 caracteres')
      .max(128, 'Senha muito longa'),

    novaSenhaConfirmacao: z.string({
      required_error: 'Confirmação de nova senha é obrigatória',
    }),
  })
  .refine((data) => data.novaSenha === data.novaSenhaConfirmacao, {
    message: 'Senhas não correspondem',
    path: ['novaSenhaConfirmacao'],
  })
  .refine((data) => data.senhaAtual !== data.novaSenha, {
    message: 'Nova senha deve ser diferente da atual',
    path: ['novaSenha'],
  })

export type ChangePasswordDTO = z.infer<typeof changePasswordSchema>
