import { z } from 'zod'

// Caixa
export const abrirCaixaSchema = z.object({
  saldoAbertura: z.number().min(0),
  observacoes: z.string().max(1000).optional().nullable(),
})
export type AbrirCaixaDTO = z.infer<typeof abrirCaixaSchema>

export const fecharCaixaSchema = z.object({
  saldoFechamento: z.number().min(0),
  observacoes: z.string().max(1000).optional().nullable(),
})
export type FecharCaixaDTO = z.infer<typeof fecharCaixaSchema>

// Mensalidade
export const createMensalidadeSchema = z.object({
  alunoId: z.string({ required_error: 'Aluno é obrigatório' }).uuid(),
  planoId: z.string({ required_error: 'Plano é obrigatório' }).uuid(),
  mesReferencia: z.string().refine((d) => !isNaN(new Date(d).getTime()), 'Data inválida'),
  dataVencimento: z.string().refine((d) => !isNaN(new Date(d).getTime()), 'Data inválida'),
  valor: z.number().positive(),
  desconto: z.number().min(0).default(0),
  observacoes: z.string().max(1000).optional().nullable(),
})
export type CreateMensalidadeDTO = z.infer<typeof createMensalidadeSchema>

export const updateMensalidadeSchema = z.object({
  dataVencimento: z.string().refine((d) => !isNaN(new Date(d).getTime())).optional(),
  valor: z.number().positive().optional(),
  desconto: z.number().min(0).optional(),
  status: z.enum(['PENDENTE', 'PARCIAL', 'PAGO', 'VENCIDO', 'CANCELADO']).optional(),
  observacoes: z.string().max(1000).optional().nullable(),
})
export type UpdateMensalidadeDTO = z.infer<typeof updateMensalidadeSchema>

export const listMensalidadesSchema = z.object({
  alunoId: z.string().uuid().optional(),
  planoId: z.string().uuid().optional(),
  status: z.enum(['PENDENTE', 'PARCIAL', 'PAGO', 'VENCIDO', 'CANCELADO']).optional(),
  dataInicio: z.string().optional(),
  dataFim: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})
export type ListMensalidadesDTO = z.infer<typeof listMensalidadesSchema>

// Pagamento
export const createPagamentoSchema = z.object({
  mensalidadeId: z.string({ required_error: 'Mensalidade é obrigatória' }).uuid(),
  caixaId: z.string({ required_error: 'Caixa é obrigatório' }).uuid(),
  valor: z.number({ required_error: 'Valor é obrigatório' }).positive(),
  metodo: z.enum(['DINHEIRO', 'PIX', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'CHEQUE', 'TRANSFERENCIA']).default('PIX'),
  dataPagamento: z.string().refine((d) => !isNaN(new Date(d).getTime()), 'Data inválida').optional(),
  referencia: z.string().max(255).optional().nullable(),
  observacoes: z.string().max(1000).optional().nullable(),
})
export type CreatePagamentoDTO = z.infer<typeof createPagamentoSchema>

export const listPagamentosSchema = z.object({
  mensalidadeId: z.string().uuid().optional(),
  caixaId: z.string().uuid().optional(),
  metodo: z.enum(['DINHEIRO', 'PIX', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'CHEQUE', 'TRANSFERENCIA']).optional(),
  dataInicio: z.string().optional(),
  dataFim: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})
export type ListPagamentosDTO = z.infer<typeof listPagamentosSchema>
