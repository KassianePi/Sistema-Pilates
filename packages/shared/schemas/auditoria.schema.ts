import { z } from 'zod'

export const listAuditoriaSchema = z.object({
  usuarioId: z.string().uuid().optional(),
  acao: z.enum(['CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT']).optional(),
  entidade: z.string().optional(),
  dataInicio: z.string().optional(),
  dataFim: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})
export type ListAuditoriaDTO = z.infer<typeof listAuditoriaSchema>
