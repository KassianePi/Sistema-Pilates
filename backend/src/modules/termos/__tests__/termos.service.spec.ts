import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TermosService } from '../termos.service'

// Evita instanciar o PrismaClient real (a auditoria importa o client).
vi.mock('../../../database/prisma.client', () => ({
  prisma: { logAuditoria: { create: vi.fn().mockResolvedValue({}) } },
}))

const USUARIO_ID = '11111111-1111-1111-1111-111111111111'
const ALUNO_ID = '22222222-2222-2222-2222-222222222222'
const TERMO_ID = '33333333-3333-3333-3333-333333333333'

const termoAtual = {
  id: TERMO_ID,
  versao: 2,
  titulo: 'Termos de Uso',
  conteudo: 'Conteúdo do termo com mais de vinte caracteres.',
  publicado: true,
  publicadoEm: new Date(),
  criadoPorId: null,
  criadoEm: new Date(),
  atualizadoEm: new Date(),
}

describe('TermosService', () => {
  let service: TermosService
  let mockRepo: any

  beforeEach(() => {
    mockRepo = {
      findAll: vi.fn(),
      findById: vi.fn(),
      proximaVersao: vi.fn(),
      criar: vi.fn(),
      atualizar: vi.fn(),
      publicar: vi.fn(),
      findAtual: vi.fn(),
      findAceite: vi.fn(),
      registrarAceite: vi.fn(),
      aceitesDoAluno: vi.fn(),
      aceitesDoTermo: vi.fn(),
      alunoIdPorUsuario: vi.fn(),
    }
    service = new TermosService(mockRepo)
  })

  describe('criar', () => {
    it('usa a próxima versão calculada e persiste o rascunho', async () => {
      mockRepo.proximaVersao.mockResolvedValue(3)
      mockRepo.criar.mockImplementation((d: any) => Promise.resolve({ id: 'novo', ...d }))

      const termo = await service.criar({
        titulo: 'Nova versão',
        conteudo: 'Conteúdo com mais de vinte caracteres aqui.',
      })

      expect(mockRepo.criar).toHaveBeenCalledWith(expect.objectContaining({ versao: 3 }))
      expect(termo.versao).toBe(3)
    })

    it('rejeita título muito curto (validação Zod)', async () => {
      await expect(
        service.criar({ titulo: 'x', conteudo: 'Conteúdo com mais de vinte caracteres aqui.' }),
      ).rejects.toThrow()
    })
  })

  describe('editar', () => {
    it('bloqueia edição de versão já publicada', async () => {
      mockRepo.findById.mockResolvedValue(termoAtual)
      await expect(service.editar(TERMO_ID, { titulo: 'Tentativa de edição' })).rejects.toThrow()
      expect(mockRepo.atualizar).not.toHaveBeenCalled()
    })

    it('permite editar rascunho não publicado', async () => {
      mockRepo.findById.mockResolvedValue({ ...termoAtual, publicado: false })
      mockRepo.atualizar.mockResolvedValue({ ...termoAtual, publicado: false, titulo: 'Editado e válido' })
      const r = await service.editar(TERMO_ID, { titulo: 'Editado e válido' })
      expect(r.titulo).toBe('Editado e válido')
    })
  })

  describe('statusDoAluno', () => {
    it('lança 403 quando o usuário não é aluno', async () => {
      mockRepo.alunoIdPorUsuario.mockResolvedValue(null)
      await expect(service.statusDoAluno(USUARIO_ID)).rejects.toThrow()
    })

    it('não exige aceite quando não há termo publicado (fail-open)', async () => {
      mockRepo.alunoIdPorUsuario.mockResolvedValue(ALUNO_ID)
      mockRepo.findAtual.mockResolvedValue(null)
      const status = await service.statusDoAluno(USUARIO_ID)
      expect(status.requerAceite).toBe(false)
      expect(status.termo).toBeNull()
    })

    it('requer aceite quando há termo publicado e o aluno ainda não aceitou', async () => {
      mockRepo.alunoIdPorUsuario.mockResolvedValue(ALUNO_ID)
      mockRepo.findAtual.mockResolvedValue(termoAtual)
      mockRepo.findAceite.mockResolvedValue(null)
      const status = await service.statusDoAluno(USUARIO_ID)
      expect(status.requerAceite).toBe(true)
      expect(status.versaoAtual).toBe(2)
    })

    it('não requer aceite quando o aluno já aceitou a versão atual', async () => {
      mockRepo.alunoIdPorUsuario.mockResolvedValue(ALUNO_ID)
      mockRepo.findAtual.mockResolvedValue(termoAtual)
      mockRepo.findAceite.mockResolvedValue({ id: 'a1', versao: 2, aceitoEm: new Date() })
      const status = await service.statusDoAluno(USUARIO_ID)
      expect(status.requerAceite).toBe(false)
      expect(status.aceito).toBe(true)
      expect(status.versaoAceita).toBe(2)
    })
  })

  describe('registrarAceite', () => {
    it('falha quando não há termo publicado', async () => {
      mockRepo.alunoIdPorUsuario.mockResolvedValue(ALUNO_ID)
      mockRepo.findAtual.mockResolvedValue(null)
      await expect(service.registrarAceite(USUARIO_ID, {})).rejects.toThrow()
    })

    it('registra o aceite resolvendo o aluno pelo usuário autenticado', async () => {
      mockRepo.alunoIdPorUsuario.mockResolvedValue(ALUNO_ID)
      mockRepo.findAtual.mockResolvedValue(termoAtual)
      mockRepo.registrarAceite.mockResolvedValue({ id: 'aceite-1', termoId: TERMO_ID, alunoId: ALUNO_ID, versao: 2 })

      const aceite = await service.registrarAceite(USUARIO_ID, { enderecoIp: '127.0.0.1', userAgent: 'jest' })

      expect(mockRepo.registrarAceite).toHaveBeenCalledWith(
        expect.objectContaining({ termoId: TERMO_ID, alunoId: ALUNO_ID, versao: 2 }),
      )
      expect(aceite.id).toBe('aceite-1')
    })
  })
})
