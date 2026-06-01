import { z } from 'zod'

export const createPresencaSchema = z.object({
  alunoId: z.string({ required_error: 'Aluno é obrigatório' }).uuid(),
  aulaId: z.string({ required_error: 'Aula é obrigatória' }).uuid(),
  status: z.enum(['PRESENTE', 'AUSENTE', 'FALTA_JUSTIFICADA']).default('PRESENTE'),
  dataRegistro: z.string().refine((d) => !isNaN(new Date(d).getTime()), 'Data inválida').optional(),
})
export type CreatePresencaDTO = z.infer<typeof createPresencaSchema>

export const updatePresencaSchema = z.object({
  status: z.enum(['PRESENTE', 'AUSENTE', 'FALTA_JUSTIFICADA']),
})
export type UpdatePresencaDTO = z.infer<typeof updatePresencaSchema>

export const listPresencasSchema = z.object({
  alunoId: z.string().uuid().optional(),
  aulaId: z.string().uuid().optional(),
  status: z.enum(['PRESENTE', 'AUSENTE', 'FALTA_JUSTIFICADA']).optional(),
  dataInicio: z.string().optional(),
  dataFim: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})
export type ListPresencasDTO = z.infer<typeof listPresencasSchema>
