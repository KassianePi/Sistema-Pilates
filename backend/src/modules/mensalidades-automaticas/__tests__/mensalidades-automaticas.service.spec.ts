import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MensalidadesAutomaticasService } from '../mensalidades-automaticas.service'
import type { AlunoElegivel } from '../mensalidades-automaticas.types'

vi.mock('../../../events/event-bus', () => ({
  eventBus: { emit: vi.fn() },
}))

const CONFIG_PADRAO = {
  geracaoAutomaticaAtiva: true,
  diasAntesGeracao: 5,
  maximoMensalidadesFuturas: 1,
}

function criarAluno(overrides: Partial<AlunoElegivel> = {}): AlunoElegivel {
  return {
    id: 'aluno-1',
    usuarioId: 'usuario-1',
    diaVencimento: 10,
    planoAtual: { id: 'plano-1', tipo: 'MENSAL', preco: { toString: () => '120' } as any },
    mensalidades: [{ mesReferencia: new Date(2026, 6, 1) }], // Julho/2026
    ...overrides,
  }
}

describe('MensalidadesAutomaticasService', () => {
  let service: MensalidadesAutomaticasService
  let mockRepo: any
  let mockConfigRepo: any

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()

    mockRepo = {
      adquirirLock: vi.fn().mockResolvedValue(true),
      liberarLock: vi.fn().mockResolvedValue(undefined),
      contarAlunosElegiveis: vi.fn().mockResolvedValue(0),
      buscarLoteAlunosElegiveis: vi.fn().mockResolvedValue([]),
      contarMensalidadesFuturasEmLote: vi.fn().mockResolvedValue(new Map()),
      criarSeNaoExiste: vi.fn().mockResolvedValue({ criada: true, mensalidadeId: 'mens-nova' }),
      criarExecucao: vi.fn().mockResolvedValue('execucao-1'),
      atualizarProgressoExecucao: vi.fn().mockResolvedValue(undefined),
      finalizarExecucao: vi.fn().mockResolvedValue(undefined),
      buscarExecucaoEmAndamento: vi.fn().mockResolvedValue(null),
    }
    mockConfigRepo = {
      find: vi.fn().mockResolvedValue(CONFIG_PADRAO),
    }

    service = new MensalidadesAutomaticasService(mockRepo, mockConfigRepo)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  /** Configura um único lote de alunos e finaliza a paginação. */
  function configurarLote(alunos: AlunoElegivel[]) {
    mockRepo.contarAlunosElegiveis.mockResolvedValue(alunos.length)
    mockRepo.buscarLoteAlunosElegiveis.mockResolvedValueOnce(alunos).mockResolvedValue([])
  }

  it('gera a próxima competência quando dentro da janela de diasAntesGeracao', async () => {
    // Hoje: 05/08/2026. Vencimento alvo: 10/08/2026. Limite: 05/08/2026 (5 dias antes) → elegível.
    vi.setSystemTime(new Date(2026, 7, 5, 10, 0, 0))
    configurarLote([criarAluno()])

    const resumo = await service.executarGeracao('CRON')

    expect(resumo.mensalidadesCriadas).toBe(1)
    expect(mockRepo.criarSeNaoExiste).toHaveBeenCalledWith(
      expect.objectContaining({
        alunoId: 'aluno-1',
        mesReferencia: new Date(2026, 7, 1), // Agosto/2026
        dataVencimento: new Date(2026, 7, 10),
        valor: 120,
      }),
    )
  })

  it('não gera quando ainda falta tempo para o vencimento', async () => {
    // Hoje: 20/07/2026. Vencimento alvo: 10/08/2026. Limite: 05/08/2026 → ainda não elegível.
    vi.setSystemTime(new Date(2026, 6, 20, 10, 0, 0))
    configurarLote([criarAluno()])

    const resumo = await service.executarGeracao('CRON')

    expect(resumo.mensalidadesCriadas).toBe(0)
    expect(resumo.alunosIgnorados).toBe(1)
    expect(resumo.detalhesIgnorados[0]).toEqual({ alunoId: 'aluno-1', motivo: 'AINDA_NAO_ELEGIVEL' })
    expect(mockRepo.criarSeNaoExiste).not.toHaveBeenCalled()
  })

  it('reativação após gap: gera a competência atual, não as intermediárias', async () => {
    // Última mensalidade: Janeiro/2026. Hoje: Agosto/2026 — não deve gerar Fevereiro.
    vi.setSystemTime(new Date(2026, 7, 5, 10, 0, 0))
    configurarLote([criarAluno({ mensalidades: [{ mesReferencia: new Date(2026, 0, 1) }] })])

    const resumo = await service.executarGeracao('CRON')

    expect(resumo.mensalidadesCriadas).toBe(1)
    expect(mockRepo.criarSeNaoExiste).toHaveBeenCalledWith(
      expect.objectContaining({ mesReferencia: new Date(2026, 7, 1) }), // Agosto/2026, não Fevereiro
    )
  })

  it('aluno sem nenhuma mensalidade MENSAL é pulado (sem baseline)', async () => {
    vi.setSystemTime(new Date(2026, 7, 5, 10, 0, 0))
    configurarLote([criarAluno({ mensalidades: [] })])

    const resumo = await service.executarGeracao('CRON')

    expect(resumo.mensalidadesCriadas).toBe(0)
    expect(resumo.detalhesIgnorados[0]).toEqual({ alunoId: 'aluno-1', motivo: 'SEM_BASELINE' })
    expect(mockRepo.criarSeNaoExiste).not.toHaveBeenCalled()
  })

  it('aluno sem plano é pulado', async () => {
    vi.setSystemTime(new Date(2026, 7, 5, 10, 0, 0))
    configurarLote([criarAluno({ planoAtual: null })])

    const resumo = await service.executarGeracao('CRON')

    expect(resumo.detalhesIgnorados[0]).toEqual({ alunoId: 'aluno-1', motivo: 'SEM_PLANO' })
  })

  it('usa o preço do plano atual, mesmo que diferente do valor da última mensalidade (troca de plano)', async () => {
    vi.setSystemTime(new Date(2026, 7, 5, 10, 0, 0))
    configurarLote([
      criarAluno({ planoAtual: { id: 'plano-novo', tipo: 'MENSAL', preco: { toString: () => '180' } as any } }),
    ])

    await service.executarGeracao('CRON')

    expect(mockRepo.criarSeNaoExiste).toHaveBeenCalledWith(expect.objectContaining({ valor: 180 }))
  })

  it('limite de mensalidades futuras atingido: pula mesmo dentro da janela de geração', async () => {
    vi.setSystemTime(new Date(2026, 7, 5, 10, 0, 0))
    configurarLote([criarAluno()])
    mockRepo.contarMensalidadesFuturasEmLote.mockResolvedValue(new Map([['aluno-1', 1]]))

    const resumo = await service.executarGeracao('CRON')

    expect(resumo.mensalidadesCriadas).toBe(0)
    expect(resumo.detalhesIgnorados[0]).toEqual({ alunoId: 'aluno-1', motivo: 'LIMITE_FUTURAS_ATINGIDO' })
    expect(mockRepo.criarSeNaoExiste).not.toHaveBeenCalled()
  })

  it('geracaoAutomaticaAtiva=false: resumo zerado, nenhum aluno processado', async () => {
    mockConfigRepo.find.mockResolvedValue({ ...CONFIG_PADRAO, geracaoAutomaticaAtiva: false })

    const resumo = await service.executarGeracao('CRON')

    expect(resumo.alunosAnalisados).toBe(0)
    expect(mockRepo.adquirirLock).not.toHaveBeenCalled()
    expect(mockRepo.buscarLoteAlunosElegiveis).not.toHaveBeenCalled()
  })

  it('criarSeNaoExiste retorna criada:false (constraint bateu): conta como ignorado, não erro', async () => {
    vi.setSystemTime(new Date(2026, 7, 5, 10, 0, 0))
    configurarLote([criarAluno()])
    mockRepo.criarSeNaoExiste.mockResolvedValue({ criada: false, mensalidadeId: null })

    const resumo = await service.executarGeracao('CRON')

    expect(resumo.mensalidadesCriadas).toBe(0)
    expect(resumo.alunosIgnorados).toBe(1)
    expect(resumo.erros).toHaveLength(0)
    expect(resumo.detalhesIgnorados[0]).toEqual({ alunoId: 'aluno-1', motivo: 'JA_EXISTENTE' })
  })

  it('erro em um aluno não interrompe o processamento dos demais', async () => {
    vi.setSystemTime(new Date(2026, 7, 5, 10, 0, 0))
    configurarLote([criarAluno({ id: 'aluno-com-erro' }), criarAluno({ id: 'aluno-ok' })])
    mockRepo.criarSeNaoExiste
      .mockRejectedValueOnce(new Error('falha de banco'))
      .mockResolvedValueOnce({ criada: true, mensalidadeId: 'mens-ok' })

    const resumo = await service.executarGeracao('CRON')

    expect(resumo.erros).toEqual([{ alunoId: 'aluno-com-erro', mensagem: 'falha de banco' }])
    expect(resumo.mensalidadesCriadas).toBe(1)
    expect(resumo.status).toBe('PARCIAL')
  })

  it('dryRun=true: não chama criação real nem persiste execução', async () => {
    vi.setSystemTime(new Date(2026, 7, 5, 10, 0, 0))
    configurarLote([criarAluno()])

    const resumo = await service.executarGeracao('MANUAL', { dryRun: true })

    expect(resumo.mensalidadesCriadas).toBe(1)
    expect(resumo.id).toBeNull()
    expect(mockRepo.criarSeNaoExiste).not.toHaveBeenCalled()
    expect(mockRepo.criarExecucao).not.toHaveBeenCalled()
    expect(mockRepo.finalizarExecucao).not.toHaveBeenCalled()
  })

  it('lock não obtido: retorna imediatamente, sem processar nenhum aluno, sem criar execução', async () => {
    mockRepo.adquirirLock.mockResolvedValue(false)
    configurarLote([criarAluno()])

    const resumo = await service.executarGeracao('CRON')

    expect(resumo.alunosAnalisados).toBe(0)
    expect(mockRepo.buscarLoteAlunosElegiveis).not.toHaveBeenCalled()
    expect(mockRepo.criarExecucao).not.toHaveBeenCalled()
    expect(mockRepo.liberarLock).not.toHaveBeenCalled() // nunca obteve o lock, não deve tentar liberar
  })

  it('status SUCESSO quando não há erros', async () => {
    vi.setSystemTime(new Date(2026, 7, 5, 10, 0, 0))
    configurarLote([criarAluno()])

    const resumo = await service.executarGeracao('CRON')

    expect(resumo.status).toBe('SUCESSO')
  })

  it('status ERRO quando todos os alunos analisados falham', async () => {
    vi.setSystemTime(new Date(2026, 7, 5, 10, 0, 0))
    configurarLote([criarAluno()])
    mockRepo.criarSeNaoExiste.mockRejectedValue(new Error('indisponível'))

    const resumo = await service.executarGeracao('CRON')

    expect(resumo.status).toBe('ERRO')
  })

  it('origem MANUAL grava executadoPorId; CRON não', async () => {
    vi.setSystemTime(new Date(2026, 7, 5, 10, 0, 0))
    configurarLote([criarAluno()])

    await service.executarGeracao('MANUAL', { executadoPorId: 'admin-1' })
    expect(mockRepo.criarExecucao).toHaveBeenCalledWith(
      expect.objectContaining({ origem: 'MANUAL', executadoPorId: 'admin-1' }),
    )

    mockRepo.criarExecucao.mockClear()
    configurarLote([criarAluno()])
    await service.executarGeracao('CRON')
    expect(mockRepo.criarExecucao).toHaveBeenCalledWith(
      expect.objectContaining({ origem: 'CRON', executadoPorId: undefined }),
    )
  })

  it('paginação: processa alunos de múltiplos lotes e calcula futuras em lote (não por aluno)', async () => {
    vi.setSystemTime(new Date(2026, 7, 5, 10, 0, 0))
    const lote1 = Array.from({ length: 2 }, (_, i) => criarAluno({ id: `lote1-${i}` }))
    const lote2 = Array.from({ length: 2 }, (_, i) => criarAluno({ id: `lote2-${i}` }))
    mockRepo.contarAlunosElegiveis.mockResolvedValue(4)
    mockRepo.buscarLoteAlunosElegiveis
      .mockResolvedValueOnce(lote1)
      .mockResolvedValueOnce(lote2)
      .mockResolvedValueOnce([])

    const resumo = await service.executarGeracao('CRON')

    expect(resumo.alunosAnalisados).toBe(4)
    expect(resumo.mensalidadesCriadas).toBe(4)
    // Uma chamada de agregação por lote (2), nunca uma por aluno (4).
    expect(mockRepo.contarMensalidadesFuturasEmLote).toHaveBeenCalledTimes(2)
  })
})
