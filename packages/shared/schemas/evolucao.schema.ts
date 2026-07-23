import { z } from 'zod'

export const createEvolucaoSchema = z.object({
  alunoId: z.string({ required_error: 'Aluno é obrigatório' }).uuid(),
  aulaId: z.string({ required_error: 'Aula é obrigatória' }).uuid(),
  observacao: z.string({ required_error: 'Observação é obrigatória' }).min(1).max(10000),
})
export type CreateEvolucaoDTO = z.infer<typeof createEvolucaoSchema>

export const updateEvolucaoSchema = z.object({
  observacao: z.string().min(1).max(10000),
})
export type UpdateEvolucaoDTO = z.infer<typeof updateEvolucaoSchema>

export const listEvolucoesSchema = z.object({
  alunoId: z.string().uuid().optional(),
  aulaId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})
export type ListEvolucoesDTO = z.infer<typeof listEvolucoesSchema>
