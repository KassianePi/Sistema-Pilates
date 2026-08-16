import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AlunosService } from '../alunos.service'
import { prisma } from '../../../database/prisma.client'

const PLANO_ID = '11111111-1111-1111-1111-111111111111'

vi.mock('../../../database/prisma.client', () => ({
  prisma: {
    usuario: { findUnique: vi.fn().mockResolvedValue(null) },
    plano: {
      findUnique: vi.fn().mockResolvedValue({ id: '11111111-1111-1111-1111-111111111111', nome: 'Mensal', preco: 100 }),
    },
  },
}))

vi.mock('../../notificacoes/notificacoes.service', () => ({
  notificacoesService: { notificarAdmins: vi.fn().mockResolvedValue(undefined) },
}))

describe('AlunosService', () => {
  let service: AlunosService
  let mockRepo: any

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.usuario.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.plano.findUnique).mockResolvedValue({ id: PLANO_ID, nome: 'Mensal', preco: 100 } as any)
    mockRepo = {
      findById: vi.fn(),
      findAll: vi.fn(),
      create: vi.fn(),
      createWithMatricula: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    }
    service = new AlunosService(mockRepo)
  })

  describe('buscarPorId', () => {
    it('deve retornar aluno existente', async () => {
      const aluno = { id: 'uuid-1', usuarioId: 'u-1', status: 'ATIVO' }
      mockRepo.findById.mockResolvedValue(aluno)
      const result = await service.buscarPorId('uuid-1')
      expect(result).toEqual(aluno)
    })

    it('deve lançar 404 se aluno não existe', async () => {
      mockRepo.findById.mockResolvedValue(null)
      await expect(service.buscarPorId('inexistente')).rejects.toThrow('Aluno')
    })
  })

  describe('criar', () => {
    it('deve lançar erro se CPF inválido', async () => {
      await expect(
        service.criar({
          email: 'a@b.com',
          nomeCompleto: 'Nome',
          cpf: '123',
          senha: 'senha123',
          dataInicio: '2026-01-01',
        }),
      ).rejects.toThrow()
    })

    it('cadastro sem plano usa o fluxo simples (sem mensalidade)', async () => {
      mockRepo.create.mockResolvedValue({ id: 'aluno-1', usuarioId: 'u-1', status: 'ATIVO' })

      const result = await service.criar({
        email: 'aluno@teste.com',
        nomeCompleto: 'Aluno Sem Plano',
        cpf: '11122233344',
        senha: 'senha123',
        dataInicio: '2026-01-01',
      })

      expect(mockRepo.create).toHaveBeenCalledTimes(1)
      expect(mockRepo.createWithMatricula).not.toHaveBeenCalled()
      expect(result.id).toBe('aluno-1')
    })
  })

  describe('criar com planoId', () => {
    const dadosComPlano = {
      email: 'aluno-plano@teste.com',
      nomeCompleto: 'Aluno Com Plano',
      cpf: '55566677788',
      senha: 'senha123',
      planoId: PLANO_ID,
      dataInicio: '2026-01-01',
    }

    it('cria aluno + primeira mensalidade sem exigir nem enviar comprovante', async () => {
      mockRepo.createWithMatricula.mockResolvedValue({
        aluno: { id: 'aluno-2', usuarioId: 'u-2', status: 'ATIVO' },
        mensalidadeId: 'mens-1',
      })

      const result = await service.criar(dadosComPlano)

      expect(result.id).toBe('aluno-2')
      expect(mockRepo.createWithMatricula).toHaveBeenCalledTimes(1)
      const [, matricula] = mockRepo.createWithMatricula.mock.calls[0]
      expect(matricula).not.toHaveProperty('comprovante')
      expect(matricula.valor).toBe(100)
      expect(matricula.planoId).toBe(PLANO_ID)
    })

    it('gera e-mail sintético quando não informado, sem checar duplicidade de e-mail', async () => {
      mockRepo.createWithMatricula.mockResolvedValue({
        aluno: { id: 'aluno-3', usuarioId: 'u-3', status: 'ATIVO' },
        mensalidadeId: 'mens-2',
      })

      await service.criar({
        nomeCompleto: 'Aluno Sem Email',
        cpf: '55566677788',
        senha: 'senha123',
        planoId: PLANO_ID,
        dataInicio: '2026-01-01',
      })

      const [alunoData] = mockRepo.createWithMatricula.mock.calls[0]
      expect(alunoData.email).toBe('55566677788@sememail.pilates.local')
      // só a checagem de CPF duplicado roda — a de e-mail é pulada quando não informado
      expect(prisma.usuario.findUnique).toHaveBeenCalledTimes(1)
    })

    it('notifica os admins sem mencionar comprovante', async () => {
      const { notificacoesService } = await import('../../notificacoes/notificacoes.service')
      mockRepo.createWithMatricula.mockResolvedValue({
        aluno: { id: 'aluno-2', usuarioId: 'u-2', status: 'ATIVO' },
        mensalidadeId: 'mens-1',
      })

      await service.criar(dadosComPlano)

      expect(notificacoesService.notificarAdmins).toHaveBeenCalledTimes(1)
      const [titulo, mensagem] = vi.mocked(notificacoesService.notificarAdmins).mock.calls[0]
      expect(titulo).toBe('Novo aluno matriculado')
      expect(mensagem.toLowerCase()).not.toContain('comprovante')
    })

    it('lança erro se o plano não existe', async () => {
      vi.mocked(prisma.plano.findUnique).mockResolvedValueOnce(null)

      await expect(service.criar(dadosComPlano)).rejects.toThrow(/planoId/)
      expect(mockRepo.createWithMatricula).not.toHaveBeenCalled()
    })

    it('lança erro se o email já está cadastrado', async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValueOnce({ id: 'existente' } as any)

      await expect(service.criar(dadosComPlano)).rejects.toThrow()
      expect(mockRepo.createWithMatricula).not.toHaveBeenCalled()
    })
  })

  describe('listar', () => {
    it('deve listar alunos com paginação', async () => {
      mockRepo.findAll.mockResolvedValue({ alunos: [], total: 0 })
      const result = await service.listar({ page: 1, limit: 10 })
      expect(result.total).toBe(0)
      expect(result.totalPages).toBe(0)
    })
  })
})
