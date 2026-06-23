import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AuditoriaService, registrarLog } from '../auditoria.service'

describe('AuditoriaService', () => {
  let service: AuditoriaService
  let mockRepo: any

  beforeEach(() => {
    mockRepo = {
      create: vi.fn(),
      findAll: vi.fn(),
    }
    service = new AuditoriaService(mockRepo)
  })

  describe('registrar', () => {
    it('cria um log de auditoria com os dados informados', async () => {
      mockRepo.create.mockResolvedValue({ id: 'log-1', acao: 'CREATE', entidade: 'Aluno', entidadeId: 'aluno-1' })

      const result = await service.registrar({
        usuarioId: 'u-1',
        acao: 'CREATE',
        entidade: 'Aluno',
        entidadeId: 'aluno-1',
      })

      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ usuarioId: 'u-1', acao: 'CREATE', entidade: 'Aluno', entidadeId: 'aluno-1' }),
      )
      expect(result.id).toBe('log-1')
    })
  })

  describe('listar', () => {
    it('filtra por usuarioId, acao, entidade e período, e calcula totalPages', async () => {
      mockRepo.findAll.mockResolvedValue({ logs: [{ id: 'log-1' }], total: 25 })

      const result = await service.listar({
        usuarioId: '11111111-1111-1111-1111-111111111111',
        acao: 'UPDATE',
        entidade: 'Aluno',
        dataInicio: '2026-06-01',
        dataFim: '2026-06-30',
        page: 2,
        limit: 10,
      })

      expect(mockRepo.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          usuarioId: '11111111-1111-1111-1111-111111111111',
          acao: 'UPDATE',
          entidade: 'Aluno',
          page: 2,
          limit: 10,
        }),
      )
      expect(result.total).toBe(25)
      expect(result.totalPages).toBe(3) // ceil(25/10)
    })

    it('usa página 1 e limite padrão quando não informados', async () => {
      mockRepo.findAll.mockResolvedValue({ logs: [], total: 0 })
      const result = await service.listar({})
      expect(result.page).toBe(1)
      expect(mockRepo.findAll).toHaveBeenCalledWith(expect.objectContaining({ page: 1 }))
    })
  })

  describe('listarParaExportacao', () => {
    it('busca sem limite de paginação (até EXPORT_LIMIT) para exportação CSV', async () => {
      mockRepo.findAll.mockResolvedValue({
        logs: Array.from({ length: 150 }, (_, i) => ({ id: `log-${i}` })),
        total: 150,
      })

      const logs = await service.listarParaExportacao({ entidade: 'Aluno' })

      expect(mockRepo.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ entidade: 'Aluno', page: 1, limit: 10000 }),
      )
      expect(logs).toHaveLength(150)
    })
  })

  describe('registrarLog (helper fail-silent)', () => {
    it('não lança erro mesmo quando o registro falha (ex: FK inválida)', async () => {
      // registrarLog usa o singleton real (auditoriaService + repository real) — usar um
      // usuarioId inexistente força uma falha de FK no banco, validando que o helper
      // nunca propaga exceção (contrato "fail-silent", para não bloquear a operação principal).
      await expect(
        registrarLog({ usuarioId: 'usuario-que-nao-existe', acao: 'CREATE', entidade: 'X', entidadeId: 'x-1' }),
      ).resolves.toBeUndefined()
    })
  })
})
