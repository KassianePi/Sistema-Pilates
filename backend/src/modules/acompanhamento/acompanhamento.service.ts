import { AcompanhamentoRepository } from './acompanhamento.repository'
import { AppError } from '../../shared/errors'
import { ACOMPANHAMENTO, ACOMPANHAMENTO_ERRORS } from './acompanhamento.constants'
import type { AlunoAcompanhamento, DetalheAluno, ResumoAcompanhamento, RiscoAluno } from './acompanhamento.types'

type AlunoComDados = {
  id: string
  dataInicio: Date
  status: string
  usuario: { nomeCompleto: string; email: string | null }
  planoAtual: { nome: string } | null
  presencas: Array<{ status: string; dataRegistro: Date }>
  mensalidades: Array<{ status: string; dataVencimento: Date }>
}

const DIA_MS = 1000 * 60 * 60 * 24

export class AcompanhamentoService {
  constructor(private repository: AcompanhamentoRepository) {}

  private janelaInicio(): Date {
    return new Date(Date.now() - ACOMPANHAMENTO.JANELA_DIAS * DIA_MS)
  }

  /**
   * Calcula métricas e classifica o risco de evasão de um aluno.
   * Regras (ajustáveis em acompanhamento.constants):
   *  - EM_RISCO: sem presença há > DIAS_SEM_PRESENCA_RISCO dias, ou mensalidade vencida.
   *  - ATENCAO: taxa de presença < TAXA_PRESENCA_ATENCAO (com registros suficientes),
   *    ou mensalidade pendente vencendo em ≤ DIAS_VENCIMENTO_PROXIMO dias.
   *  - OK: caso contrário.
   */
  private calcularMetricas(aluno: AlunoComDados, ultimaPresenca: Date | null): AlunoAcompanhamento {
    const agora = Date.now()

    const totalRegistros = aluno.presencas.length
    const presentes = aluno.presencas.filter((p) => p.status === 'PRESENTE').length
    const faltas = aluno.presencas.filter((p) => p.status === 'AUSENTE').length
    const taxaPresenca = totalRegistros > 0 ? Math.round((presentes / totalRegistros) * 100) : 0

    // Referência de inatividade: última presença ou, na ausência, a data de início.
    const refInatividade = ultimaPresenca ?? aluno.dataInicio
    const diasSemPresenca = ultimaPresenca
      ? Math.floor((agora - ultimaPresenca.getTime()) / DIA_MS)
      : Math.floor((agora - aluno.dataInicio.getTime()) / DIA_MS)

    const mensalidadeVencida = aluno.mensalidades.some((m) => m.status === 'VENCIDO')
    const mensalidadesPendentes = aluno.mensalidades.length
    const proximoVencimento = aluno.mensalidades
      .map((m) => m.dataVencimento)
      .sort((a, b) => a.getTime() - b.getTime())[0] ?? null

    const motivosRisco: string[] = []
    let risco: RiscoAluno = 'OK'

    const inativoDemais = (agora - refInatividade.getTime()) / DIA_MS > ACOMPANHAMENTO.DIAS_SEM_PRESENCA_RISCO

    if (inativoDemais) motivosRisco.push(`Sem comparecer há ${diasSemPresenca} dias`)
    if (mensalidadeVencida) motivosRisco.push('Mensalidade vencida')

    if (inativoDemais || mensalidadeVencida) {
      risco = 'EM_RISCO'
    } else {
      const taxaBaixa = totalRegistros >= ACOMPANHAMENTO.MIN_REGISTROS_TAXA && taxaPresenca < ACOMPANHAMENTO.TAXA_PRESENCA_ATENCAO
      const vencimentoProximo = proximoVencimento
        ? (proximoVencimento.getTime() - agora) / DIA_MS <= ACOMPANHAMENTO.DIAS_VENCIMENTO_PROXIMO
        : false

      if (taxaBaixa) motivosRisco.push(`Frequência baixa (${taxaPresenca}%)`)
      if (vencimentoProximo) motivosRisco.push('Mensalidade a vencer')

      if (taxaBaixa || vencimentoProximo) risco = 'ATENCAO'
    }

    return {
      id: aluno.id,
      nome: aluno.usuario.nomeCompleto,
      email: aluno.usuario.email,
      plano: aluno.planoAtual?.nome ?? null,
      status: aluno.status,
      ultimaPresenca,
      diasSemPresenca,
      taxaPresenca,
      faltasRecentes: faltas,
      totalRegistrosPeriodo: totalRegistros,
      mensalidadeVencida,
      mensalidadesPendentes,
      proximoVencimento,
      risco,
      motivosRisco,
    }
  }

