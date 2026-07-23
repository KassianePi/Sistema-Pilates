import { Prisma, type OrigemExecucaoJob, type StatusExecucaoJob } from '@prisma/client'
import { prisma } from '../../database/prisma.client'
import { AppError } from '../../shared/errors'
import { logError } from '../../shared/utils'
import type {
  AlunoElegivel,
  CriarSeNaoExisteResultado,
  DadosNovaMensalidade,
  DetalheErro,
  DetalheIgnorado,
  ExecucaoEmAndamento,
  MensalidadeParaGeracaoImediata,
} from './mensalidades-automaticas.types'

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
}

export class MensalidadesAutomaticasRepository {
  // ===================== LOCK DE EXECUÇÃO ÚNICA =====================

  /**
   * Adquire (ou renova, se expirado) o lock de execução única. Não usa
   * GET_LOCK() do MySQL — locks nomeados são presos à conexão que os obteve,
   * e o Prisma usa um pool, então RELEASE_LOCK poderia nunca rodar na mesma
   * conexão. Uma tabela com lease/expiração funciona normalmente com o pool.
   */
  async adquirirLock(chave: string, ttlMs: number, origem: OrigemExecucaoJob): Promise<boolean> {
    const agora = new Date()
    const expiraEm = new Date(agora.getTime() + ttlMs)

    const renovado = await prisma.jobLock.updateMany({
      where: { chave, expiraEm: { lt: agora } },
      data: { travadoEm: agora, expiraEm, origem },
    })
    if (renovado.count > 0) return true

    try {
      await prisma.jobLock.create({ data: { chave, travadoEm: agora, expiraEm, origem } })
      return true
    } catch (error) {
      if (isUniqueConstraintError(error)) return false // outro processo já segura o lock, ainda válido
      logError('Erro ao adquirir lock de geração automática', error as Error, { chave })
      throw AppError.internal('Erro ao adquirir lock de geração automática')
    }
  }

  async liberarLock(chave: string): Promise<void> {
    await prisma.jobLock.deleteMany({ where: { chave } })
  }

  // ===================== ALUNOS ELEGÍVEIS (paginado) =====================

  async contarAlunosElegiveis(): Promise<number> {
    return prisma.aluno.count({ where: { status: 'ATIVO', planoId: { not: null } } })
  }

  async buscarLoteAlunosElegiveis(cursorId: string | undefined, limite: number): Promise<AlunoElegivel[]> {
    const alunos = await prisma.aluno.findMany({
      where: { status: 'ATIVO', planoId: { not: null } },
      orderBy: { id: 'asc' },
      take: limite,
      ...(cursorId && { cursor: { id: cursorId }, skip: 1 }),
      select: {
        id: true,
        usuarioId: true,
        diaVencimento: true,
        planoAtual: { select: { id: true, tipo: true, preco: true } },
        mensalidades: {
          where: { tipo: 'MENSAL' },
          orderBy: { mesReferencia: 'desc' },
          take: 1,
          select: { mesReferencia: true },
        },
      },
    })
    return alunos as AlunoElegivel[]
  }

  /** Conta mensalidades MENSAL futuras (>= competenciaAtual) por aluno, em uma única query agregada — evita N+1. */
  async contarMensalidadesFuturasEmLote(alunoIds: string[], competenciaAtual: Date): Promise<Map<string, number>> {
    if (alunoIds.length === 0) return new Map()
    const grupos = await prisma.mensalidade.groupBy({
      by: ['alunoId'],
      where: { alunoId: { in: alunoIds }, tipo: 'MENSAL', mesReferencia: { gte: competenciaAtual } },
      _count: { id: true },
    })
    return new Map(grupos.map((g) => [g.alunoId, g._count.id]))
  }

  // ===================== CRIAÇÃO IDEMPOTENTE =====================

