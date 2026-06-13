import { prisma } from '../../database/prisma.client'
import { AppError } from '../../shared/errors'
import { logError } from '../../shared/utils'

export class AcompanhamentoRepository {
  /**
   * Lista alunos ativos já com os dados necessários para as métricas:
   * presenças da janela e mensalidades em aberto. Uma única query (sem N+1).
   */
  async findAlunosAtivosComDados(janelaInicio: Date) {
    try {
      return await prisma.aluno.findMany({
        where: { status: 'ATIVO' },
        select: {
          id: true,
          dataInicio: true,
          status: true,
          usuario: { select: { nomeCompleto: true, email: true } },
          planoAtual: { select: { nome: true } },
          presencas: {
            where: { dataRegistro: { gte: janelaInicio } },
            select: { status: true, dataRegistro: true },
          },
          mensalidades: {
            where: { status: { in: ['PENDENTE', 'VENCIDO', 'PARCIAL'] } },
            select: { status: true, dataVencimento: true },
          },
        },
        orderBy: { criadoEm: 'desc' },
      })
    } catch (error) {
      logError('Erro ao listar alunos para acompanhamento', error as Error)
      throw AppError.internal('Erro ao carregar acompanhamento')
    }
  }

  /** Mapa alunoId → data da última presença (status PRESENTE), via agregação agrupada. */
  async findUltimasPresencas(): Promise<Map<string, Date>> {
    try {
      const grupos = await prisma.presenca.groupBy({
        by: ['alunoId'],
        where: { status: 'PRESENTE' },
        _max: { dataRegistro: true },
      })
      const mapa = new Map<string, Date>()
      for (const g of grupos) {
        if (g._max.dataRegistro) mapa.set(g.alunoId, g._max.dataRegistro)
      }
      return mapa
    } catch (error) {
      logError('Erro ao agregar últimas presenças', error as Error)
      throw AppError.internal('Erro ao carregar acompanhamento')
    }
  }

  async findDetalheAluno(id: string) {
    try {
      return await prisma.aluno.findUnique({
        where: { id },
        select: {
          id: true,
          dataInicio: true,
          status: true,
          usuario: { select: { nomeCompleto: true, email: true, telefone: true } },
          planoAtual: { select: { nome: true } },
          presencas: {
            select: {
              id: true, status: true, dataRegistro: true,
              aula: { select: { dataHoraInicio: true, sala: true } },
            },
            orderBy: { dataRegistro: 'desc' },
            take: 50,
          },
          mensalidades: {
            select: {
              id: true, status: true, valor: true, dataVencimento: true,
              plano: { select: { nome: true } },
            },
            orderBy: { dataVencimento: 'desc' },
            take: 24,
          },
        },
      })
    } catch (error) {
      logError('Erro ao buscar detalhe do aluno', error as Error, { id })
      throw AppError.internal('Erro ao carregar aluno')
    }
  }

  async findProximasAulas(alunoId: string) {
    try {
      return await prisma.aula.findMany({
        where: {
          presencas: { some: { alunoId } },
          status: 'AGENDADA',
          dataHoraInicio: { gte: new Date() },
        } as any,
        select: { id: true, dataHoraInicio: true, sala: true, status: true },
        orderBy: { dataHoraInicio: 'asc' },
        take: 10,
      })
    } catch (error) {
      logError('Erro ao buscar próximas aulas do aluno', error as Error, { alunoId })
      throw AppError.internal('Erro ao carregar aulas do aluno')
    }
  }
}

export const acompanhamentoRepository = new AcompanhamentoRepository()
