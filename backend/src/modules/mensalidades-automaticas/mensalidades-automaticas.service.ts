import type { OrigemExecucaoJob, StatusExecucaoJob } from '@prisma/client'
import { MensalidadesAutomaticasRepository } from './mensalidades-automaticas.repository'
import { ConfiguracaoRepository } from '../configuracao/configuracao.repository'
import { eventBus } from '../../events/event-bus'
import {
  logInfo,
  logWarn,
  logError,
  inicioDoMes,
  adicionarMeses,
  construirDataComDia,
  subtrairDias,
} from '../../shared/utils'
import { MESES_POR_TIPO_PLANO, LOCK_CHAVE, LOCK_TTL_MS, TAMANHO_LOTE } from './mensalidades-automaticas.constants'
import type {
  AlunoElegivel,
  DetalheErro,
  DetalheIgnorado,
  MotivoIgnorado,
  ResumoExecucao,
} from './mensalidades-automaticas.types'

interface OpcoesExecucao {
  executadoPorId?: string
  dryRun?: boolean
}

interface ResultadoProcessamentoAluno {
  criada: boolean
  motivo?: MotivoIgnorado
}

function calcularStatus(errosCount: number, mensalidadesCriadas: number, alunosIgnorados: number): StatusExecucaoJob {
  if (errosCount === 0) return 'SUCESSO'
  if (mensalidadesCriadas > 0 || alunosIgnorados > 0) return 'PARCIAL'
  return 'ERRO'
}

export class MensalidadesAutomaticasService {
  constructor(
    private repository: MensalidadesAutomaticasRepository,
    private configuracaoRepository: ConfiguracaoRepository,
  ) {}

