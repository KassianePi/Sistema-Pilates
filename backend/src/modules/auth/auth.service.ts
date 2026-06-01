/**
 * Service de Autenticação
 *
 * Contém toda a lógica de negócio relacionada a autenticação:
 * - Login
 * - Register
 * - Refresh Token
 * - Validação de credentials
 */

import { AuthRepository } from './auth.repository'
import { hashPassword, verifyPassword, generateRandomPassword } from '../../shared/utils/hash'
import { generateAccessToken, generateRefreshToken, generateTokens, verifyRefreshToken } from '../../shared/utils/jwt'
import { UnauthorizedError, ValidationError } from '../../shared/errors'
import { logInfo, logWarn, logDebug } from '../../shared/utils'
import { loginSchema, registerSchema, setupSchema, criarUsuarioSchema } from '../../shared/schemas'
import { AUTH_ERRORS } from './auth.constants'
import { registrarLog } from '../auditoria/auditoria.service'
import { AppError } from '../../shared/errors'
import type { LoginResponse, RegisterResponse, RefreshTokenResult, CreateUsuarioData, Usuario } from './auth.types'

/**
 * Service de autenticação
 */
export class AuthService {
  constructor(private repository: AuthRepository) {}

  /**
   * Login do usuário
   *
   * @param email - Email do usuário
   * @param senha - Senha em texto plano
   * @returns LoginResponse com tokens
   * @throws UnauthorizedError se credenciais inválidas
   * @throws ValidationError se entrada inválida
   */
  async login(email: string, senha: string): Promise<LoginResponse> {
    try {
      // Validar entrada com Zod
      const { email: emailValidado, senha: senhaValidada } = loginSchema.parse({
        email,
        senha,
      })

      logDebug('Login iniciado', { email: emailValidado })

      // Buscar usuário
      const usuario = await this.repository.findByEmail(emailValidado)

      if (!usuario) {
        logWarn('Tentativa de login com email não cadastrado', {
          email: emailValidado,
          ip: 'unknown', // será preenchido pelo middleware
        })
        throw UnauthorizedError.invalidCredentials()
      }

      // Verificar se usuário está ativo
      if (usuario.status !== 'ATIVO') {
        logWarn('Tentativa de login com usuário inativo', {
          email: emailValidado,
          usuarioId: usuario.id,
          status: usuario.status,
        })
        throw UnauthorizedError.insufficientPermission(AUTH_ERRORS.USER_INACTIVE)
      }

      // Validar senha
      const senhaCorreta = await verifyPassword(senhaValidada, usuario.senhaHash)

      if (!senhaCorreta) {
        logWarn('Tentativa de login com senha incorreta', {
          email: emailValidado,
          usuarioId: usuario.id,
        })
        throw UnauthorizedError.invalidCredentials()
      }

      // Gerar tokens
      const { accessToken, refreshToken, expiresIn } = generateTokens({
        usuarioId: usuario.id,
        email: usuario.email,
        funcao: usuario.funcao,
      })

      logInfo('✅ Login realizado com sucesso', {
        usuarioId: usuario.id,
        email: usuario.email,
        funcao: usuario.funcao,
      })

      await registrarLog({ usuarioId: usuario.id, acao: 'LOGIN', entidade: 'Usuario', entidadeId: usuario.id })

      return {
        usuarioId: usuario.id,
        email: usuario.email,
        nome: usuario.nomeCompleto,
        funcao: usuario.funcao,
        accessToken,
        refreshToken,
        expiresIn,
      }
    } catch (error) {
      if (error instanceof UnauthorizedError || error instanceof ValidationError) {
        throw error
      }

      logWarn('Erro durante login', {
        email,
        error: error instanceof Error ? error.message : String(error),
      })

      throw UnauthorizedError.invalidCredentials()
    }
  }

