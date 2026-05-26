/**
 * Schemas de Pagamento
 *
 * Validação de dados para criar, atualizar e listar pagamentos
 */

import { z } from 'zod'

/**
 * Schema para criar novo pagamento
 *
 * @example
 * const data = {
 *   alunoId: 'uuid',
 *   valor: 200.00,
 *   dataVencimento: '2026-06-26',
 *   tipo: 'MENSALIDADE',
 *   metodo: 'PIX'
 * }
 */
export const createPagamentoSchema = z.object({
  alunoId: z
    .string({
      required_error: 'ID do aluno é obrigatório',
    })
    .uuid('ID do aluno inválido'),

  valor: z
    .number({
      required_error: 'Valor é obrigatório',
    })
    .positive('Valor deve ser positivo')
    .max(999999.99, 'Valor muito alto'),

  dataVencimento: z
    .string({
      required_error: 'Data de vencimento é obrigatória',
    })
    .refine((date) => !isNaN(new Date(date).getTime()), 'Data inválida')
    .refine((date) => new Date(date) > new Date(), 'Data não pode ser no passado'),

  tipo: z
    .enum(['MENSALIDADE', 'AULA_EXTRA', 'MATERIAL', 'OUTROS'])
    .default('MENSALIDADE'),

  metodo: z
    .enum(['PIX', 'CARTAO', 'BOLETO', 'DINHEIRO', 'TRANSFERENCIA'])
    .default('PIX'),

  descricao: z
    .string()
    .max(500, 'Descrição muito longa')
    .optional()
    .nullable(),

  referencia: z
    .string()
    .max(100, 'Referência muito longa')
    .optional()
    .nullable(),
})

export type CreatePagamentoDTO = z.infer<typeof createPagamentoSchema>

/**
 * Schema para atualizar pagamento
 *
 * Apenas campos específicos podem ser atualizados
 */
export const updatePagamentoSchema = z.object({
  valor: z
    .number()
    .positive('Valor deve ser positivo')
    .max(999999.99, 'Valor muito alto')
    .optional(),

  dataVencimento: z
    .string()
    .refine((date) => !isNaN(new Date(date).getTime()), 'Data inválida')
    .optional(),

  metodo: z
    .enum(['PIX', 'CARTAO', 'BOLETO', 'DINHEIRO', 'TRANSFERENCIA'])
    .optional(),

  status: z
    .enum(['PENDENTE', 'PAGO', 'CANCELADO', 'ATRASADO'])
    .optional(),

  descricao: z
    .string()
    .max(500, 'Descrição muito longa')
    .optional()
    .nullable(),

  observacoes: z
    .string()
    .max(500, 'Observações muito longas')
    .optional()
    .nullable(),
})

export type UpdatePagamentoDTO = z.infer<typeof updatePagamentoSchema>

/**
 * Schema para confirmar pagamento recebido
 */
export const confirmarPagamentoSchema = z.object({
  dataPagamento: z
    .string()
    .refine((date) => !isNaN(new Date(date).getTime()), 'Data inválida')
    .optional(),

  metodoPagamento: z
    .enum(['PIX', 'CARTAO', 'BOLETO', 'DINHEIRO', 'TRANSFERENCIA'])
    .optional(),

  comprovante: z
    .string()
    .optional()
    .nullable(),

  observacoes: z
    .string()
    .max(500, 'Observações muito longas')
    .optional()
    .nullable(),
})

export type ConfirmarPagamentoDTO = z.infer<typeof confirmarPagamentoSchema>

/**
 * Schema para listar pagamentos com filtros
 */
export const listPagamentosSchema = z.object({
  alunoId: z
    .string()
    .uuid()
    .optional(),

  status: z
    .enum(['PENDENTE', 'PAGO', 'CANCELADO', 'ATRASADO'])
    .optional(),

  tipo: z
    .enum(['MENSALIDADE', 'AULA_EXTRA', 'MATERIAL', 'OUTROS'])
    .optional(),

  metodo: z
    .enum(['PIX', 'CARTAO', 'BOLETO', 'DINHEIRO', 'TRANSFERENCIA'])
    .optional(),

  dataInicio: z
    .string()
    .refine((date) => !isNaN(new Date(date).getTime()), 'Data inválida')
    .optional(),

  dataFim: z
    .string()
    .refine((date) => !isNaN(new Date(date).getTime()), 'Data inválida')
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
    .enum(['dataVencimento', 'valor', 'dataCriacao'])
    .default('dataVencimento'),

  ordem: z
    .enum(['asc', 'desc'])
    .default('asc'),
})

export type ListPagamentosDTO = z.infer<typeof listPagamentosSchema>

/**
 * Schema para resposta ao buscar pagamento único
 */
export const pagamentoResponseSchema = z.object({
  id: z.string().uuid(),
  alunoId: z.string().uuid(),
  aluno: z.object({
    id: z.string().uuid(),
    nome: z.string(),
    email: z.string().email(),
  }).optional(),
  valor: z.number(),
  dataVencimento: z.string(),
  dataPagamento: z.string().nullable(),
  tipo: z.enum(['MENSALIDADE', 'AULA_EXTRA', 'MATERIAL', 'OUTROS']),
  metodo: z.enum(['PIX', 'CARTAO', 'BOLETO', 'DINHEIRO', 'TRANSFERENCIA']),
  status: z.enum(['PENDENTE', 'PAGO', 'CANCELADO', 'ATRASADO']),
  descricao: z.string().nullable(),
  referencia: z.string().nullable(),
  observacoes: z.string().nullable(),
  dataCriacao: z.string().datetime(),
  dataAtualizacao: z.string().datetime(),
})

export type PagamentoResponseDTO = z.infer<typeof pagamentoResponseSchema>

/**
 * Schema para resposta ao listar pagamentos
 */
export const listPagamentosResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    pagamentos: z.array(pagamentoResponseSchema),
    total: z.number().int(),
    pagina: z.number().int(),
    limite: z.number().int(),
    totalPaginas: z.number().int(),
    resumo: z.object({
      totalPendente: z.number(),
      totalPago: z.number(),
      totalAtrasado: z.number(),
    }).optional(),
  }),
})

export type ListPagamentosResponseDTO = z.infer<typeof listPagamentosResponseSchema>
