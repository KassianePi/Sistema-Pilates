import { z } from 'zod'

export const createRelatorioSchema = z.object({
  professorId: z.string({ required_error: 'Professor é obrigatório' }).uuid(),
  tipo: z.enum(['FREQUENCIA', 'FINANCEIRO', 'PRESENCA_ALUNO', 'RECEITA_MENSAL', 'PENDENCIAS_PAGAMENTO']),
  titulo: z.string({ required_error: 'Título é obrigatório' }).min(3).max(255),
  descricao: z.string().max(1000).optional().nullable(),
  dataPeriodoInicio: z.string().refine((d) => !isNaN(new Date(d).getTime()), 'Data inválida'),
  dataPeriodoFim: z.string().refine((d) => !isNaN(new Date(d).getTime()), 'Data inválida'),
})
export type CreateRelatorioDTO = z.infer<typeof createRelatorioSchema>

export const listRelatoriosSchema = z.object({
  professorId: z.string().uuid().optional(),
  tipo: z.enum(['FREQUENCIA', 'FINANCEIRO', 'PRESENCA_ALUNO', 'RECEITA_MENSAL', 'PENDENCIAS_PAGAMENTO']).optional(),
  dataInicio: z.string().optional(),
  dataFim: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})
export type ListRelatoriosDTO = z.infer<typeof listRelatoriosSchema>
