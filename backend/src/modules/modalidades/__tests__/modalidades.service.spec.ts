import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ModalidadesService } from '../modalidades.service'
import { AppError } from '../../../shared/errors'

vi.mock('../../notificacoes/notificacoes.service', () => ({
  notificacoesService: { notificarAdmins: vi.fn().mockResolvedValue(undefined) },
}))

describe('ModalidadesService', () => {
  let service: ModalidadesService
  let mockRepo: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockRepo = {
      findAll: vi.fn(),
      findById: vi.fn(),
      findByNome: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      countAulas: vi.fn(),
      delete: vi.fn(),
    }
    service = new ModalidadesService(mockRepo)
  })

  describe('criar', () => {
    it('cria modalidade com nome único', async () => {
      mockRepo.findByNome.mockResolvedValue(null)
      mockRepo.create.mockResolvedValue({ id: 'mod-1', nome: 'Reformer', ativo: true })

      const result = await service.criar({ nome: 'Reformer' })

      expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({ nome: 'Reformer' }))
      expect(result.id).toBe('mod-1')
    })

    it('bloqueia criação com nome já existente', async () => {
      mockRepo.findByNome.mockResolvedValue({ id: 'outro-id', nome: 'Reformer' })

      await expect(service.criar({ nome: 'Reformer' })).rejects.toThrow('já existe')
      expect(mockRepo.create).not.toHaveBeenCalled()
    })

    it('rejeita nome vazio', async () => {
      await expect(service.criar({ nome: '' })).rejects.toThrow()
      expect(mockRepo.create).not.toHaveBeenCalled()
    })
  })

  describe('atualizar', () => {
    it('atualiza modalidade existente', async () => {
      mockRepo.findById.mockResolvedValue({ id: 'mod-1', nome: 'Reformer', ativo: true })
      mockRepo.findByNome.mockResolvedValue(null)
      mockRepo.update.mockResolvedValue({ id: 'mod-1', nome: 'Reformer Pro', ativo: true })

      const result = await service.atualizar('mod-1', { nome: 'Reformer Pro' })

      expect(result.nome).toBe('Reformer Pro')
    })

    it('lança AppError quando a modalidade não existe', async () => {
      mockRepo.findById.mockResolvedValue(null)
      await expect(service.atualizar('inexistente', { nome: 'X' })).rejects.toThrow(AppError)
    })

    it('bloqueia renomear para um nome já usado por outra modalidade', async () => {
      mockRepo.findById.mockResolvedValue({ id: 'mod-1', nome: 'Reformer', ativo: true })
      mockRepo.findByNome.mockResolvedValue({ id: 'mod-2', nome: 'Cadillac' })

      await expect(service.atualizar('mod-1', { nome: 'Cadillac' })).rejects.toThrow('já existe')
      expect(mockRepo.update).not.toHaveBeenCalled()
    })

    it('permite manter o próprio nome (não conflita consigo mesma)', async () => {
      mockRepo.findById.mockResolvedValue({ id: 'mod-1', nome: 'Reformer', ativo: true })
      mockRepo.findByNome.mockResolvedValue({ id: 'mod-1', nome: 'Reformer' })
      mockRepo.update.mockResolvedValue({ id: 'mod-1', nome: 'Reformer', ativo: false })

      await expect(service.atualizar('mod-1', { ativo: false })).resolves.toBeDefined()
    })
  })

  describe('listar', () => {
    it('lista todas por padrão', async () => {
      mockRepo.findAll.mockResolvedValue([{ id: 'mod-1' }, { id: 'mod-2' }])
      const result = await service.listar()
      expect(mockRepo.findAll).toHaveBeenCalledWith(false)
      expect(result).toHaveLength(2)
    })

    it('filtra apenas ativas quando solicitado', async () => {
      mockRepo.findAll.mockResolvedValue([{ id: 'mod-1', ativo: true }])
      await service.listar(true)
      expect(mockRepo.findAll).toHaveBeenCalledWith(true)
    })
  })

  describe('excluir', () => {
    it('exclui modalidade sem aulas vinculadas', async () => {
      mockRepo.findById.mockResolvedValue({ id: 'mod-1', nome: 'Reformer' })
      mockRepo.countAulas.mockResolvedValue(0)

      await service.excluir('mod-1')

      expect(mockRepo.delete).toHaveBeenCalledWith('mod-1')
    })

    it('bloqueia exclusão quando existem aulas vinculadas à modalidade', async () => {
      mockRepo.findById.mockResolvedValue({ id: 'mod-1', nome: 'Reformer' })
      mockRepo.countAulas.mockResolvedValue(3)

      await expect(service.excluir('mod-1')).rejects.toThrow('Não é possível excluir')
      expect(mockRepo.delete).not.toHaveBeenCalled()
    })

    it('lança AppError quando a modalidade não existe', async () => {
      mockRepo.findById.mockResolvedValue(null)
      await expect(service.excluir('inexistente')).rejects.toThrow(AppError)
    })
  })
})