  /**
   * Registro de novo usuário
   *
   * @param email - Email do novo usuário
   * @param nome - Nome do novo usuário
   * @param senha - Senha em texto plano
   * @param senhaConfirmacao - Confirmação da senha
   * @param funcao - Role do novo usuário (default: RECEPCIONISTA)
   * @returns RegisterResponse com tokens
   * @throws ValidationError se dados inválidos
   * @throws AppError se email já existe
   */
  async register(
    email: string,
    nome: string,
    cpf: string,
    senha: string,
    senhaConfirmacao: string,
    telefone?: string | null,
    funcao: 'ADMIN' | 'PROFESSOR' | 'RECEPCIONISTA' | 'FINANCEIRO' = 'RECEPCIONISTA',
  ): Promise<RegisterResponse> {
    try {
      // Validar entrada com Zod
      const dadosValidados = registerSchema.parse({
        email,
        nome,
        cpf,
        telefone,
        senha,
        senhaConfirmacao,
      })

      logDebug('Registro iniciado', { email: dadosValidados.email })

      // Verificar se email já existe
      const emailExistente = await this.repository.findByEmail(dadosValidados.email)
      if (emailExistente) {
        throw ValidationError.forField('email', AUTH_ERRORS.USER_ALREADY_EXISTS)
      }

      // Hash da senha
      const senhaHash = await hashPassword(dadosValidados.senha)

      // Criar usuário
      const usuario = await this.repository.create({
        email: dadosValidados.email,
        nomeCompleto: dadosValidados.nome,
        cpf: dadosValidados.cpf,
        telefone: dadosValidados.telefone,
        senha: dadosValidados.senha,
        funcao: funcao as any, // FuncaoUsuario
        senhaHash,
      })

      // Gerar tokens
      const { accessToken, refreshToken, expiresIn } = generateTokens({
        usuarioId: usuario.id,
        email: usuario.email,
        funcao: usuario.funcao,
      })

      logInfo('✅ Novo usuário registrado com sucesso', {
        usuarioId: usuario.id,
        email: usuario.email,
        funcao: usuario.funcao,
      })

      await registrarLog({ usuarioId: usuario.id, acao: 'CREATE', entidade: 'Usuario', entidadeId: usuario.id })

      return {
        usuarioId: usuario.id,
        email: usuario.email,
        nome: usuario.nomeCompleto,
        funcao: usuario.funcao,
        accessToken,
        refreshToken,
        expiresIn,
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error
      }

      logWarn('Erro durante registro', {
        email,
        error: error instanceof Error ? error.message : String(error),
      })

      throw error
    }
  }

