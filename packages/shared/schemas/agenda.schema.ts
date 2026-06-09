import { z } from 'zod'

export const createAulaSchema = z.object({
  professorId: z.string({ required_error: 'Professor é obrigatório' }).uuid(),
  dataHoraInicio: z.string({ required_error: 'Data/hora é obrigatória' })
    .refine((d) => !isNaN(new Date(d).getTime()), 'Data/hora inválida'),
  duracao: z.number().int().min(15).max(480).default(50),
  capacidade: z.number().int().min(1).max(50).default(10),
  sala: z.string({ required_error: 'Sala é obrigatória' }).min(1).max(100),
  tipo: z.enum(['INDIVIDUAL', 'DUPLA', 'GRUPO']).default('GRUPO'),
  modalidade: z.enum(['MAT', 'APARELHOS', 'REFORMER', 'CADILLAC']).default('MAT'),
  observacoes: z.string().max(1000).optional().nullable(),
})
export type CreateAulaDTO = z.infer<typeof createAulaSchema>

export const updateAulaSchema = z.object({
  professorId: z.string().uuid().optional(),
  dataHoraInicio: z.string().refine((d) => !isNaN(new Date(d).getTime()), 'Data/hora inválida').optional(),
  duracao: z.number().int().min(15).max(480).optional(),
  capacidade: z.number().int().min(1).max(50).optional(),
  sala: z.string().min(1).max(100).optional(),
  tipo: z.enum(['INDIVIDUAL', 'DUPLA', 'GRUPO']).optional(),
  modalidade: z.enum(['MAT', 'APARELHOS', 'REFORMER', 'CADILLAC']).optional(),
  observacoes: z.string().max(1000).optional().nullable(),
  status: z.enum(['AGENDADA', 'REALIZADA', 'CANCELADA', 'ADIADA']).optional(),
})
export type UpdateAulaDTO = z.infer<typeof updateAulaSchema>

export const listAulasSchema = z.object({
  professorId: z.string().uuid().optional(),
  status: z.enum(['AGENDADA', 'REALIZADA', 'CANCELADA', 'ADIADA']).optional(),
  tipo: z.enum(['INDIVIDUAL', 'DUPLA', 'GRUPO']).optional(),
  modalidade: z.enum(['MAT', 'APARELHOS', 'REFORMER', 'CADILLAC']).optional(),
  dataInicio: z.string().optional(),
  dataFim: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})
export type ListAulasDTO = z.infer<typeof listAulasSchema>
