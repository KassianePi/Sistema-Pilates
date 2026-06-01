import { NotificacoesRepository } from './notificacoes.repository'
import { AppError } from '../../shared/errors'
import { logInfo } from '../../shared/utils'
import { createNotificacaoSchema, listNotificacoesSchema } from '../../shared/schemas'
import { eventBus } from '../../events/event-bus'
import type { Notificacao, CreateNotificacaoData } from './notificacoes.types'

export class NotificacoesService {
  constructor(private repository: NotificacoesRepository) {}

  async criar(data: CreateNotificacaoData): Promise<Notificacao> {
    const validado = createNotificacaoSchema.parse(data)
    const notificacao = await this.repository.create({
      usuarioId: validado.usuarioId,
      tipo: validado.tipo as any,
      titulo: validado.titulo,
      mensagem: validado.mensagem,
    })
    logInfo('Notificação criada', { id: notificacao.id, usuarioId: validado.usuarioId })
    return notificacao
  }

  async listar(usuarioId: string, params: { status?: string; tipo?: string; page?: number; limit?: number }) {
    const validado = listNotificacoesSchema.parse({ ...params, usuarioId })
    const { notificacoes, total } = await this.repository.findAll({
      usuarioId,
      status: validado.status,
      tipo: validado.tipo,
      page: validado.page,
      limit: validado.limit,
    })
    const naoLidas = await this.repository.countNaoLidas(usuarioId)
    return { notificacoes, total, naoLidas, page: validado.page, limit: validado.limit, totalPages: Math.ceil(total / validado.limit) }
  }

  async marcarComoLida(id: string, usuarioId: string): Promise<Notificacao> {
    const notificacao = await this.repository.findById(id)
    if (!notificacao) throw AppError.notFound('Notificação', id)
    if (notificacao.usuarioId !== usuarioId) throw AppError.badRequest('Sem permissão para esta notificação')
    return this.repository.marcarComoLida(id)
  }

  async arquivar(id: string, usuarioId: string): Promise<Notificacao> {
    const notificacao = await this.repository.findById(id)
    if (!notificacao) throw AppError.notFound('Notificação', id)
    if (notificacao.usuarioId !== usuarioId) throw AppError.badRequest('Sem permissão para esta notificação')
    return this.repository.arquivar(id)
  }
}

export const notificacoesService = new NotificacoesService(new NotificacoesRepository())

// Listeners de eventos
eventBus.on('pagamento.realizado', async (data: { alunoId: string; valor: number }) => {
  try {
    const { prisma } = await import('../../database/prisma.client')
    const aluno = await prisma.aluno.findUnique({ where: { id: data.alunoId } })
    if (!aluno) return
    await notificacoesService.criar({
      usuarioId: aluno.usuarioId,
      tipo: 'PRESENCA_REGISTRADA',
      titulo: 'Pagamento confirmado',
      mensagem: `Pagamento de R$ ${data.valor.toFixed(2)} registrado com sucesso.`,
    })
  } catch { /* silencioso */ }
})

eventBus.on('aula.cancelada', async (data: { id: string }) => {
  try {
    const { prisma } = await import('../../database/prisma.client')
    const presencas = await prisma.presenca.findMany({ where: { aulaId: data.id } as any, include: { aluno: true } })
    for (const presenca of presencas) {
      await notificacoesService.criar({
        usuarioId: presenca.aluno.usuarioId,
        tipo: 'AULA_AGENDADA',
        titulo: 'Aula cancelada',
        mensagem: 'Uma aula que você estava inscrito foi cancelada.',
      })
    }
  } catch { /* silencioso */ }
})
