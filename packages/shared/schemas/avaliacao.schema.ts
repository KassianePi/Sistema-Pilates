import { z } from 'zod'

export const avaliacaoFotoSchema = z.object({
  arquivo: z.string({ required_error: 'Arquivo é obrigatório' }).min(1),
  tipoArquivo: z.string({ required_error: 'Tipo do arquivo é obrigatório' }).min(1),
})

export const createAvaliacaoSchema = z.object({
  alunoId: z.string({ required_error: 'Aluno é obrigatório' }).uuid(),
  dataAvaliacao: z
    .string({ required_error: 'Data da avaliação é obrigatória' })
    .refine((d) => !isNaN(new Date(d).getTime()), 'Data inválida'),
  peso: z.number().positive().max(999.99).optional().nullable(),
  altura: z.number().positive().max(99.99).optional().nullable(),
  medidas: z.record(z.string(), z.number()).optional().nullable(),
  queixaPrincipal: z.string().max(500).optional().nullable(),
  historicoMedico: z.string().max(10000).optional().nullable(),
  observacoesPostura: z.string().max(10000).optional().nullable(),
  observacoesGerais: z.string().max(10000).optional().nullable(),
  fotos: z.array(avaliacaoFotoSchema).max(10).optional(),
})
export type CreateAvaliacaoDTO = z.infer<typeof createAvaliacaoSchema>

export const updateAvaliacaoSchema = createAvaliacaoSchema.omit({ alunoId: true, fotos: true }).partial()
export type UpdateAvaliacaoDTO = z.infer<typeof updateAvaliacaoSchema>

export const listAvaliacoesSchema = z.object({
  alunoId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})
export type ListAvaliacoesDTO = z.infer<typeof listAvaliacoesSchema>
