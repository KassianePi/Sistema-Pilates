import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RelatoriosService } from '../relatorios.service'
import { AppError, ValidationError } from '../../../shared/errors'

const prismaMock = {
  professor: { findUnique: vi.fn() },
  presenca: { groupBy: vi.fn() },
  pagamento: { findMany: vi.fn() },
  mensalidade: { findMany: vi.fn(), count: vi.fn() },
}

vi.mock('../../../database/prisma.client', () => ({
  get prisma() {
    return prismaMock
  },
}))

vi.mock('../relatorios.excel', () => ({
  gerarExcel: vi.fn().mockResolvedValue(Buffer.from('fake-xlsx')),
}))

const PROFESSOR_ID = '11111111-1111-1111-1111-111111111111'
const PERIODO = { dataPeriodoInicio: '2026-06-01', dataPeriodoFim: '2026-06-30' }

describe('RelatoriosService', () => {
  let service: RelatoriosService
  let mockRepo: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockRepo = {
      create: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
    }
    service = new RelatoriosService(mockRepo)
    prismaMock.professor.findUnique.mockResolvedValue({ id: PROFESSOR_ID })
  })

  describe('gerar', () => {
    it('lança ValidationError se o professor não existe', async () => {
      prismaMock.professor.findUnique.mockResolvedValue(null)

      await expect(
        service.gerar({ professorId: PROFESSOR_ID, tipo: 'FREQUENCIA', titulo: 'Relatório', ...PERIODO }),
      ).rejects.toThrow(ValidationError)
      expect(mockRepo.create).not.toHaveBeenCalled()
    })

    it('FREQUENCIA agrega presenças por status no período', async () => {
      prismaMock.presenca.groupBy.mockResolvedValue([
        { status: 'PRESENTE', _count: { id: 10 } },
        { status: 'AUSENTE', _count: { id: 2 } },
      ])
      mockRepo.create.mockImplementation((data: any) => ({ id: 'rel-1', ...data }))

      const result = await service.gerar({
        professorId: PROFESSOR_ID,
        tipo: 'FREQUENCIA',
        titulo: 'Frequência',
        ...PERIODO,
      })

      const conteudo = JSON.parse(result.conteudo as any)
      expect(conteudo.presencas).toHaveLength(2)
      expect(conteudo.presencas[0]).toEqual({ status: 'PRESENTE', _count: { id: 10 } })
    })

    it('FINANCEIRO soma o valor arrecadado dos pagamentos no período', async () => {
      prismaMock.pagamento.findMany.mockResolvedValue([
        { valor: { toString: () => '100.00' }, metodo: 'PIX', dataPagamento: new Date() },
        { valor: { toString: () => '50.50' }, metodo: 'DINHEIRO', dataPagamento: new Date() },
      ])
      mockRepo.create.mockImplementation((data: any) => ({ id: 'rel-2', ...data }))

      const result = await service.gerar({
        professorId: PROFESSOR_ID,
        tipo: 'FINANCEIRO',
        titulo: 'Financeiro',
        ...PERIODO,
      })

      const conteudo = JSON.parse(result.conteudo as any)
      expect(conteudo.pagamentos).toBe(2)
      expect(conteudo.totalArrecadado).toBe(150.5)
    })

    it('RECEITA_MENSAL calcula bruto, desconto e líquido', async () => {
      prismaMock.mensalidade.findMany.mockResolvedValue([
        { valor: { toString: () => '200.00' }, desconto: { toString: () => '20.00' }, status: 'PAGO' },
        { valor: { toString: () => '200.00' }, desconto: { toString: () => '0' }, status: 'PAGO' },
      ])
      mockRepo.create.mockImplementation((data: any) => ({ id: 'rel-3', ...data }))

      const result = await service.gerar({
        professorId: PROFESSOR_ID,
        tipo: 'RECEITA_MENSAL',
        titulo: 'Receita',
        ...PERIODO,
      })

      const conteudo = JSON.parse(result.conteudo as any)
      expect(conteudo.totalMensalidades).toBe(2)
      expect(conteudo.totalBruto).toBe(400)
      expect(conteudo.totalDesconto).toBe(20)
      expect(conteudo.totalLiquido).toBe(380)
    })

    it('PENDENCIAS_PAGAMENTO conta mensalidades PENDENTE + VENCIDO', async () => {
      prismaMock.mensalidade.count.mockResolvedValue(7)
      mockRepo.create.mockImplementation((data: any) => ({ id: 'rel-4', ...data }))

      const result = await service.gerar({
        professorId: PROFESSOR_ID,
        tipo: 'PENDENCIAS_PAGAMENTO',
        titulo: 'Pendências',
        ...PERIODO,
      })

      expect(prismaMock.mensalidade.count).toHaveBeenCalledWith({ where: { status: { in: ['PENDENTE', 'VENCIDO'] } } })
      const conteudo = JSON.parse(result.conteudo as any)
      expect(conteudo.totalPendencias).toBe(7)
    })

    it('retorna apenas o período para um tipo sem agregação implementada (PRESENCA_ALUNO)', async () => {
      mockRepo.create.mockImplementation((data: any) => ({ id: 'rel-5', ...data }))
      const result = await service.gerar({
        professorId: PROFESSOR_ID,
        tipo: 'PRESENCA_ALUNO',
        titulo: 'Presença aluno',
        ...PERIODO,
      })
      const conteudo = JSON.parse(result.conteudo as any)
      expect(conteudo.periodo).toBeDefined()
      expect(conteudo.presencas).toBeUndefined()
    })

    it('rejeita tipo de relatório fora do enum permitido', async () => {
      await expect(
        service.gerar({ professorId: PROFESSOR_ID, tipo: 'TIPO_INEXISTENTE' as any, titulo: 'X', ...PERIODO }),
      ).rejects.toThrow()
      expect(mockRepo.create).not.toHaveBeenCalled()
    })
  })

  describe('listar', () => {
    it('valida filtros e calcula paginação', async () => {
      mockRepo.findAll.mockResolvedValue({ relatorios: [{ id: 'r1' }], total: 1 })
      const result = await service.listar({ professorId: PROFESSOR_ID, tipo: 'FREQUENCIA' })
      expect(mockRepo.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ professorId: PROFESSOR_ID, tipo: 'FREQUENCIA' }),
      )
      expect(result.total).toBe(1)
    })

    it('rejeita filtro de tipo inválido', async () => {
      await expect(service.listar({ tipo: 'TIPO_INEXISTENTE' as any })).rejects.toThrow()
    })
  })

  describe('buscarPorId', () => {
    it('lança AppError quando o relatório não existe', async () => {
      mockRepo.findById.mockResolvedValue(null)
      await expect(service.buscarPorId('inexistente')).rejects.toThrow(AppError)
    })
  })

  describe('exportarPorId', () => {
    it('gera o Excel a partir de um relatório existente', async () => {
      mockRepo.findById.mockResolvedValue({ id: 'rel-1', tipo: 'FREQUENCIA', conteudo: '{}' })
      const buffer = await service.exportarPorId('rel-1')
      expect(Buffer.isBuffer(buffer)).toBe(true)
    })
  })
})
