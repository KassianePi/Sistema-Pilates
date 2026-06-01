import { RelatoriosRepository } from './relatorios.repository'
import { AppError, ValidationError } from '../../shared/errors'
import { logInfo } from '../../shared/utils'
import { createRelatorioSchema, listRelatoriosSchema } from '../../shared/schemas'
import { prisma } from '../../database/prisma.client'
import type { Relatorio } from './relatorios.types'

export class RelatoriosService {
  constructor(private repository: RelatoriosRepository) {}

  async gerar(data: { professorId: string; tipo: string; titulo: string; descricao?: string | null; dataPeriodoInicio: string; dataPeriodoFim: string }): Promise<Relatorio> {
    const validado = createRelatorioSchema.parse(data)

    const professor = await prisma.professor.findUnique({ where: { id: validado.professorId } })
    if (!professor) throw ValidationError.forField('professorId', 'Professor não encontrado')

    const inicio = new Date(validado.dataPeriodoInicio)
    const fim = new Date(validado.dataPeriodoFim)

    const conteudo = await this.gerarConteudo(validado.tipo as any, { inicio, fim, professorId: validado.professorId })

    const relatorio = await this.repository.create({
      professorId: validado.professorId,
      tipo: validado.tipo as any,
      titulo: validado.titulo,
      descricao: validado.descricao,
      dataPeriodoInicio: inicio,
      dataPeriodoFim: fim,
      conteudo: JSON.stringify(conteudo),
    })

    logInfo('Relatório gerado', { id: relatorio.id, tipo: relatorio.tipo })
    return relatorio
  }

  private async gerarConteudo(tipo: string, params: { inicio: Date; fim: Date; professorId: string }): Promise<object> {
    const { inicio, fim } = params

    switch (tipo) {
      case 'FREQUENCIA': {
        const presencas = await prisma.presenca.groupBy({
          by: ['status'],
          where: { dataRegistro: { gte: inicio, lte: fim } } as any,
          _count: { id: true },
        })
        return { presencas, periodo: { inicio, fim } }
      }
      case 'FINANCEIRO': {
        const pagamentos = await prisma.pagamento.findMany({
          where: { dataPagamento: { gte: inicio, lte: fim } } as any,
          select: { valor: true, metodo: true, dataPagamento: true },
        })
        const total = pagamentos.reduce((acc, p) => acc + parseFloat(p.valor.toString()), 0)
        return { pagamentos: pagamentos.length, totalArrecadado: total, periodo: { inicio, fim } }
      }
      case 'RECEITA_MENSAL': {
        const mensalidades = await prisma.mensalidade.findMany({
          where: { mesReferencia: { gte: inicio, lte: fim } },
          select: { valor: true, desconto: true, status: true },
        })
        const totalBruto = mensalidades.reduce((acc, m) => acc + parseFloat(m.valor.toString()), 0)
        const totalDesconto = mensalidades.reduce((acc, m) => acc + parseFloat(m.desconto.toString()), 0)
        return { totalMensalidades: mensalidades.length, totalBruto, totalDesconto, totalLiquido: totalBruto - totalDesconto, periodo: { inicio, fim } }
      }
      case 'PENDENCIAS_PAGAMENTO': {
        const pendencias = await prisma.mensalidade.count({ where: { status: { in: ['PENDENTE', 'VENCIDO'] } } })
        return { totalPendencias: pendencias, periodo: { inicio, fim } }
      }
      default:
        return { periodo: { inicio, fim } }
    }
  }

  async buscarPorId(id: string): Promise<Relatorio> {
    const relatorio = await this.repository.findById(id)
    if (!relatorio) throw AppError.notFound('Relatório', id)
    return relatorio
  }

  async listar(params: { professorId?: string; tipo?: string; dataInicio?: string; dataFim?: string; page?: number; limit?: number }) {
    const validado = listRelatoriosSchema.parse(params)
    const { relatorios, total } = await this.repository.findAll({
      professorId: validado.professorId,
      tipo: validado.tipo,
      dataInicio: validado.dataInicio ? new Date(validado.dataInicio) : undefined,
      dataFim: validado.dataFim ? new Date(validado.dataFim) : undefined,
      page: validado.page,
      limit: validado.limit,
    })
    return { relatorios, total, page: validado.page, limit: validado.limit, totalPages: Math.ceil(total / validado.limit) }
  }
}

export const relatoriosService = new RelatoriosService(new RelatoriosRepository())