  /**
   * Cria a mensalidade se ainda não existir para o mesmo aluno/competência/tipo.
   * Pré-check barato (findFirst) para permitir logging claro do motivo, mas a
   * garantia real é a constraint única (alunoId, mesReferencia, tipo) — em
   * caso de corrida (P2002), retorna criada:false em vez de lançar erro.
   */
  async criarSeNaoExiste(data: DadosNovaMensalidade): Promise<CriarSeNaoExisteResultado> {
    const existente = await prisma.mensalidade.findFirst({
      where: { alunoId: data.alunoId, mesReferencia: data.mesReferencia, tipo: 'MENSAL' },
      select: { id: true },
    })
    if (existente) return { criada: false, mensalidadeId: null }

    try {
      const mensalidade = await prisma.mensalidade.create({
        data: {
          alunoId: data.alunoId,
          planoId: data.planoId,
          tipo: 'MENSAL',
          mesReferencia: data.mesReferencia,
          dataVencimento: data.dataVencimento,
          valor: data.valor,
          status: 'PENDENTE',
        },
      })
      return { criada: true, mensalidadeId: mensalidade.id }
    } catch (error) {
      if (isUniqueConstraintError(error)) return { criada: false, mensalidadeId: null }
      logError('Erro ao criar mensalidade automática', error as Error, { alunoId: data.alunoId })
      throw AppError.internal('Erro ao criar mensalidade automática')
    }
  }

  /**
   * Carrega só o necessário para gerar a próxima competência a partir de UMA
   * mensalidade específica que acabou de ser paga (gatilho imediato de
   * pagamento, não o job periódico — por isso não passa pelo filtro de
   * "alunos elegíveis" nem pelo lote).
   */
  async buscarMensalidadeParaGeracaoImediata(mensalidadeId: string): Promise<MensalidadeParaGeracaoImediata | null> {
    return prisma.mensalidade.findUnique({
      where: { id: mensalidadeId },
      select: {
        tipo: true,
        mesReferencia: true,
        aluno: {
          select: {
            id: true,
            usuarioId: true,
            status: true,
            diaVencimento: true,
            planoAtual: { select: { id: true, tipo: true, preco: true } },
          },
        },
      },
    })
  }

  // ===================== HISTÓRICO DE EXECUÇÃO =====================

  async criarExecucao(params: {
    origem: OrigemExecucaoJob
    executadoPorId?: string | null
    totalAlunosElegiveis: number
    iniciadoEm: Date
  }): Promise<string> {
    const execucao = await prisma.execucaoJobMensalidades.create({
      data: {
        origem: params.origem,
        status: 'EM_ANDAMENTO',
        dryRun: false,
        executadoPorId: params.executadoPorId ?? null,
        iniciadoEm: params.iniciadoEm,
        totalAlunosElegiveis: params.totalAlunosElegiveis,
        detalhesIgnorados: [],
        erros: [],
      },
    })
    return execucao.id
  }

  async atualizarProgressoExecucao(
    id: string,
    incremento: { alunosAnalisados: number; mensalidadesCriadas: number; alunosIgnorados: number },
  ): Promise<void> {
    await prisma.execucaoJobMensalidades.update({
      where: { id },
      data: {
        alunosAnalisados: { increment: incremento.alunosAnalisados },
        mensalidadesCriadas: { increment: incremento.mensalidadesCriadas },
        alunosIgnorados: { increment: incremento.alunosIgnorados },
      },
    })
  }

  async finalizarExecucao(
    id: string,
    params: {
      status: StatusExecucaoJob
      detalhesIgnorados: DetalheIgnorado[]
      erros: DetalheErro[]
      finalizadoEm: Date
      duracaoMs: number
    },
  ): Promise<void> {
    await prisma.execucaoJobMensalidades.update({
      where: { id },
      data: {
        status: params.status,
        detalhesIgnorados: params.detalhesIgnorados as any,
        erros: params.erros as any,
        finalizadoEm: params.finalizadoEm,
        duracaoMs: params.duracaoMs,
      },
    })
  }

  async buscarExecucaoEmAndamento(): Promise<ExecucaoEmAndamento | null> {
    const execucao = await prisma.execucaoJobMensalidades.findFirst({
      where: { status: 'EM_ANDAMENTO' },
      orderBy: { iniciadoEm: 'desc' },
      select: {
        id: true,
        origem: true,
        totalAlunosElegiveis: true,
        alunosAnalisados: true,
        mensalidadesCriadas: true,
        alunosIgnorados: true,
        iniciadoEm: true,
      },
    })
    return execucao
  }
}

export const mensalidadesAutomaticasRepository = new MensalidadesAutomaticasRepository()
