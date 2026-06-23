import { z } from 'zod'
import { EstornosRepository } from './estornos.repository'
import { AppError, ValidationError } from '../../shared/errors'
import { logInfo } from '../../shared/utils'
import { prisma } from '../../database/prisma.client'
import { registrarLog } from '../auditoria/auditoria.service'
import { notificacoesService } from '../notificacoes/notificacoes.service'
import type { Estorno } from './estornos.types'

const solicitarSchema = z.object({
  mensalidadeId: z.string().uuid(),
  motivo: z.string().max(1000).nullable().optional(),
})

const listarSchema = z.object({
  alunoId: z.string().uuid().optional(),
  status: z.enum(['SOLICITADO', 'APROVADO', 'PROCESSADO', 'NEGADO']).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
})

export class EstornosService {
  constructor(private repository: EstornosRepository) {}

  async solicitar(usuarioId: string, data: { mensalidadeId: string; motivo?: string | null }): Promise<Estorno> {
    const validado = solicitarSchema.parse(data)

    // Resolve Aluno.id from Usuario.id — they are different UUIDs
    const aluno = await prisma.aluno.findUnique({ where: { usuarioId } })
    if (!aluno) throw new AppError('Perfil de aluno não encontrado', 'FORBIDDEN', 403)
    const alunoId = aluno.id

    const mensalidade = await prisma.mensalidade.findUnique({
      where: { id: validado.mensalidadeId },
      include: { plano: true },
    })
    if (!mensalidade) throw ValidationError.forField('mensalidadeId', 'Mensalidade não encontrada')
    if (String(mensalidade.alunoId) !== alunoId)
      throw new AppError('Mensalidade não pertence a este aluno', 'FORBIDDEN', 403)
    if (mensalidade.status !== 'PAGO' && mensalidade.status !== 'PARCIAL') {
      throw AppError.badRequest('Apenas mensalidades pagas podem ser estornadas')
    }

    const estornoExistente = await this.repository.findByMensalidade(validado.mensalidadeId)
    if (estornoExistente) throw AppError.conflict('Já existe uma solicitação de estorno para esta mensalidade')

    const diasContratados = mensalidade.plano?.aulas ?? 1

    const inicioMes = new Date(mensalidade.mesReferencia)
    inicioMes.setDate(1)
    const fimMes = new Date(inicioMes.getFullYear(), inicioMes.getMonth() + 1, 0, 23, 59, 59)

    const diasComparecidos = await prisma.presenca.count({
      where: {
        alunoId,
        status: 'PRESENTE',
        dataRegistro: { gte: inicioMes, lte: fimMes },
      } as any,
    })

    const diasEstornados = Math.max(0, diasContratados - diasComparecidos)
    const valorBase = Number(mensalidade.valor) - Number(mensalidade.desconto)
    const valorEstorno = diasContratados > 0 ? (diasEstornados / diasContratados) * valorBase : 0

    const estorno = await this.repository.create({
      mensalidadeId: validado.mensalidadeId,
      alunoId,
      diasContratados,
      diasComparecidos,
      diasEstornados,
      valorEstorno: Math.round(valorEstorno * 100) / 100,
      motivo: validado.motivo ?? null,
    })

    // Notificar todos os admins ativos sobre a solicitação de estorno
    const nomeAluno =
      (await prisma.usuario.findUnique({ where: { id: usuarioId }, select: { nomeCompleto: true } }))?.nomeCompleto ??
      'Aluno'
    const admins = await prisma.usuario.findMany({ where: { funcao: 'ADMIN', status: 'ATIVO' }, select: { id: true } })
    const valorFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(estorno.valorEstorno)
    await Promise.all(
      admins.map((admin) =>
        prisma.notificacao.create({
          data: {
            usuarioId: admin.id,
            tipo: 'MENSAGEM_ADMIN',
            titulo: `Solicitação de reembolso — ${nomeAluno}`,
            mensagem: `${nomeAluno} solicitou um reembolso proporcional no valor de ${valorFmt} (${diasEstornados} aula(s) não utilizada(s)). Acesse Financeiro > Reembolsos para analisar.`,
          } as any,
        }),
      ),
    )

    logInfo('Estorno solicitado', { id: estorno.id, alunoId, valorEstorno: estorno.valorEstorno })
    return estorno
  }