  /**
   * Renovação de access token usando refresh token
   *
   * Implementa rotação de refresh token:
   * - Valida refresh token antigo
   * - Gera novo access token
   * - Gera novo refresh token (rotação)
   *
   * @param refreshTokenAntigo - Refresh token antigo
   * @returns RefreshTokenResult com novo access token e refresh token
   * @throws UnauthorizedError se refresh token inválido/expirado
   */
  async refreshToken(refreshTokenAntigo: string): Promise<RefreshTokenResult> {
    try {
      logDebug('Renovação de token iniciada')

      // Validar refresh token
      const payload = verifyRefreshToken(refreshTokenAntigo)

      logDebug('✅ Refresh token validado', { usuarioId: payload.usuarioId })

      // Buscar usuário
      const usuario = await this.repository.findById(payload.usuarioId)

      if (!usuario) {
        throw UnauthorizedError.tokenInvalid('Usuário não encontrado')
      }

      if (usuario.status !== 'ATIVO') {
        throw UnauthorizedError.insufficientPermission(AUTH_ERRORS.USER_INACTIVE)
      }

      // Gerar novo access token
      const novoAccessToken = generateAccessToken({
        usuarioId: usuario.id,
        email: usuario.email,
        funcao: usuario.funcao,
      })

      // Gerar novo refresh token (rotação)
      const novoRefreshToken = generateRefreshToken({
        usuarioId: usuario.id,
        email: usuario.email,
        funcao: usuario.funcao,
      })

      logInfo('✅ Token renovado com sucesso (rotação aplicada)', {
        usuarioId: usuario.id,
        email: usuario.email,
      })

      return {
        accessToken: novoAccessToken,
        refreshToken: novoRefreshToken,
        expiresIn: 15 * 60, // 15 minutos em segundos
      }
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        throw error
      }

      logWarn('Erro ao renovar token', {
        error: error instanceof Error ? error.message : String(error),
      })

      throw UnauthorizedError.tokenInvalid()
    }
  }

  /**
   * Logout (client-side, apenas log)
   *
   * Nota: JWT é stateless, então logout real depende de
   * blacklist ou remoção do token no cliente
   *
   * @param usuarioId - ID do usuário
   * @param email - Email do usuário
   */
  async logout(usuarioId: string, email: string): Promise<void> {
    logInfo('✅ Usuário fez logout', {
      usuarioId,
      email,
    })
    await registrarLog({ usuarioId, acao: 'LOGOUT', entidade: 'Usuario', entidadeId: usuarioId })
  }

  /**
   * Setup inicial do sistema — cria o primeiro admin
   * Só funciona quando não há nenhum usuário cadastrado
   */
  async setup(
    email: string,
    nome: string,
    cpf: string,
    senha: string,
    senhaConfirmacao: string,
    telefone?: string | null,
  ): Promise<RegisterResponse> {
    const total = await this.repository.count()
    if (total > 0) {
      throw new AppError('Sistema já foi configurado. Use o login de admin para criar novos usuários.', 'SETUP_ALREADY_DONE', 409)
    }

    const dados = setupSchema.parse({ email, nome, cpf, senha, senhaConfirmacao, telefone })
    const senhaHash = await hashPassword(dados.senha)

    const usuario = await this.repository.create({
      email: dados.email,
      nomeCompleto: dados.nome,
      cpf: dados.cpf,
      telefone: dados.telefone,
      funcao: 'ADMIN',
      senhaHash,
      senha: dados.senha,
    })

    const { accessToken, refreshToken, expiresIn } = generateTokens({
      usuarioId: usuario.id,
      email: usuario.email,
      funcao: usuario.funcao,
    })

    logInfo('✅ Setup inicial concluído — admin criado', { usuarioId: usuario.id, email: usuario.email })
    await registrarLog({ usuarioId: usuario.id, acao: 'CREATE', entidade: 'Usuario', entidadeId: usuario.id })

    return { usuarioId: usuario.id, email: usuario.email, nome: usuario.nomeCompleto, funcao: usuario.funcao, accessToken, refreshToken, expiresIn }
  }

  /**
   * Cria usuário do sistema (admin, professor, recepcionista, financeiro)
   * Requer autenticação de ADMIN
   */
  async criarUsuario(
    email: string,
    nome: string,
    cpf: string,
    senha: string,
    senhaConfirmacao: string,
    funcao: 'ADMIN' | 'PROFESSOR' | 'RECEPCIONISTA' | 'FINANCEIRO',
    telefone?: string | null,
  ): Promise<RegisterResponse> {
    const dados = criarUsuarioSchema.parse({ email, nome, cpf, senha, senhaConfirmacao, funcao, telefone })

    const emailExistente = await this.repository.findByEmail(dados.email)
    if (emailExistente) {
      throw ValidationError.forField('email', AUTH_ERRORS.USER_ALREADY_EXISTS)
    }

    const senhaHash = await hashPassword(dados.senha)

    const usuario = await this.repository.create({
      email: dados.email,
      nomeCompleto: dados.nome,
      cpf: dados.cpf,
      telefone: dados.telefone,
      funcao: dados.funcao as any,
      senhaHash,
      senha: dados.senha,
    })

    const { accessToken, refreshToken, expiresIn } = generateTokens({
      usuarioId: usuario.id,
      email: usuario.email,
      funcao: usuario.funcao,
    })

    logInfo('✅ Usuário criado pelo admin', { usuarioId: usuario.id, email: usuario.email, funcao: usuario.funcao })
    await registrarLog({ usuarioId: usuario.id, acao: 'CREATE', entidade: 'Usuario', entidadeId: usuario.id })

    return { usuarioId: usuario.id, email: usuario.email, nome: usuario.nomeCompleto, funcao: usuario.funcao, accessToken, refreshToken, expiresIn }
  }

  /**
   * Gera senha temporária (para reset)
   *
   * @returns Senha aleatória de 12 caracteres
   */
  generateTemporaryPassword(): string {
    return generateRandomPassword()
  }

  /**
   * Muda senha do usuário
   *
   * @param usuarioId - ID do usuário
   * @param senhaAtual - Senha atual em texto plano
   * @param novaSenha - Nova senha em texto plano
   * @returns void
   * @throws UnauthorizedError se senha atual incorreta
   */
  async changePassword(usuarioId: string, senhaAtual: string, novaSenha: string): Promise<void> {
    try {
      logDebug('Mudança de senha iniciada', { usuarioId })

      // Buscar usuário
      const usuario = await this.repository.findById(usuarioId)

      if (!usuario) {
        throw UnauthorizedError.tokenInvalid('Usuário não encontrado')
      }

      // Validar senha atual
      const senhaCorreta = await verifyPassword(senhaAtual, usuario.senhaHash)

      if (!senhaCorreta) {
        logWarn('Tentativa de mudança de senha com senha incorreta', {
          usuarioId,
          email: usuario.email,
        })
        throw UnauthorizedError.invalidCredentials('Senha atual incorreta')
      }

      // Hash da nova senha
      const novoSenhaHash = await hashPassword(novaSenha)

      // Atualizar no banco
      await this.repository.updatePassword(usuarioId, novoSenhaHash)

      logInfo('✅ Senha alterada com sucesso', {
        usuarioId,
        email: usuario.email,
      })

      await registrarLog({ usuarioId, acao: 'UPDATE', entidade: 'Usuario', entidadeId: usuarioId })
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        throw error
      }

      logWarn('Erro ao mudar senha', {
        usuarioId,
        error: error instanceof Error ? error.message : String(error),
      })

      throw error
    }
  }
}

/**
 * Singleton do service
 */
export const authService = new AuthService(new AuthRepository())