  /**
   * Ponto único de regra de negócio da geração automática — chamado tanto
   * pelo job agendado (origem CRON) quanto pelo endpoint manual (origem
   * MANUAL), sem nenhuma duplicação de lógica entre os dois caminhos.
   */
  async executarGeracao(origem: OrigemExecucaoJob, opcoes: OpcoesExecucao = {}): Promise<ResumoExecucao> {
    const dryRun = opcoes.dryRun ?? false
    const iniciadoEm = new Date()

    const config = await this.configuracaoRepository.find()
    if (!config?.geracaoAutomaticaAtiva) {
      logInfo('Geração automática de mensalidades desativada nas configurações — execução ignorada')
      return this.resumoVazio(origem, dryRun, iniciadoEm)
    }

    const lockObtido = await this.repository.adquirirLock(LOCK_CHAVE, LOCK_TTL_MS, origem)
    if (!lockObtido) {
      logInfo('Geração automática de mensalidades: já existe uma execução em andamento, pulando')
      return this.resumoVazio(origem, dryRun, iniciadoEm)
    }

    let execucaoId: string | null = null
    try {
      const totalAlunosElegiveis = await this.repository.contarAlunosElegiveis()
      if (!dryRun) {
        execucaoId = await this.repository.criarExecucao({
          origem,
          executadoPorId: opcoes.executadoPorId,
          totalAlunosElegiveis,
          iniciadoEm,
        })
      }

      let alunosAnalisados = 0
      let mensalidadesCriadas = 0
      let alunosIgnorados = 0
      const detalhesIgnorados: DetalheIgnorado[] = []
      const erros: DetalheErro[] = []

      const hoje = new Date()
      const competenciaAtual = inicioDoMes(hoje)

      let cursorId: string | undefined
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const lote = await this.repository.buscarLoteAlunosElegiveis(cursorId, TAMANHO_LOTE)
        if (lote.length === 0) break

        const alunoIds = lote.map((a) => a.id)
        const mapaFuturas = await this.repository.contarMensalidadesFuturasEmLote(alunoIds, competenciaAtual)

        let loteCriadas = 0
        let loteIgnorados = 0

        for (const aluno of lote) {
          try {
            const resultado = await this.processarAluno(
              aluno,
              {
                diasAntesGeracao: config.diasAntesGeracao,
                maximoMensalidadesFuturas: config.maximoMensalidadesFuturas,
              },
              hoje,
              competenciaAtual,
              mapaFuturas,
              dryRun,
            )
            if (resultado.criada) {
              loteCriadas++
            } else {
              loteIgnorados++
              detalhesIgnorados.push({ alunoId: aluno.id, motivo: resultado.motivo! })
            }
          } catch (error) {
            erros.push({ alunoId: aluno.id, mensagem: error instanceof Error ? error.message : String(error) })
            logError('Erro ao gerar mensalidade automática para aluno', error as Error, { alunoId: aluno.id })
          }
        }

        alunosAnalisados += lote.length
        mensalidadesCriadas += loteCriadas
        alunosIgnorados += loteIgnorados

        if (!dryRun && execucaoId) {
          await this.repository.atualizarProgressoExecucao(execucaoId, {
            alunosAnalisados: lote.length,
            mensalidadesCriadas: loteCriadas,
            alunosIgnorados: loteIgnorados,
          })
        }

        cursorId = lote[lote.length - 1].id
      }

      const finalizadoEm = new Date()
      const duracaoMs = finalizadoEm.getTime() - iniciadoEm.getTime()
      const status = calcularStatus(erros.length, mensalidadesCriadas, alunosIgnorados)

      if (!dryRun && execucaoId) {
        await this.repository.finalizarExecucao(execucaoId, {
          status,
          detalhesIgnorados,
          erros,
          finalizadoEm,
          duracaoMs,
        })
        eventBus.emit('mensalidade-automatica.execucao-finalizada', {
          execucaoId,
          origem,
          status,
          alunosAnalisados,
          mensalidadesCriadas,
          alunosIgnorados,
          erros: erros.length,
        })
      }

      logInfo('Geração automática de mensalidades concluída', {
        origem,
        dryRun,
        status,
        totalAlunosElegiveis,
        alunosAnalisados,
        mensalidadesCriadas,
        alunosIgnorados,
        erros: erros.length,
        duracaoMs,
      })

      return {
        id: execucaoId,
        origem,
        status,
        dryRun,
        totalAlunosElegiveis,
        alunosAnalisados,
        mensalidadesCriadas,
        alunosIgnorados,
        detalhesIgnorados,
        erros,
        duracaoMs,
        iniciadoEm,
        finalizadoEm,
      }
    } finally {
      await this.repository.liberarLock(LOCK_CHAVE)
    }
  }

  async buscarStatusExecucaoAtual() {
    return this.repository.buscarExecucaoEmAndamento()
  }

  /**
   * Gatilho imediato: chamado logo após uma mensalidade ser confirmada como
   * paga (pagamento manual, aprovação de comprovante ou baixa via gateway) —
   * cria a mensalidade do mês seguinte na hora, sem esperar a janela de
   * `diasAntesGeracao` do job periódico. `criarSeNaoExiste` garante
   * idempotência caso o job agendado já tenha gerado a mesma competência.
   */
  async gerarProximaAposPagamento(mensalidadeId: string): Promise<void> {
    const mensalidade = await this.repository.buscarMensalidadeParaGeracaoImediata(mensalidadeId)
    if (!mensalidade || mensalidade.tipo !== 'MENSAL') return

    const { aluno } = mensalidade
    if (aluno.status !== 'ATIVO' || !aluno.planoAtual) return

    const intervalo = MESES_POR_TIPO_PLANO[aluno.planoAtual.tipo] ?? 1
    const competenciaAlvo = inicioDoMes(adicionarMeses(mensalidade.mesReferencia, intervalo))
    const dataVencimentoAlvo = construirDataComDia(
      competenciaAlvo.getFullYear(),
      competenciaAlvo.getMonth(),
      aluno.diaVencimento,
    )
    const valor = Number(aluno.planoAtual.preco)

    const resultado = await this.repository.criarSeNaoExiste({
      alunoId: aluno.id,
      planoId: aluno.planoAtual.id,
      mesReferencia: competenciaAlvo,
      dataVencimento: dataVencimentoAlvo,
      valor,
    })

    if (!resultado.criada) return

    eventBus.emit('mensalidade.gerada', {
      mensalidadeId: resultado.mensalidadeId,
      alunoId: aluno.id,
      usuarioId: aluno.usuarioId,
      valor,
      competencia: competenciaAlvo,
    })
    logInfo('Próxima mensalidade gerada imediatamente após pagamento', {
      alunoId: aluno.id,
      mensalidadeId: resultado.mensalidadeId,
      competencia: competenciaAlvo,
    })
  }

  private async processarAluno(
    aluno: AlunoElegivel,
    config: { diasAntesGeracao: number; maximoMensalidadesFuturas: number },
    hoje: Date,
    competenciaAtual: Date,
    mapaFuturas: Map<string, number>,
    dryRun: boolean,
  ): Promise<ResultadoProcessamentoAluno> {
    if (!aluno.planoAtual) {
      return { criada: false, motivo: 'SEM_PLANO' }
    }

    const ultima = aluno.mensalidades[0]
    if (!ultima) {
      logWarn('Aluno ativo com plano mas sem mensalidade base — pulado pela geração automática', {
        alunoId: aluno.id,
      })
      eventBus.emit('mensalidade-automatica.aluno-ignorado', { alunoId: aluno.id, motivo: 'SEM_BASELINE' })
      return { criada: false, motivo: 'SEM_BASELINE' }
    }

    const intervalo = MESES_POR_TIPO_PLANO[aluno.planoAtual.tipo] ?? 1
    const competenciaEsperada = inicioDoMes(adicionarMeses(ultima.mesReferencia, intervalo))
    // Nunca "recupera" competências passadas: se o aluno ficou um tempo sem
    // gerar (suspensão/gap), ancora direto na competência atual.
    const competenciaAlvo = competenciaEsperada < competenciaAtual ? competenciaAtual : competenciaEsperada

    const dataVencimentoAlvo = construirDataComDia(
      competenciaAlvo.getFullYear(),
      competenciaAlvo.getMonth(),
      aluno.diaVencimento,
    )
    const dataLimiteParaGerar = subtrairDias(dataVencimentoAlvo, config.diasAntesGeracao)
    if (hoje < dataLimiteParaGerar) {
      return { criada: false, motivo: 'AINDA_NAO_ELEGIVEL' }
    }

    const futurasExistentes = mapaFuturas.get(aluno.id) ?? 0
    if (futurasExistentes >= config.maximoMensalidadesFuturas) {
      eventBus.emit('mensalidade-automatica.aluno-ignorado', { alunoId: aluno.id, motivo: 'LIMITE_FUTURAS_ATINGIDO' })
      return { criada: false, motivo: 'LIMITE_FUTURAS_ATINGIDO' }
    }

    // Preço lido ao vivo do plano atual — nunca copiado da mensalidade
    // anterior. É o que faz a troca de plano valer a partir da próxima
    // competência gerada, sem tocar nas mensalidades já existentes.
    const valor = Number(aluno.planoAtual.preco)

    if (dryRun) {
      return { criada: true }
    }

    const resultado = await this.repository.criarSeNaoExiste({
      alunoId: aluno.id,
      planoId: aluno.planoAtual.id,
      mesReferencia: competenciaAlvo,
      dataVencimento: dataVencimentoAlvo,
      valor,
    })

    if (!resultado.criada) {
      return { criada: false, motivo: 'JA_EXISTENTE' }
    }

    eventBus.emit('mensalidade.gerada', {
      mensalidadeId: resultado.mensalidadeId,
      alunoId: aluno.id,
      usuarioId: aluno.usuarioId,
      valor,
      competencia: competenciaAlvo,
    })

    return { criada: true }
  }

  private resumoVazio(origem: OrigemExecucaoJob, dryRun: boolean, iniciadoEm: Date): ResumoExecucao {
    const finalizadoEm = new Date()
    return {
      id: null,
      origem,
      status: 'SUCESSO',
      dryRun,
      totalAlunosElegiveis: 0,
      alunosAnalisados: 0,
      mensalidadesCriadas: 0,
      alunosIgnorados: 0,
      detalhesIgnorados: [],
      erros: [],
      duracaoMs: finalizadoEm.getTime() - iniciadoEm.getTime(),
      iniciadoEm,
      finalizadoEm,
    }
  }
}

export const mensalidadesAutomaticasService = new MensalidadesAutomaticasService(
  new MensalidadesAutomaticasRepository(),
  new ConfiguracaoRepository(),
)