  async listar(params: { alunoId?: string; status?: string; page?: number; limit?: number }) {
    const validado = listarSchema.parse(params)
    const { estornos, total } = await this.repository.findAll(validado)
    return {
      estornos,
      total,
      page: validado.page,
      limit: validado.limit,
      totalPages: Math.ceil(total / validado.limit),
    }
  }

  async buscarPorId(id: string): Promise<Estorno> {
    const estorno = await this.repository.findById(id)
    if (!estorno) throw AppError.notFound('Estorno', id)
    return estorno
  }

  async aprovar(id: string, aprovadoPorId: string): Promise<Estorno> {
    const estorno = await this.buscarPorId(id)
    if (estorno.status !== 'SOLICITADO') throw AppError.badRequest('Apenas estornos solicitados podem ser aprovados')

    const atualizado = await this.repository.updateStatus(id, 'APROVADO', aprovadoPorId)

    await registrarLog({
      usuarioId: aprovadoPorId,
      acao: 'UPDATE',
      entidade: 'Estorno',
      entidadeId: id,
      dadosNovos: { status: 'APROVADO' },
    })
    logInfo('Estorno aprovado', { id, aprovadoPorId })
    await this.notificarAluno(
      atualizado.alunoId,
      'Reembolso aprovado',
      `Seu pedido de reembolso de ${this.fmt(atualizado.valorEstorno)} foi aprovado e será processado em breve.`,
    )
    return atualizado
  }

  async negar(id: string, aprovadoPorId: string): Promise<Estorno> {
    const estorno = await this.buscarPorId(id)
    if (estorno.status !== 'SOLICITADO') throw AppError.badRequest('Apenas estornos solicitados podem ser negados')

    const atualizado = await this.repository.updateStatus(id, 'NEGADO', aprovadoPorId)

    await registrarLog({
      usuarioId: aprovadoPorId,
      acao: 'UPDATE',
      entidade: 'Estorno',
      entidadeId: id,
      dadosNovos: { status: 'NEGADO' },
    })
    logInfo('Estorno negado', { id, aprovadoPorId })
    await this.notificarAluno(
      atualizado.alunoId,
      'Reembolso negado',
      `Seu pedido de reembolso de ${this.fmt(atualizado.valorEstorno)} foi analisado e não pôde ser aprovado. Em caso de dúvidas, fale com o studio.`,
    )
    return atualizado
  }

  async marcarProcessado(id: string, aprovadoPorId: string): Promise<Estorno> {
    const estorno = await this.buscarPorId(id)
    if (estorno.status !== 'APROVADO')
      throw AppError.badRequest('Apenas estornos aprovados podem ser marcados como processados')

    const atualizado = await this.repository.updateStatus(id, 'PROCESSADO', aprovadoPorId)
    logInfo('Estorno processado', { id })
    await this.notificarAluno(
      atualizado.alunoId,
      'Reembolso concluído',
      `O reembolso de ${this.fmt(atualizado.valorEstorno)} foi processado. O valor já deve constar na sua conta/forma de pagamento.`,
    )
    return atualizado
  }

  private fmt(valor: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)
  }

  /** Notifica o aluno (resolve usuarioId a partir do Aluno.id) — falha silenciosa */
  private async notificarAluno(alunoId: string, titulo: string, mensagem: string): Promise<void> {
    try {
      const aluno = await prisma.aluno.findUnique({ where: { id: alunoId }, select: { usuarioId: true } })
      if (!aluno) return
      await notificacoesService.criar({ usuarioId: aluno.usuarioId, tipo: 'ESTORNO_ATUALIZADO', titulo, mensagem })
    } catch {
      /* silencioso */
    }
  }
}

export const estornosService = new EstornosService(new EstornosRepository())
