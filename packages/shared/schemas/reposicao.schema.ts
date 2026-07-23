import { z } from 'zod'

export const solicitarReposicaoSchema = z.object({
  aulaOriginalId: z.string({ required_error: 'Aula original é obrigatória' }).uuid(),
  motivo: z.string({ required_error: 'Motivo é obrigatório' }).min(3).max(255),
})
export type SolicitarReposicaoDTO = z.infer<typeof solicitarReposicaoSchema>

export const agendarReposicaoSchema = z.object({
  aulaReposicaoId: z.string({ required_error: 'Aula de reposição é obrigatória' }).uuid(),
})
export type AgendarReposicaoDTO = z.infer<typeof agendarReposicaoSchema>

export const listReposicoesSchema = z.object({
  alunoId: z.string().uuid().optional(),
  status: z.enum(['PENDENTE', 'AGENDADA', 'REALIZADA', 'CANCELADA']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})
export type ListReposicoesDTO = z.infer<typeof listReposicoesSchema>
