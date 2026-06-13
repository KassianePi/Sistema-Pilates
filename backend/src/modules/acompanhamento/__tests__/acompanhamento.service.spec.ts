import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AcompanhamentoService } from '../acompanhamento.service'

const DIA_MS = 1000 * 60 * 60 * 24
const diasAtras = (n: number) => new Date(Date.now() - n * DIA_MS)

function alunoBase(over: Partial<any> = {}) {
  return {
    id: 'a-1',
    dataInicio: diasAtras(120),
    status: 'ATIVO',
    usuario: { nomeCompleto: 'Maria', email: 'maria@x.com' },
    planoAtual: { nome: 'Mensal' },
    presencas: [],
    mensalidades: [],
    ...over,
  }
}

describe('AcompanhamentoService — classificação de risco', () => {
  let service: AcompanhamentoService
  let mockRepo: any

  beforeEach(() => {
    mockRepo = {
      findAlunosAtivosComDados: vi.fn(),
      findUltimasPresencas: vi.fn().mockResolvedValue(new Map()),
      findDetalheAluno: vi.fn(),
      findProximasAulas: vi.fn().mockResolvedValue([]),
    }
    service = new AcompanhamentoService(mockRepo)
  })

  it('marca EM_RISCO quando sem presença há mais de 14 dias', async () => {
    mockRepo.findAlunosAtivosComDados.mockResolvedValue([alunoBase()])
    mockRepo.findUltimasPresencas.mockResolvedValue(new Map([['a-1', diasAtras(20)]]))

    const { alunos, resumo } = await service.listar()
    expect(alunos[0].risco).toBe('EM_RISCO')
    expect(resumo.emRisco).toBe(1)
  })

  it('marca EM_RISCO quando há mensalidade vencida', async () => {
    mockRepo.findAlunosAtivosComDados.mockResolvedValue([
      alunoBase({ mensalidades: [{ status: 'VENCIDO', dataVencimento: diasAtras(5) }] }),
    ])
    mockRepo.findUltimasPresencas.mockResolvedValue(new Map([['a-1', diasAtras(2)]]))

    const { alunos } = await service.listar()
    expect(alunos[0].risco).toBe('EM_RISCO')
    expect(alunos[0].mensalidadeVencida).toBe(true)
  })

  it('marca ATENCAO quando a taxa de presença é baixa', async () => {
    mockRepo.findAlunosAtivosComDados.mockResolvedValue([
      alunoBase({
        presencas: [
          { status: 'PRESENTE', dataRegistro: diasAtras(3) },
          { status: 'AUSENTE', dataRegistro: diasAtras(5) },
          { status: 'AUSENTE', dataRegistro: diasAtras(7) },
        ],
      }),
    ])
    mockRepo.findUltimasPresencas.mockResolvedValue(new Map([['a-1', diasAtras(3)]]))

    const { alunos } = await service.listar()
    expect(alunos[0].risco).toBe('ATENCAO')
    expect(alunos[0].taxaPresenca).toBeLessThan(50)
  })

  it('marca OK quando frequente e em dia', async () => {
    mockRepo.findAlunosAtivosComDados.mockResolvedValue([
      alunoBase({
        presencas: [
          { status: 'PRESENTE', dataRegistro: diasAtras(1) },
          { status: 'PRESENTE', dataRegistro: diasAtras(4) },
        ],
      }),
    ])
    mockRepo.findUltimasPresencas.mockResolvedValue(new Map([['a-1', diasAtras(1)]]))

    const { alunos } = await service.listar()
    expect(alunos[0].risco).toBe('OK')
  })

  it('filtra por risco quando solicitado', async () => {
    mockRepo.findAlunosAtivosComDados.mockResolvedValue([
      alunoBase({ id: 'a-1' }),
      alunoBase({ id: 'a-2', presencas: [{ status: 'PRESENTE', dataRegistro: diasAtras(1) }] }),
    ])
    mockRepo.findUltimasPresencas.mockResolvedValue(new Map([
      ['a-1', diasAtras(40)], // EM_RISCO
      ['a-2', diasAtras(1)],  // OK
    ]))

    const { alunos } = await service.listar({ risco: 'EM_RISCO' })
    expect(alunos).toHaveLength(1)
    expect(alunos[0].id).toBe('a-1')
  })
})