  /** Lista de alunos com métricas, com filtro opcional por risco e busca por nome. */
  async listar(params: { risco?: RiscoAluno; busca?: string } = {}): Promise<{ alunos: AlunoAcompanhamento[]; resumo: ResumoAcompanhamento }> {
    const [alunos, ultimas] = await Promise.all([
      this.repository.findAlunosAtivosComDados(this.janelaInicio()),
      this.repository.findUltimasPresencas(),
    ])

    let lista = (alunos as unknown as AlunoComDados[]).map((a) =>
      this.calcularMetricas(a, ultimas.get(a.id) ?? null),
    )

    const resumo: ResumoAcompanhamento = {
      total: lista.length,
      emRisco: lista.filter((a) => a.risco === 'EM_RISCO').length,
      atencao: lista.filter((a) => a.risco === 'ATENCAO').length,
      ok: lista.filter((a) => a.risco === 'OK').length,
    }

    if (params.risco) lista = lista.filter((a) => a.risco === params.risco)
    if (params.busca) {
      const termo = params.busca.toLowerCase()
      lista = lista.filter((a) => a.nome.toLowerCase().includes(termo) || (a.email ?? '').toLowerCase().includes(termo))
    }

    // Ordena por gravidade (EM_RISCO → ATENCAO → OK) e, dentro, por dias sem presença.
    const peso: Record<RiscoAluno, number> = { EM_RISCO: 0, ATENCAO: 1, OK: 2 }
    lista.sort((a, b) => peso[a.risco] - peso[b.risco] || (b.diasSemPresenca ?? 0) - (a.diasSemPresenca ?? 0))

    return { alunos: lista, resumo }
  }

  async resumo(): Promise<ResumoAcompanhamento> {
    const { resumo } = await this.listar()
    return resumo
  }

  async detalhe(id: string): Promise<DetalheAluno> {
    const aluno = await this.repository.findDetalheAluno(id)
    if (!aluno) throw AppError.notFound('Aluno', ACOMPANHAMENTO_ERRORS.ALUNO_NOT_FOUND)

    const janela = this.janelaInicio()
    const presencasJanela = aluno.presencas.filter((p) => p.dataRegistro >= janela)
    const ultimaPresenca = aluno.presencas.find((p) => p.status === 'PRESENTE')?.dataRegistro ?? null

    const base = this.calcularMetricas(
      {
        id: aluno.id,
        dataInicio: aluno.dataInicio,
        status: aluno.status,
        usuario: { nomeCompleto: aluno.usuario.nomeCompleto, email: aluno.usuario.email },
        planoAtual: aluno.planoAtual,
        presencas: presencasJanela.map((p) => ({ status: p.status, dataRegistro: p.dataRegistro })),
        mensalidades: aluno.mensalidades
          .filter((m) => ['PENDENTE', 'VENCIDO', 'PARCIAL'].includes(m.status))
          .map((m) => ({ status: m.status, dataVencimento: m.dataVencimento })),
      },
      ultimaPresenca,
    )

    const proximasAulas = await this.repository.findProximasAulas(id)

    return {
      ...base,
      dataInicio: aluno.dataInicio,
      telefone: aluno.usuario.telefone,
      presencas: aluno.presencas.map((p) => ({
        id: p.id, status: p.status, dataRegistro: p.dataRegistro,
        aula: p.aula ? { dataHoraInicio: p.aula.dataHoraInicio, sala: p.aula.sala } : null,
      })),
      mensalidades: aluno.mensalidades.map((m) => ({
        id: m.id, status: m.status, valor: m.valor, dataVencimento: m.dataVencimento,
        plano: m.plano?.nome ?? null,
      })),
      proximasAulas: proximasAulas.map((a) => ({ id: a.id, dataHoraInicio: a.dataHoraInicio, sala: a.sala, status: a.status })),
    }
  }
}

export const acompanhamentoService = new AcompanhamentoService(new AcompanhamentoRepository())
