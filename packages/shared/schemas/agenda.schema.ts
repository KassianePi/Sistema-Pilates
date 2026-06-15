import { z } from 'zod'

export const createAulaSchema = z.object({
  professorId: z.string({ required_error: 'Professor é obrigatório' }).uuid(),
  dataHoraInicio: z.string({ required_error: 'Data/hora é obrigatória' })
    .refine((d) => !isNaN(new Date(d).getTime()), 'Data/hora inválida'),
  duracao: z.number().int().min(15).max(480).default(50),
  capacidade: z.number().int().min(1).max(50).default(10),
  sala: z.string({ required_error: 'Sala é obrigatória' }).min(1).max(100),
  tipo: z.enum(['INDIVIDUAL', 'DUPLA', 'GRUPO']).default('GRUPO'),
  categoria: z.enum(['GERAL', 'SOB_DEMANDA']).default('GERAL'),
  modalidadeId: z.string().uuid().optional().nullable(),
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
  categoria: z.enum(['GERAL', 'SOB_DEMANDA']).optional(),
  modalidadeId: z.string().uuid().optional().nullable(),
  observacoes: z.string().max(1000).optional().nullable(),
  status: z.enum(['AGENDADA', 'REALIZADA', 'CANCELADA', 'ADIADA', 'SUSPENSA', 'EXCLUIDA']).optional(),
})
export type UpdateAulaDTO = z.infer<typeof updateAulaSchema>

// Ações de agenda que exigem justificativa (suspender / cancelar / excluir)
export const justificativaAulaSchema = z.object({
  justificativa: z.string({ required_error: 'Justificativa é obrigatória' })
    .min(5, 'Descreva o motivo (mín. 5 caracteres)')
    .max(1000, 'Justificativa muito longa'),
})
export type JustificativaAulaDTO = z.infer<typeof justificativaAulaSchema>

// Reagendamento: nova data/hora + justificativa obrigatória
export const reagendarAulaSchema = justificativaAulaSchema.extend({
  dataHoraInicio: z.string({ required_error: 'Data/hora é obrigatória' })
    .refine((d) => !isNaN(new Date(d).getTime()), 'Data/hora inválida'),
})
export type ReagendarAulaDTO = z.infer<typeof reagendarAulaSchema>

// Matrícula: define o conjunto de alunos inscritos na aula
export const matricularAulaSchema = z.object({
  alunoIds: z.array(z.string().uuid()),
})
export type MatricularAulaDTO = z.infer<typeof matricularAulaSchema>

export const listAulasSchema = z.object({
  professorId: z.string().uuid().optional(),
  status: z.enum(['AGENDADA', 'REALIZADA', 'CANCELADA', 'ADIADA', 'SUSPENSA', 'EXCLUIDA']).optional(),
  tipo: z.enum(['INDIVIDUAL', 'DUPLA', 'GRUPO']).optional(),
  categoria: z.enum(['GERAL', 'SOB_DEMANDA']).optional(),
  modalidadeId: z.string().uuid().optional(),
  dataInicio: z.string().optional(),
  dataFim: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})
export type ListAulasDTO = z.infer<typeof listAulasSchema>
