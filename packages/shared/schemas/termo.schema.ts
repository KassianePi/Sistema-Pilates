import { z } from 'zod'

/** Criação de uma nova versão (rascunho) do termo — apenas ADMIN. */
export const criarTermoSchema = z.object({
  titulo: z.string({ required_error: 'Título é obrigatório' }).min(3, 'Título muito curto').max(255),
  conteudo: z.string({ required_error: 'Conteúdo é obrigatório' }).min(20, 'Conteúdo muito curto'),
})
export type CriarTermoDTO = z.infer<typeof criarTermoSchema>

/** Edição de uma versão ainda não publicada (rascunho) — apenas ADMIN. */
export const editarTermoSchema = z.object({
  titulo: z.string().min(3, 'Título muito curto').max(255).optional(),
  conteudo: z.string().min(20, 'Conteúdo muito curto').optional(),
})
export type EditarTermoDTO = z.infer<typeof editarTermoSchema>
