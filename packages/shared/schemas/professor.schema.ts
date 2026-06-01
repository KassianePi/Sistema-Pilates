import { z } from 'zod'

export const createProfessorSchema = z.object({
  email: z.string({ required_error: 'Email é obrigatório' }).email().toLowerCase().trim(),
  nomeCompleto: z.string({ required_error: 'Nome é obrigatório' }).min(3).max(255).trim(),
  cpf: z.string({ required_error: 'CPF é obrigatório' }).regex(/^\d{11}$/, 'CPF deve ter 11 dígitos'),
  telefone: z.string().regex(/^\d{10,11}$/).optional().nullable(),
  senha: z.string().min(6).max(128),
  especialidade: z.string().max(255).optional().nullable(),
  bio: z.string().max(2000).optional().nullable(),
})
export type CreateProfessorDTO = z.infer<typeof createProfessorSchema>

export const updateProfessorSchema = z.object({
  nomeCompleto: z.string().min(3).max(255).optional(),
  telefone: z.string().regex(/^\d{10,11}$/).optional().nullable(),
  especialidade: z.string().max(255).optional().nullable(),
  bio: z.string().max(2000).optional().nullable(),
  status: z.enum(['ATIVO', 'INATIVO', 'LICENCA']).optional(),
})
export type UpdateProfessorDTO = z.infer<typeof updateProfessorSchema>

export const listProfessoresSchema = z.object({
  status: z.enum(['ATIVO', 'INATIVO', 'LICENCA']).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})
export type ListProfessoresDTO = z.infer<typeof listProfessoresSchema>
