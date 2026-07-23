/**
 * Repository de Autenticação
 *
 * Responsável por todas as operações de banco de dados relacionadas a usuários
 */

import { prisma } from '../../database/prisma.client'
import { AppError } from '../../shared/errors'
import { logDebug, logError } from '../../shared/utils'
import { USUARIO_SISTEMA_ID } from '../pagamentos-pix/pagamentos-pix.constants'
import type { Usuario, CreateUsuarioData } from './auth.types'

/**
 * Repository de autenticação
 */
export class AuthRepository {
  /**
   * Busca usuário por email
   *
   * @param email - Email do usuário
   * @returns Usuário encontrado ou undefined
   */
  async findByEmail(email: string): Promise<Usuario | null> {
    try {
      logDebug('Buscando usuário por email', { email })

      const usuario = await prisma.usuario.findUnique({
        where: { email },
      })

      if (usuario) {
        logDebug('✅ Usuário encontrado', { email, usuarioId: usuario.id })
      } else {
        logDebug('❌ Usuário não encontrado', { email })
      }

      return usuario
    } catch (error) {
      logError('Erro ao buscar usuário por email', error as Error, { email })
      throw AppError.internal('Erro ao buscar usuário')
    }
  }

  /**
   * Busca usuário por ID
   *
   * @param id - ID do usuário
   * @returns Usuário encontrado ou undefined
   */
  async findById(id: string): Promise<Usuario | null> {
    try {
      logDebug('Buscando usuário por ID', { usuarioId: id })

      const usuario = await prisma.usuario.findUnique({
        where: { id },
      })

      return usuario
    } catch (error) {
      logError('Erro ao buscar usuário por ID', error as Error, { usuarioId: id })
      throw AppError.internal('Erro ao buscar usuário')
    }
  }

