import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EstornosService } from '../estornos.service'
import { AppError, ValidationError } from '../../../shared/errors'

const ALUNO_USUARIO_ID = '11111111-1111-1111-1111-111111111111'
const ALUNO_ID = '22222222-2222-2222-2222-222222222222'
const MENSALIDADE_ID = '33333333-3333-3333-3333-333333333333'

const prismaMock = {
  aluno: { findUnique: vi.fn() },
  mensalidade: { findUnique: vi.fn() },
  presenca: { count: vi.fn() },
  usuario: { findUnique: vi.fn(), findMany: vi.fn() },
  notificacao: { create: vi.fn() },
}

vi.mock('../../../database/prisma.client', () => ({
  get prisma() {
    return prismaMock
  },
}))

vi.mock('../../auditoria/auditoria.service', () => ({
  registrarLog: vi.fn(),
}))

vi.mock('../../notificacoes/notificacoes.service', () => ({
  notificacoesService: { criar: vi.fn() },
}))

describe('EstornosService', () => {
  let service: EstornosService
  let mockRepo: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockRepo = {
      create: vi.fn(),
      findByMensalidade: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      updateStatus: vi.fn(),
    }
    service = new EstornosService(mockRepo)

    prismaMock.aluno.findUnique.mockResolvedValue({ id: ALUNO_ID, usuarioId: ALUNO_USUARIO_ID })
    prismaMock.usuario.findUnique.mockResolvedValue({ nomeCompleto: 'Aluno Teste' })
    prismaMock.usuario.findMany.mockResolvedValue([{ id: 'admin-1' }])
    prismaMock.notificacao.create.mockResolvedValue({})
  })

  describe('solicitar', () => {
    const mensalidadePaga = {
      id: MENSALIDADE_ID,
      alunoId: ALUNO_ID,
      status: 'PAGO',
      valor: 200,
      desconto: 0,
      mesReferencia: new Date('2026-06-01'),
      plano: { aulas: 4 },
    }

    it('cria estorno calculando diasEstornados e valorEstorno proporcionais às aulas não compareceu', async () => {
      prismaMock.mensalidade.findUnique.mockResolvedValue(mensalidadePaga)
      prismaMock.presenca.count.mockResolvedValue(1) // compareceu a 1 de 4 aulas contratadas
      mockRepo.findByMensalidade.mockResolvedValue(null)
      mockRepo.create.mockResolvedValue({
        id: 'estorno-1',
        alunoId: ALUNO_ID,
        diasContratados: 4,
        diasComparecidos: 1,
        diasEstornados: 3,
        valorEstorno: 150,
      })

      const result = await service.solicitar(ALUNO_USUARIO_ID, { mensalidadeId: MENSALIDADE_ID })

      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          mensalidadeId: MENSALIDADE_ID,
          alunoId: ALUNO_ID,
          diasContratados: 4,
          diasComparecidos: 1,
          diasEstornados: 3,
          // 3/4 das aulas não usadas * R$200 = R$150
          valorEstorno: 150,
        }),
      )
      expect(result.id).toBe('estorno-1')
      // Notifica admins ativos sobre a solicitação
      expect(prismaMock.notificacao.create).toHaveBeenCalledOnce()
    })

    it('lança erro se o usuário não tem perfil de aluno', async () => {
      prismaMock.aluno.findUnique.mockResolvedValue(null)

      await expect(service.solicitar(ALUNO_USUARIO_ID, { mensalidadeId: MENSALIDADE_ID })).rejects.toThrow(AppError)
      expect(mockRepo.create).not.toHaveBeenCalled()
    })

    it('lança ValidationError se a mensalidade não existe', async () => {
      prismaMock.mensalidade.findUnique.mockResolvedValue(null)

      await expect(service.solicitar(ALUNO_USUARIO_ID, { mensalidadeId: MENSALIDADE_ID })).rejects.toThrow(
        ValidationError,
      )
    })

    it('lança erro se a mensalidade não pertence a este aluno', async () => {
      prismaMock.mensalidade.findUnique.mockResolvedValue({ ...mensalidadePaga, alunoId: 'outro-aluno-id' })

      await expect(service.solicitar(ALUNO_USUARIO_ID, { mensalidadeId: MENSALIDADE_ID })).rejects.toThrow(AppError)
    })

    it('lança erro se a mensalidade não está PAGO nem PARCIAL', async () => {
      prismaMock.mensalidade.findUnique.mockResolvedValue({ ...mensalidadePaga, status: 'PENDENTE' })

      await expect(service.solicitar(ALUNO_USUARIO_ID, { mensalidadeId: MENSALIDADE_ID })).rejects.toThrow(
        'Apenas mensalidades pagas podem ser estornadas',
      )
    })

    it('bloqueia estorno duplicado quando já existe solicitação não negada para a mensalidade', async () => {
      prismaMock.mensalidade.findUnique.mockResolvedValue(mensalidadePaga)
      mockRepo.findByMensalidade.mockResolvedValue({ id: 'estorno-existente', status: 'SOLICITADO' })

      await expect(service.solicitar(ALUNO_USUARIO_ID, { mensalidadeId: MENSALIDADE_ID })).rejects.toThrow(
        'Já existe uma solicitação de estorno',
      )
      expect(mockRepo.create).not.toHaveBeenCalled()
    })
  })

  describe('aprovar', () => {
    it('aprova um estorno SOLICITADO', async () => {
      mockRepo.findById.mockResolvedValue({
        id: 'estorno-1',
        status: 'SOLICITADO',
        alunoId: ALUNO_ID,
        valorEstorno: 100,
      })
      mockRepo.updateStatus.mockResolvedValue({
        id: 'estorno-1',
        status: 'APROVADO',
        alunoId: ALUNO_ID,
        valorEstorno: 100,
      })
      prismaMock.aluno.findUnique.mockResolvedValue({ usuarioId: ALUNO_USUARIO_ID })

      const result = await service.aprovar('estorno-1', 'admin-1')

      expect(mockRepo.updateStatus).toHaveBeenCalledWith('estorno-1', 'APROVADO', 'admin-1')
      expect(result.status).toBe('APROVADO')
    })

    it('bloqueia aprovação de estorno que não está SOLICITADO', async () => {
      mockRepo.findById.mockResolvedValue({ id: 'estorno-1', status: 'APROVADO', alunoId: ALUNO_ID, valorEstorno: 100 })

      await expect(service.aprovar('estorno-1', 'admin-1')).rejects.toThrow(
        'Apenas estornos solicitados podem ser aprovados',
      )
      expect(mockRepo.updateStatus).not.toHaveBeenCalled()
    })
  })

  describe('negar', () => {
    it('nega um estorno SOLICITADO', async () => {
      mockRepo.findById.mockResolvedValue({
        id: 'estorno-1',
        status: 'SOLICITADO',
        alunoId: ALUNO_ID,
        valorEstorno: 100,
      })
      mockRepo.updateStatus.mockResolvedValue({
        id: 'estorno-1',
        status: 'NEGADO',
        alunoId: ALUNO_ID,
        valorEstorno: 100,
      })
      prismaMock.aluno.findUnique.mockResolvedValue({ usuarioId: ALUNO_USUARIO_ID })

      const result = await service.negar('estorno-1', 'admin-1')

      expect(mockRepo.updateStatus).toHaveBeenCalledWith('estorno-1', 'NEGADO', 'admin-1')
      expect(result.status).toBe('NEGADO')
    })

    it('bloqueia negação de estorno que não está SOLICITADO', async () => {
      mockRepo.findById.mockResolvedValue({
        id: 'estorno-1',
        status: 'PROCESSADO',
        alunoId: ALUNO_ID,
        valorEstorno: 100,
      })

      await expect(service.negar('estorno-1', 'admin-1')).rejects.toThrow(
        'Apenas estornos solicitados podem ser negados',
      )
    })
  })

  describe('marcarProcessado', () => {
    it('processa um estorno APROVADO', async () => {
      mockRepo.findById.mockResolvedValue({ id: 'estorno-1', status: 'APROVADO', alunoId: ALUNO_ID, valorEstorno: 100 })
      mockRepo.updateStatus.mockResolvedValue({
        id: 'estorno-1',
        status: 'PROCESSADO',
        alunoId: ALUNO_ID,
        valorEstorno: 100,
      })
      prismaMock.aluno.findUnique.mockResolvedValue({ usuarioId: ALUNO_USUARIO_ID })

      const result = await service.marcarProcessado('estorno-1', 'admin-1')

      expect(mockRepo.updateStatus).toHaveBeenCalledWith('estorno-1', 'PROCESSADO', 'admin-1')
      expect(result.status).toBe('PROCESSADO')
    })

    it('bloqueia processamento de estorno que não está APROVADO', async () => {
      mockRepo.findById.mockResolvedValue({
        id: 'estorno-1',
        status: 'SOLICITADO',
        alunoId: ALUNO_ID,
        valorEstorno: 100,
      })

      await expect(service.marcarProcessado('estorno-1', 'admin-1')).rejects.toThrow(
        'Apenas estornos aprovados podem ser marcados como processados',
      )
    })
  })

  describe('buscarPorId', () => {
    it('lança AppError quando o estorno não existe', async () => {
      mockRepo.findById.mockResolvedValue(null)
      await expect(service.buscarPorId('inexistente')).rejects.toThrow(AppError)
    })
  })
})
