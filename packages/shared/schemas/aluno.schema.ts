import { z } from 'zod'

export const createAlunoSchema = z.object({
  // Opcional — nem todo aluno tem e-mail (login do aluno é por CPF). Quando
  // não informado, o backend gera um e-mail sintético a partir do CPF.
  email: z.string().email('E-mail inválido').toLowerCase().trim().optional(),
  nomeCompleto: z.string({ required_error: 'Nome é obrigatório' }).min(3).max(255).trim(),
  cpf: z.string({ required_error: 'CPF é obrigatório' }).regex(/^\d{11}$/, 'CPF deve ter 11 dígitos'),
  telefone: z.string().regex(/^\d{10,11}$/).optional().nullable(),
  senha: z.string().min(6).max(128),
  planoId: z.string().uuid('ID do plano inválido').optional().nullable(),
  dataInicio: z.string().refine((d) => !isNaN(new Date(d).getTime()), 'Data inválida'),
  diaVencimento: z.coerce.number().int().min(1).max(31).optional(),
  dataNascimento: z.string().refine((d) => !isNaN(new Date(d).getTime()), 'Data inválida').optional().nullable(),
  endereco: z.string().max(255).optional().nullable(),
  cidade: z.string().max(100).optional().nullable(),
  estado: z.string().regex(/^[A-Z]{2}$/, 'UF inválida').optional().nullable(),
  cep: z.string().regex(/^\d{5}-?\d{3}$/).optional().nullable(),
  observacoes: z.string().max(2000).optional().nullable(),
})
export type CreateAlunoDTO = z.infer<typeof createAlunoSchema>

export const updateAlunoSchema = z.object({
  nomeCompleto: z.string().min(3).max(255).optional(),
  email: z.string().email('E-mail inválido').toLowerCase().trim().optional(),
  senha: z.string().min(6).max(128).optional(),
  telefone: z.string().regex(/^\d{10,11}$/).optional().nullable(),
  planoId: z.string().uuid().optional().nullable(),
  diaVencimento: z.coerce.number().int().min(1).max(31).optional(),
  dataNascimento: z.string().optional().nullable(),
  endereco: z.string().max(255).optional().nullable(),
  cidade: z.string().max(100).optional().nullable(),
  estado: z.string().regex(/^[A-Z]{2}$/).optional().nullable(),
  cep: z.string().regex(/^\d{5}-?\d{3}$/).optional().nullable(),
  observacoes: z.string().max(2000).optional().nullable(),
  status: z.enum(['ATIVO', 'INATIVO', 'SUSPENSO', 'FORMADO']).optional(),
})
export type UpdateAlunoDTO = z.infer<typeof updateAlunoSchema>

export const listAlunosSchema = z.object({
  status: z.enum(['ATIVO', 'INATIVO', 'SUSPENSO', 'FORMADO']).optional(),
  planoId: z.string().uuid().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(500).default(20),
})
export type ListAlunosDTO = z.infer<typeof listAlunosSchema>