  /**
   * Cria novo usuário
   *
   * @param data - Dados do usuário (com senhaHash)
   * @returns Usuário criado
   * @throws AppError se email já existe
   */
  async create(data: CreateUsuarioData & { senhaHash: string }): Promise<Usuario> {
    try {
      logDebug('Criando novo usuário', { email: data.email })

      // Verificar se email já existe
      const existing = await this.findByEmail(data.email)
      if (existing) {
        throw AppError.conflict('Email já cadastrado')
      }

      // Criar usuário
      const usuario = await prisma.usuario.create({
        data: {
          email: data.email.toLowerCase(),
          nomeCompleto: data.nomeCompleto,
          cpf: data.cpf,
          telefone: data.telefone || null,
          senhaHash: data.senhaHash,
          funcao: data.funcao,
          status: 'ATIVO',
        },
      })

      logDebug('✅ Usuário criado com sucesso', { usuarioId: usuario.id })

      return usuario
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }

      logError('Erro ao criar usuário', error as Error, { email: data.email })
      throw AppError.internal('Erro ao criar usuário')
    }
  }

  /**
   * Atualiza hash de senha do usuário
   *
   * @param usuarioId - ID do usuário
   * @param novoSenhaHash - Novo hash da senha
   * @returns Usuário atualizado
   */
  async updatePassword(usuarioId: string, novoSenhaHash: string): Promise<Usuario> {
    try {
      logDebug('Atualizando senha do usuário', { usuarioId })

      const usuario = await prisma.usuario.update({
        where: { id: usuarioId },
        data: {
          senhaHash: novoSenhaHash,
        },
      })

      logDebug('✅ Senha atualizada com sucesso', { usuarioId })

      return usuario
    } catch (error) {
      logError('Erro ao atualizar senha', error as Error, { usuarioId })
      throw AppError.internal('Erro ao atualizar senha')
    }
  }

  /**
   * Ativa/desativa usuário
   *
   * @param usuarioId - ID do usuário
   * @param ativo - true para ativar, false para desativar
   * @returns Usuário atualizado
   */
  async updateStatus(usuarioId: string, ativo: boolean): Promise<Usuario> {
    try {
      logDebug('Alterando status do usuário', { usuarioId, ativo })

      const usuario = await prisma.usuario.update({
        where: { id: usuarioId },
        data: { status: ativo ? 'ATIVO' : 'INATIVO' },
      })

      logDebug('✅ Status alterado com sucesso', { usuarioId, ativo })

      return usuario
    } catch (error) {
      logError('Erro ao alterar status', error as Error, { usuarioId })
      throw AppError.internal('Erro ao alterar status')
    }
  }

  /**
   * Lista todos os usuários (admin only)
   *
   * @param limit - Limite de resultados
   * @param offset - Offset para paginação
   * @returns Array de usuários
   */
  async findAll(limit: number = 20, offset: number = 0): Promise<Usuario[]> {
    try {
      const usuarios = await prisma.usuario.findMany({
        take: limit,
        skip: offset,
        orderBy: {
          criadoEm: 'desc',
        },
      })

      return usuarios
    } catch (error) {
      logError('Erro ao listar usuários', error as Error)
      throw AppError.internal('Erro ao listar usuários')
    }
  }

  /**
   * Lista usuários do sistema (exclui alunos), com filtro opcional por funcao
   */
  async findSistema(limit: number = 20, offset: number = 0, funcao?: string): Promise<Usuario[]> {
    try {
      const usuarios = await prisma.usuario.findMany({
        where: {
          funcao: funcao ? { equals: funcao as any } : { notIn: ['ALUNO'] as any[] },
        },
        take: limit,
        skip: offset,
        orderBy: { criadoEm: 'desc' },
      })
      return usuarios
    } catch (error) {
      logError('Erro ao listar usuários do sistema', error as Error)
      throw AppError.internal('Erro ao listar usuários')
    }
  }

  /**
   * Conta usuários do sistema (exclui alunos), com filtro opcional por funcao
   */
  async countSistema(funcao?: string): Promise<number> {
    try {
      return await prisma.usuario.count({
        where: {
          funcao: funcao ? { equals: funcao as any } : { notIn: ['ALUNO'] as any[] },
        },
      })
    } catch (error) {
      logError('Erro ao contar usuários do sistema', error as Error)
      throw AppError.internal('Erro ao contar usuários')
    }
  }

  /**
   * Atualiza dados básicos de um usuário
   */
  async updateDados(
    usuarioId: string,
    dados: { nomeCompleto?: string; telefone?: string | null; email?: string; senhaHash?: string },
  ): Promise<Usuario> {
    try {
      logDebug('Atualizando dados do usuário', { usuarioId })
      const usuario = await prisma.usuario.update({
        where: { id: usuarioId },
        data: {
          ...(dados.nomeCompleto !== undefined && { nomeCompleto: dados.nomeCompleto }),
          ...(dados.telefone !== undefined && { telefone: dados.telefone }),
          ...(dados.email && { email: dados.email }),
          ...(dados.senhaHash && { senhaHash: dados.senhaHash }),
        },
      })
      logDebug('✅ Dados do usuário atualizados', { usuarioId })
      return usuario
    } catch (error) {
      logError('Erro ao atualizar dados do usuário', error as Error, { usuarioId })
      throw AppError.internal('Erro ao atualizar usuário')
    }
  }

  /**
   * Conta total de usuários
   *
   * @returns Total de usuários
   */
  async count(): Promise<number> {
    try {
      // Exclui o usuário interno de sistema (Mercado Pago), semeado no boot via
      // seedUsuarioSistema(). Ele não é um usuário "cadastrado" no sentido do
      // produto — é um artefato interno para baixas automáticas de PIX. Sem
      // essa exclusão, o setup inicial (primeiro admin) sempre retornaria 409
      // num banco recém-criado, porque já haveria 1 usuário (o de sistema).
      return await prisma.usuario.count({ where: { id: { not: USUARIO_SISTEMA_ID } } })
    } catch (error) {
      logError('Erro ao contar usuários', error as Error)
      throw AppError.internal('Erro ao contar usuários')
    }
  }

  /**
   * Deleta usuário (soft delete via status)
   *
   * @param usuarioId - ID do usuário
   * @returns void
   */
  async delete(usuarioId: string): Promise<void> {
    try {
      logDebug('Deletando usuário', { usuarioId })

      // Soft delete - apenas desativar
      await this.updateStatus(usuarioId, false)

      logDebug('✅ Usuário deletado (desativado)', { usuarioId })
    } catch (error) {
      logError('Erro ao deletar usuário', error as Error, { usuarioId })
      throw AppError.internal('Erro ao deletar usuário')
    }
  }
}

/**
 * Singleton da repository
 */
export const authRepository = new AuthRepository()
