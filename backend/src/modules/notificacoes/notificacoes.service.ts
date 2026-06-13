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

  async notificarAdmins(titulo: string, mensagem: string): Promise<void> {
    const { prisma } = await import('../../database/prisma.client')
    const admins = await prisma.usuario.findMany({ where: { funcao: 'ADMIN', status: 'ATIVO' }, select: { id: true } })
    await Promise.all(admins.map(admin =>
      this.repository.create({
        usuarioId: admin.id,
        tipo: 'MENSAGEM_ADMIN',
        titulo,
        mensagem,
      })
    ))
  }
}

export const notificacoesService = new NotificacoesService(new NotificacoesRepository())

// Listeners de eventos
eventBus.on('pagamento.realizado', async (data: { alunoId: string; valor: number }) => {
  try {
    const { prisma } = await import('../../database/prisma.client')
    const aluno = await prisma.aluno.findUnique({ where: { id: data.alunoId } })
    if (!aluno) return
    const valorFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.valor)
    await notificacoesService.criar({
      usuarioId: aluno.usuarioId,
      tipo: 'PAGAMENTO_CONFIRMADO',
      titulo: 'Pagamento confirmado',
      mensagem: `Recebemos o seu pagamento de ${valorFmt}. Obrigado!`,
    })
  } catch { /* silencioso */ }
})

eventBus.on('mensalidade.vencida', async (data: { mensalidadeId: string; usuarioId: string; dataVencimento: Date }) => {
  try {
    const dataFmt = new Date(data.dataVencimento).toLocaleDateString('pt-BR')
    await notificacoesService.criar({
      usuarioId: data.usuarioId,
      tipo: 'PAGAMENTO_VENCIDO',
      titulo: 'Mensalidade vencida',
      mensagem: `Sua mensalidade com vencimento em ${dataFmt} está em atraso. Regularize o pagamento e envie o comprovante pelo portal.`,
    })
  } catch { /* silencioso */ }
})

// Observação: a notificação de cancelamento/suspensão/reagendamento/exclusão de aula
// (com a justificativa) é emitida diretamente pelo AgendaService.notificarEnvolvidos,
// que tem o contexto do motivo. O evento 'aula.cancelada' permanece disponível para
// outros consumidores futuros, mas não dispara notificação genérica aqui (evita duplicidade).
