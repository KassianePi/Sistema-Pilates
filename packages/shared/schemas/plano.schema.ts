import { z } from 'zod'

export const createPlanoSchema = z.object({
  nome: z.string({ required_error: 'Nome é obrigatório' }).min(3).max(255).trim(),
  descricao: z.string().max(1000).optional().nullable(),
  tipo: z.enum(['MENSAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL']).default('MENSAL'),
  aulas: z.number().int().min(1).max(200),
  preco: z.number().positive().max(99999.99),
  ativo: z.boolean().default(true),
})
export type CreatePlanoDTO = z.infer<typeof createPlanoSchema>

export const updatePlanoSchema = createPlanoSchema.partial()
export type UpdatePlanoDTO = z.infer<typeof updatePlanoSchema>

export const listPlanosSchema = z.object({
  ativo: z.coerce.boolean().optional(),
  tipo: z.enum(['MENSAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})
export type ListPlanosDTO = z.infer<typeof listPlanosSchema>
