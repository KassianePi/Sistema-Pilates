/**
 * Schemas de Aluno
 *
 * Validação de dados para criar, atualizar e listar alunos
 */

import { z } from 'zod'

/**
 * Schema para criar novo aluno
 *
 * @example
 * const data = {
 *   nome: 'Maria Silva',
 *   email: 'maria@example.com',
 *   telefone: '11987654321',
 *   cpf: '12345678901',
 *   dataNascimento: '1990-05-15',
 *   endereco: 'Rua X, 123',
 *   planoId: 'plano-uuid'
 * }
 */
export const createAlunoSchema = z.object({
  nome: z
    .string({
      required_error: 'Nome é obrigatório',
    })
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(255, 'Nome muito longo')
    .trim(),

  email: z
    .string({
      required_error: 'Email é obrigatório',
    })
    .email('Email inválido')
    .toLowerCase()
    .trim(),

  telefone: z
    .string({
      required_error: 'Telefone é obrigatório',
    })
    .regex(/^\d{10,11}$/, 'Telefone deve ter 10 ou 11 dígitos'),

  cpf: z
    .string()
    .regex(/^\d{11}$/, 'CPF deve ter 11 dígitos')
    .optional()
    .nullable(),

  dataNascimento: z
    .string({
      required_error: 'Data de nascimento é obrigatória',
    })
    .refine((date) => !isNaN(new Date(date).getTime()), 'Data inválida')
    .refine((date) => {
      const birth = new Date(date)
      const today = new Date()
      return birth < today && today.getFullYear() - birth.getFullYear() >= 18
    }, 'Aluno deve ter no mínimo 18 anos'),

  endereco: z
    .string()
    .min(3, 'Endereço deve ter no mínimo 3 caracteres')
    .optional()
    .nullable(),

  cidade: z
    .string()
    .min(2, 'Cidade deve ter no mínimo 2 caracteres')
    .optional()
    .nullable(),

  estado: z
    .string()
    .regex(/^[A-Z]{2}$/, 'Estado inválido')
    .optional()
    .nullable(),

  cep: z
    .string()
    .regex(/^\d{5}-?\d{3}$/, 'CEP inválido')
    .optional()
    .nullable(),

  planoId: z
    .string({
      required_error: 'Plano é obrigatório',
    })
    .uuid('ID do plano inválido'),

  nomePagador: z
    .string()
    .min(3, 'Nome do pagador deve ter no mínimo 3 caracteres')
    .optional()
    .nullable(),

  cpfPagador: z
    .string()
    .regex(/^\d{11}$/, 'CPF do pagador inválido')
    .optional()
    .nullable(),

  ativo: z.boolean().default(true),

  obs: z
    .string()
    .max(500, 'Observações muito longas')
    .optional()
    .nullable(),
})

export type CreateAlunoDTO = z.infer<typeof createAlunoSchema>

/**
 * Schema para atualizar aluno
 *
 * Todos os campos são opcionais (PATCH)
 */
export const updateAlunoSchema = createAlunoSchema.partial()

export type UpdateAlunoDTO = z.infer<typeof updateAlunoSchema>

/**
 * Schema para listar alunos com filtros
 *
 * @example
 * const filters = { funcao: 'ATIVO', planoId: 'uuid', search: 'Maria' }
 */
export const listAlunosSchema = z.object({
  search: z
    .string()
    .optional(),

  planoId: z
    .string()
    .uuid()
    .optional(),

  ativo: z
    .boolean()
    .optional(),

  limite: z
    .number()
    .int()
    .min(1)
    .max(100)
    .default(20),

  pagina: z
    .number()
    .int()
    .min(1)
    .default(1),

  ordenarPor: z
    .enum(['nome', 'dataCriacao', 'dataAtualizacao'])
    .default('dataCriacao'),

  ordem: z
    .enum(['asc', 'desc'])
    .default('desc'),
})

export type ListAlunosDTO = z.infer<typeof listAlunosSchema>

/**
 * Schema para resposta ao buscar aluno único
 */
export const alunoResponseSchema = z.object({
  id: z.string().uuid(),
  nome: z.string(),
  email: z.string().email(),
  telefone: z.string(),
  cpf: z.string().nullable(),
  dataNascimento: z.string(),
  endereco: z.string().nullable(),
  cidade: z.string().nullable(),
  estado: z.string().nullable(),
  cep: z.string().nullable(),
  planoId: z.string().uuid(),
  plano: z.object({
    id: z.string().uuid(),
    nome: z.string(),
    aulasDisponiveis: z.number().int(),
  }).optional(),
  nomePagador: z.string().nullable(),
  cpfPagador: z.string().nullable(),
  ativo: z.boolean(),
  obs: z.string().nullable(),
  dataCriacao: z.string().datetime(),
  dataAtualizacao: z.string().datetime(),
})

export type AlunoResponseDTO = z.infer<typeof alunoResponseSchema>

/**
 * Schema para resposta ao listar alunos
 */
export const listAlunosResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    alunos: z.array(alunoResponseSchema),
    total: z.number().int(),
    pagina: z.number().int(),
    limite: z.number().int(),
    totalPaginas: z.number().int(),
  }),
})

export type ListAlunosResponseDTO = z.infer<typeof listAlunosResponseSchema>
