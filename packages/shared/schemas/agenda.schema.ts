/**
 * Schemas de Agenda (Aulas)
 *
 * Validação de dados para criar, atualizar e listar aulas na agenda
 */

import { z } from 'zod'

/**
 * Schema para criar nova aula
 *
 * @example
 * const data = {
 *   professorId: 'uuid',
 *   dataHora: '2026-06-01T10:00:00Z',
 *   duracao: 60,
 *   capacidade: 10,
 *   tipo: 'AULA_GRUPO',
 *   modalidade: 'PILATES_MAT'
 * }
 */
export const createAulaSchema = z.object({
  professorId: z
    .string({
      required_error: 'ID do professor é obrigatório',
    })
    .uuid('ID do professor inválido'),

  dataHora: z
    .string({
      required_error: 'Data e hora são obrigatórias',
    })
    .refine((date) => !isNaN(new Date(date).getTime()), 'Data/hora inválida')
    .refine((date) => new Date(date) > new Date(), 'Aula não pode ser no passado'),

  duracao: z
    .number({
      required_error: 'Duração é obrigatória',
    })
    .int('Duração deve ser um número inteiro')
    .min(15, 'Aula deve ter no mínimo 15 minutos')
    .max(180, 'Aula não pode exceder 180 minutos'),

  capacidade: z
    .number({
      required_error: 'Capacidade é obrigatória',
    })
    .int('Capacidade deve ser um número inteiro')
    .min(1, 'Capacidade mínima é 1')
    .max(50, 'Capacidade máxima é 50'),

  tipo: z
    .enum(['AULA_GRUPO', 'AULA_INDIVIDUAL', 'AULA_DUPLA'])
    .default('AULA_GRUPO'),

  modalidade: z
    .enum(['PILATES_MAT', 'PILATES_APARELHOS', 'REFORMER', 'CADILLAC'])
    .default('PILATES_MAT'),

  descricao: z
    .string()
    .max(500, 'Descrição muito longa')
    .optional()
    .nullable(),

  local: z
    .string()
    .max(255, 'Local muito longo')
    .optional()
    .nullable(),

  ativa: z.boolean().default(true),
})

export type CreateAulaDTO = z.infer<typeof createAulaSchema>

/**
 * Schema para atualizar aula
 *
 * Todos os campos são opcionais (PATCH)
 */
export const updateAulaSchema = createAulaSchema.partial()

export type UpdateAulaDTO = z.infer<typeof updateAulaSchema>

/**
 * Schema para inscrever aluno em aula
 */
export const inscreverAlunoSchema = z.object({
  alunoId: z
    .string({
      required_error: 'ID do aluno é obrigatório',
    })
    .uuid('ID do aluno inválido'),

  comparecimento: z
    .enum(['CONFIRMADO', 'CANCELADO', 'PENDENTE'])
    .default('CONFIRMADO'),
})

export type InscreverAlunoDTO = z.infer<typeof inscreverAlunoSchema>

/**
 * Schema para marcar presença
 */
export const marcarPresencaSchema = z.object({
  alunoId: z
    .string({
      required_error: 'ID do aluno é obrigatório',
    })
    .uuid('ID do aluno inválido'),

  presente: z
    .boolean({
      required_error: 'Status de presença é obrigatório',
    }),

  observacoes: z
    .string()
    .max(500, 'Observações muito longas')
    .optional()
    .nullable(),
})

export type MarcarPresencaDTO = z.infer<typeof marcarPresencaSchema>

/**
 * Schema para listar aulas com filtros
 */
export const listAulasSchema = z.object({
  professorId: z
    .string()
    .uuid()
    .optional(),

  modalidade: z
    .enum(['PILATES_MAT', 'PILATES_APARELHOS', 'REFORMER', 'CADILLAC'])
    .optional(),

  tipo: z
    .enum(['AULA_GRUPO', 'AULA_INDIVIDUAL', 'AULA_DUPLA'])
    .optional(),

  dataInicio: z
    .string()
    .refine((date) => !isNaN(new Date(date).getTime()), 'Data inválida')
    .optional(),

  dataFim: z
    .string()
    .refine((date) => !isNaN(new Date(date).getTime()), 'Data inválida')
    .optional(),

  ativa: z
    .boolean()
    .optional(),

  limite: z
    .number()
    .int()
    .min(1)
    .max(100)
    .default(20),

  pagina: z
    .number()
    .int()
    .min(1)
    .default(1),

  ordenarPor: z
    .enum(['dataHora', 'duracao', 'capacidade'])
    .default('dataHora'),

  ordem: z
    .enum(['asc', 'desc'])
    .default('asc'),
})

export type ListAulasDTO = z.infer<typeof listAulasSchema>

/**
 * Schema para resposta ao buscar aula única
 */
export const aulaResponseSchema = z.object({
  id: z.string().uuid(),
  professorId: z.string().uuid(),
  professor: z.object({
    id: z.string().uuid(),
    nome: z.string(),
    email: z.string().email(),
  }).optional(),
  dataHora: z.string().datetime(),
  duracao: z.number().int(),
  capacidade: z.number().int(),
  inscricoes: z.number().int(),
  tipo: z.enum(['AULA_GRUPO', 'AULA_INDIVIDUAL', 'AULA_DUPLA']),
  modalidade: z.enum(['PILATES_MAT', 'PILATES_APARELHOS', 'REFORMER', 'CADILLAC']),
  descricao: z.string().nullable(),
  local: z.string().nullable(),
  ativa: z.boolean(),
  dataCriacao: z.string().datetime(),
  dataAtualizacao: z.string().datetime(),
})

export type AulaResponseDTO = z.infer<typeof aulaResponseSchema>

/**
 * Schema para resposta ao listar aulas
 */
export const listAulasResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    aulas: z.array(aulaResponseSchema),
    total: z.number().int(),
    pagina: z.number().int(),
    limite: z.number().int(),
    totalPaginas: z.number().int(),
  }),
})

export type ListAulasResponseDTO = z.infer<typeof listAulasResponseSchema>
