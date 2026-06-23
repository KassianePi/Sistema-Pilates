import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NotificacoesService } from '../notificacoes.service'
import { AppError } from '../../../shared/errors'

vi.mock('../../../events/event-bus', () => ({
  eventBus: { on: vi.fn(), emit: vi.fn() },
}))

vi.mock('../../../database/prisma.client', () => ({
  prisma: {
    usuario: { findMany: vi.fn().mockResolvedValue([{ id: 'admin-1' }, { id: 'admin-2' }]) },
  },
}))

const USUARIO_ID = '11111111-1111-1111-1111-111111111111'
const OUTRO_USUARIO_ID = '99999999-9999-9999-9999-999999999999'

describe('NotificacoesService', () => {
  let service: NotificacoesService
  let mockRepo: any

  beforeEach(() => {
    mockRepo = {
      create: vi.fn(),
      findAll: vi.fn(),
      findById: vi.fn(),
      marcarComoLida: vi.fn(),
      arquivar: vi.fn(),
      countNaoLidas: vi.fn(),
    }
    service = new NotificacoesService(mockRepo)
  })

  describe('criar', () => {
    it('cria notificação com dados válidos', async () => {
      mockRepo.create.mockResolvedValue({
        id: 'notif-1',
        usuarioId: USUARIO_ID,
        tipo: 'MENSAGEM_ADMIN',
        titulo: 'Oi',
        mensagem: 'Teste',
      })

      const result = await service.criar({
        usuarioId: USUARIO_ID,
        tipo: 'MENSAGEM_ADMIN',
        titulo: 'Oi',
        mensagem: 'Teste',
      } as any)

      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ usuarioId: USUARIO_ID, tipo: 'MENSAGEM_ADMIN', titulo: 'Oi', mensagem: 'Teste' }),
      )
      expect(result.id).toBe('notif-1')
    })

    it('rejeita payload sem campos obrigatórios', async () => {
      await expect(service.criar({ usuarioId: USUARIO_ID } as any)).rejects.toThrow()
      expect(mockRepo.create).not.toHaveBeenCalled()
    })
  })

  describe('listar', () => {
    it('lista notificações do usuário com contagem de não lidas', async () => {
      mockRepo.findAll.mockResolvedValue({ notificacoes: [{ id: 'n1' }], total: 1 })
      mockRepo.countNaoLidas.mockResolvedValue(3)

      const result = await service.listar(USUARIO_ID, {})

      expect(mockRepo.findAll).toHaveBeenCalledWith(expect.objectContaining({ usuarioId: USUARIO_ID }))
      expect(result.naoLidas).toBe(3)
      expect(result.total).toBe(1)
    })
  })

  describe('marcarComoLida', () => {
    it('marca como lida quando a notificação pertence ao usuário', async () => {
      mockRepo.findById.mockResolvedValue({ id: 'n1', usuarioId: USUARIO_ID })
      mockRepo.marcarComoLida.mockResolvedValue({ id: 'n1', usuarioId: USUARIO_ID, status: 'LIDA' })

      const result = await service.marcarComoLida('n1', USUARIO_ID)

      expect(result.status).toBe('LIDA')
    })

    it('lança AppError 404 quando a notificação não existe', async () => {
      mockRepo.findById.mockResolvedValue(null)
      await expect(service.marcarComoLida('inexistente', USUARIO_ID)).rejects.toThrow(AppError)
    })

    it('bloqueia marcar como lida notificação de outro usuário', async () => {
      mockRepo.findById.mockResolvedValue({ id: 'n1', usuarioId: OUTRO_USUARIO_ID })

      await expect(service.marcarComoLida('n1', USUARIO_ID)).rejects.toThrow('Sem permissão para esta notificação')
      expect(mockRepo.marcarComoLida).not.toHaveBeenCalled()
    })
  })

  describe('arquivar', () => {
    it('arquiva quando a notificação pertence ao usuário', async () => {
      mockRepo.findById.mockResolvedValue({ id: 'n1', usuarioId: USUARIO_ID })
      mockRepo.arquivar.mockResolvedValue({ id: 'n1', usuarioId: USUARIO_ID, status: 'ARQUIVADA' })

      const result = await service.arquivar('n1', USUARIO_ID)

      expect(result.status).toBe('ARQUIVADA')
    })

    it('bloqueia arquivar notificação de outro usuário', async () => {
      mockRepo.findById.mockResolvedValue({ id: 'n1', usuarioId: OUTRO_USUARIO_ID })

      await expect(service.arquivar('n1', USUARIO_ID)).rejects.toThrow('Sem permissão para esta notificação')
      expect(mockRepo.arquivar).not.toHaveBeenCalled()
    })
  })

  describe('notificarAdmins', () => {
    it('cria uma notificação para cada admin ativo', async () => {
      mockRepo.create.mockResolvedValue({})

      await service.notificarAdmins('Título', 'Mensagem')

      expect(mockRepo.create).toHaveBeenCalledTimes(2)
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ usuarioId: 'admin-1', tipo: 'MENSAGEM_ADMIN' }),
      )
    })
  })
})
