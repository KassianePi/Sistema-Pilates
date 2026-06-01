import { z } from 'zod'

export const createNotificacaoSchema = z.object({
  usuarioId: z.string({ required_error: 'Usuário é obrigatório' }).uuid(),
  tipo: z.enum(['AULA_AGENDADA', 'PAGAMENTO_VENCIDO', 'PRESENCA_REGISTRADA', 'REPOSICAO_OFERECIDA', 'MENSAGEM_ADMIN']),
  titulo: z.string({ required_error: 'Título é obrigatório' }).min(1).max(255),
  mensagem: z.string({ required_error: 'Mensagem é obrigatória' }).min(1),
})
export type CreateNotificacaoDTO = z.infer<typeof createNotificacaoSchema>

export const listNotificacoesSchema = z.object({
  usuarioId: z.string().uuid().optional(),
  status: z.enum(['NAO_LIDA', 'LIDA', 'ARQUIVADA']).optional(),
  tipo: z.enum(['AULA_AGENDADA', 'PAGAMENTO_VENCIDO', 'PRESENCA_REGISTRADA', 'REPOSICAO_OFERECIDA', 'MENSAGEM_ADMIN']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})
export type ListNotificacoesDTO = z.infer<typeof listNotificacoesSchema>
