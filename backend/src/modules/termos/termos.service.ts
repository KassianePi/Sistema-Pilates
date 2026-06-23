import { TermosRepository } from './termos.repository'
import { AppError } from '../../shared/errors'
import { logInfo } from '../../shared/utils'
import { criarTermoSchema, editarTermoSchema } from '../../shared/schemas'
import { registrarLog } from '../auditoria/auditoria.service'
import { TERMOS_ERRORS } from './termos.constants'
import type { StatusTermoAluno } from './termos.types'

export class TermosService {
  constructor(private repository: TermosRepository) {}

  // ----------------------------------------------------------------
  // Administração (ADMIN)
  // ----------------------------------------------------------------

  async listar() {
    return this.repository.findAll()
  }

  async buscarPorId(id: string) {
    const termo = await this.repository.findById(id)
    if (!termo) throw AppError.notFound('Termo', id)
    return termo
  }

  async criar(data: unknown, criadoPorId?: string) {
    const validado = criarTermoSchema.parse(data)
    const versao = await this.repository.proximaVersao()
    const termo = await this.repository.criar({
      versao,
      titulo: validado.titulo,
      conteudo: validado.conteudo,
      criadoPorId: criadoPorId ?? null,
    })
    logInfo('Termo criado (rascunho)', { id: termo.id, versao })
    if (criadoPorId)
      await registrarLog({ usuarioId: criadoPorId, acao: 'CREATE', entidade: 'TermoUso', entidadeId: termo.id })
    return termo
  }

  async editar(id: string, data: unknown, realizadoPorId?: string) {
    const termo = await this.buscarPorId(id)
    // Versões publicadas são imutáveis — preserva a integridade dos aceites já registrados.
    if (termo.publicado) throw AppError.badRequest(TERMOS_ERRORS.JA_PUBLICADO)
    const validado = editarTermoSchema.parse(data)
    const atualizado = await this.repository.atualizar(id, validado)
    logInfo('Termo editado', { id })
    if (realizadoPorId)
      await registrarLog({ usuarioId: realizadoPorId, acao: 'UPDATE', entidade: 'TermoUso', entidadeId: id })
    return atualizado
  }

  async publicar(id: string, realizadoPorId?: string) {
    await this.buscarPorId(id)
    const termo = await this.repository.publicar(id)
    logInfo('Termo publicado', { id, versao: termo.versao })
    if (realizadoPorId)
      await registrarLog({ usuarioId: realizadoPorId, acao: 'UPDATE', entidade: 'TermoUso', entidadeId: id })
    return termo
  }

  async listarAceites(termoId: string) {
    await this.buscarPorId(termoId)
    return this.repository.aceitesDoTermo(termoId)
  }

  // ----------------------------------------------------------------
  // Portal do aluno (ALUNO)
  // ----------------------------------------------------------------

  async statusDoAluno(usuarioId: string): Promise<StatusTermoAluno> {
    const alunoId = await this.repository.alunoIdPorUsuario(usuarioId)
    if (!alunoId) throw new AppError(TERMOS_ERRORS.ALUNO_NOT_FOUND, 'FORBIDDEN', 403)

    const atual = await this.repository.findAtual()
    // Sem termo publicado → portal não exige aceite (fail-open, não bloqueia).
    if (!atual) {
      return { requerAceite: false, aceito: false, versaoAtual: null, versaoAceita: null, aceitoEm: null, termo: null }
    }

    const aceite = await this.repository.findAceite(atual.id, alunoId)
    return {
      requerAceite: !aceite,
      aceito: !!aceite,
      versaoAtual: atual.versao,
      versaoAceita: aceite?.versao ?? null,
      aceitoEm: aceite?.aceitoEm ?? null,
      termo: atual,
    }
  }

  async registrarAceite(usuarioId: string, contexto: { enderecoIp?: string | null; userAgent?: string | null }) {
    const alunoId = await this.repository.alunoIdPorUsuario(usuarioId)
    if (!alunoId) throw new AppError(TERMOS_ERRORS.ALUNO_NOT_FOUND, 'FORBIDDEN', 403)

    const atual = await this.repository.findAtual()
    if (!atual) throw AppError.badRequest(TERMOS_ERRORS.SEM_TERMO_PUBLICADO)

    const aceite = await this.repository.registrarAceite({
      termoId: atual.id,
      alunoId,
      versao: atual.versao,
      enderecoIp: contexto.enderecoIp ?? null,
      userAgent: contexto.userAgent ?? null,
    })
    logInfo('Aceite de termo registrado', { alunoId, termoId: atual.id, versao: atual.versao })
    // Auditoria: o aceite é resolvido pelo usuário autenticado (não forjável).
    await registrarLog({ usuarioId, acao: 'CREATE', entidade: 'TermoAceite', entidadeId: aceite.id }).catch(() => {})
    return aceite
  }

  async meusAceites(usuarioId: string) {
    const alunoId = await this.repository.alunoIdPorUsuario(usuarioId)
    if (!alunoId) throw new AppError(TERMOS_ERRORS.ALUNO_NOT_FOUND, 'FORBIDDEN', 403)
    return this.repository.aceitesDoAluno(alunoId)
  }
}

export const termosService = new TermosService(new TermosRepository())
