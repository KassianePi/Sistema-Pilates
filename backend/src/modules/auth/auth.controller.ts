/**
 * Controller de Autenticação
 *
 * Responsável por:
 * - Receber e validar requests HTTP
 * - Chamar métodos do AuthService
 * - Retornar respostas padronizadas
 *
 * Padrão: Request → Validação (Zod) → Service → Response
 */

import type { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { authService } from './auth.service'
import { ValidationError, UnauthorizedError, AppError } from '../../shared/errors'
import {
  loginSchema,
  registerSchema,
  refreshTokenSchema,
  changePasswordSchema,
  setupSchema,
  criarUsuarioSchema,
} from '../../shared/schemas'
import { logInfo, logDebug, logWarn } from '../../shared/utils'

/**
 * POST /api/v1/auth/login
 *
 * Autentica usuário com email e senha
 *
 * @example
 * Request body:
 * {
 *   "email": "user@pilates.local",
 *   "senha": "senha123"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "usuarioId": "uuid",
 *     "email": "user@pilates.local",
 *     "nome": "João Silva",
 *     "funcao": "ADMIN",
 *     "accessToken": "jwt...",
 *     "refreshToken": "jwt...",
 *     "expiresIn": 900
 *   }
 * }
 */
export async function login(request: FastifyRequest, reply: FastifyReply) {
  try {
    // Validar entrada
    const { email, senha } = loginSchema.parse(request.body)

    logDebug('Controller: login iniciado', { email })

    const resultado = await authService.login(email, senha)

    // Alunos não podem acessar o painel administrativo
    if (resultado.funcao === 'ALUNO') {
      logWarn('Tentativa de acesso ao painel admin com conta de aluno', { email })
      return reply.code(401).send({
        success: false,
        message: 'E-mail ou senha incorretos.',
        code: 'INVALID_CREDENTIALS',
      })
    }

    logInfo('✅ Controller: login bem-sucedido', { usuarioId: resultado.usuarioId, funcao: resultado.funcao })

    return reply.code(200).send({
      success: true,
      data: resultado,
    })
  } catch (error) {
    if (error instanceof ValidationError) {
      logWarn('Controller: validação falhou no login', { error: error.message })
      return reply.code(400).send({
        success: false,
        message: error.message,
        code: error.code,
      })
    }

    if (error instanceof UnauthorizedError) {
      logWarn('Controller: credenciais inválidas', { error: error.message })
      return reply.code(error.statusCode || 401).send({
        success: false,
        message: error.message,
        code: error.code,
      })
    }

    logWarn('Controller: erro inesperado no login', {
      error: error instanceof Error ? error.message : String(error),
    })

    return reply.code(500).send({
      success: false,
      message: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR',
    })
  }
}

/**
 * POST /api/v1/auth/aluno/login
 *
 * Login exclusivo para alunos — rejeita qualquer outra funcao
 */
export async function loginAluno(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { email, senha } = loginSchema.parse(request.body)
    logDebug('Controller: login do aluno iniciado', { email })

    const resultado = await authService.login(email, senha)

    if (resultado.funcao !== 'ALUNO') {
      logWarn('Tentativa de acesso ao portal do aluno com conta não-aluno', { email, funcao: resultado.funcao })
      return reply.code(401).send({
        success: false,
        message: 'E-mail ou senha incorretos.',
        code: 'INVALID_CREDENTIALS',
      })
    }

    logInfo('✅ Controller: login do aluno bem-sucedido', { usuarioId: resultado.usuarioId })
    return reply.code(200).send({ success: true, data: resultado })
  } catch (error) {
    if (error instanceof ValidationError) {
      return reply.code(400).send({ success: false, message: error.message, code: error.code })
    }
    if (error instanceof UnauthorizedError) {
      return reply.code(error.statusCode || 401).send({ success: false, message: error.message, code: error.code })
    }
    logWarn('Controller: erro no login do aluno', { error: error instanceof Error ? error.message : String(error) })
    return reply.code(500).send({ success: false, message: 'Erro interno do servidor', code: 'INTERNAL_ERROR' })
  }
}

/**
 * POST /api/v1/auth/register
 *
 * Registra novo usuário
 *
 * @example
 * Request body:
 * {
 *   "email": "novo@pilates.local",
 *   "nome": "João Silva",
 *   "cpf": "12345678901",
 *   "telefone": "11999999999",
 *   "senha": "senha123",
 *   "senhaConfirmacao": "senha123"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "usuarioId": "uuid",
 *     "email": "novo@pilates.local",
 *     "nome": "João Silva",
 *     "funcao": "RECEPCIONISTA",
 *     "accessToken": "jwt...",
 *     "refreshToken": "jwt...",
 *     "expiresIn": 900
 *   }
 * }
 */
export async function register(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { email, nome, cpf, telefone, senha, senhaConfirmacao } = registerSchema.parse(request.body)
    logDebug('Controller: registro iniciado', { email, cpf })
    const resultado = await authService.register(email, nome, cpf, senha, senhaConfirmacao, telefone)
    logInfo('✅ Controller: registro bem-sucedido', { usuarioId: resultado.usuarioId })
    return reply.code(201).send({ success: true, data: resultado })
  } catch (error) {
    if (error instanceof ValidationError) {
      logWarn('Controller: validação falhou no registro', { error: error.message })
      return reply.code(400).send({ success: false, message: error.message, code: error.code })
    }
    logWarn('Controller: erro no registro', { error: error instanceof Error ? error.message : String(error) })
    return reply.code(500).send({ success: false, message: 'Erro ao registrar usuário', code: 'REGISTRATION_ERROR' })
  }
}

/**
 * POST /api/v1/auth/setup
 * Setup inicial — cria o primeiro admin quando o banco está vazio
 * ⚠️ PÚBLICO — retorna 409 se já houver usuários cadastrados
 */
export async function setup(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { email, nome, cpf, telefone, senha, senhaConfirmacao } = setupSchema.parse(request.body)
    logDebug('Controller: setup inicial iniciado', { email })
    const resultado = await authService.setup(email, nome, cpf, senha, senhaConfirmacao, telefone)
    logInfo('✅ Controller: setup inicial concluído', { usuarioId: resultado.usuarioId })
    return reply.code(201).send({ success: true, data: resultado })
  } catch (error) {
    if (error instanceof ValidationError) {
      return reply.code(400).send({ success: false, message: error.message, code: error.code })
    }
    if (error instanceof AppError && error.code === 'SETUP_ALREADY_DONE') {
      return reply.code(409).send({ success: false, message: error.message, code: error.code })
    }
    logWarn('Controller: erro no setup', { error: error instanceof Error ? error.message : String(error) })
    return reply.code(500).send({ success: false, message: 'Erro no setup inicial', code: 'SETUP_ERROR' })
  }
}

/**
 * POST /api/v1/auth/register
 * Cria usuário do sistema (admin, professor, recepcionista, financeiro)
 * ⚠️ PROTEGIDO — requer token de ADMIN
 */
export async function criarUsuario(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { email, nome, cpf, telefone, senha, senhaConfirmacao, funcao } = criarUsuarioSchema.parse(request.body)
    logDebug('Controller: criação de usuário pelo admin', { email, funcao })
    const resultado = await authService.criarUsuario(email, nome, cpf, senha, senhaConfirmacao, funcao, telefone)
    logInfo('✅ Controller: usuário criado pelo admin', { usuarioId: resultado.usuarioId, funcao })
    return reply.code(201).send({ success: true, data: resultado })
  } catch (error) {
    if (error instanceof ValidationError) {
      return reply.code(400).send({ success: false, message: error.message, code: error.code })
    }
    if (error instanceof Error && error.name === 'ZodError') {
      const validationError = ValidationError.fromZod(error)
      return reply.code(400).send({ success: false, message: validationError.message, code: validationError.code })
    }
    logWarn('Controller: erro ao criar usuário', { error: error instanceof Error ? error.message : String(error) })
    return reply.code(500).send({ success: false, message: 'Erro ao criar usuário', code: 'CREATE_USER_ERROR' })
  }
}

/**
 * POST /api/v1/auth/refresh
 *
 * Renova access token usando refresh token
 * Implementa rotação de refresh token
 *
 * @example
 * Request body:
 * {
 *   "refreshToken": "jwt..."
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "accessToken": "jwt...",
 *     "refreshToken": "jwt...",
 *     "expiresIn": 900
 *   }
 * }
 */
export async function refresh(request: FastifyRequest, reply: FastifyReply) {
  try {
    // Validar entrada
    const { refreshToken } = refreshTokenSchema.parse(request.body)

    logDebug('Controller: refresh token iniciado')

    // Chamar service
    const resultado = await authService.refreshToken(refreshToken)

    logInfo('✅ Controller: token renovado com sucesso')

    // Retornar resposta
    return reply.code(200).send({
      success: true,
      data: resultado,
    })
  } catch (error) {
    if (error instanceof ValidationError) {
      logWarn('Controller: validação falhou no refresh', { error: error.message })
      return reply.code(400).send({
        success: false,
        message: error.message,
        code: error.code,
      })
    }

    if (error instanceof UnauthorizedError) {
      logWarn('Controller: refresh token inválido ou expirado')
      return reply.code(401).send({
        success: false,
        message: error.message,
        code: error.code,
      })
    }

    logWarn('Controller: erro no refresh', {
      error: error instanceof Error ? error.message : String(error),
    })

    return reply.code(500).send({
      success: false,
      message: 'Erro ao renovar token',
      code: 'REFRESH_ERROR',
    })
  }
}

/**
 * POST /api/v1/auth/logout
 *
 * Realiza logout (apenas log, JWT é stateless)
 * ⚠️ PROTEGIDO - requer authentication
 *
 * @example
 * Response:
 * {
 *   "success": true,
 *   "data": {}
 * }
 */
export async function logout(request: FastifyRequest, reply: FastifyReply) {
  try {
    // Dados do usuário vêm do middleware de autenticação
    const usuarioId = request.usuarioId as string
    const email = request.email as string

    logDebug('Controller: logout iniciado', { usuarioId })

    // Chamar service
    await authService.logout(usuarioId, email)

    logInfo('✅ Controller: logout bem-sucedido', { usuarioId })

    // Retornar resposta
    return reply.code(200).send({
      success: true,
      data: {},
    })
  } catch (error) {
    logWarn('Controller: erro no logout', {
      error: error instanceof Error ? error.message : String(error),
    })

    return reply.code(500).send({
      success: false,
      message: 'Erro ao fazer logout',
      code: 'LOGOUT_ERROR',
    })
  }
}

/**
 * GET /api/v1/usuarios
 * Lista usuários do sistema (exceto alunos) — ADMIN only
 */
export async function listarUsuarios(request: FastifyRequest, reply: FastifyReply) {
  try {
    const query = z
      .object({
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
        funcao: z.string().optional(),
      })
      .parse(request.query)

    const resultado = await authService.listarUsuarios(query.page, query.limit, query.funcao)
    return reply.code(200).send({ success: true, data: resultado })
  } catch (error) {
    logWarn('Controller: erro ao listar usuários', { error: error instanceof Error ? error.message : String(error) })
    return reply.code(500).send({ success: false, message: 'Erro ao listar usuários', code: 'LIST_USERS_ERROR' })
  }
}

/**
 * PUT /api/v1/usuarios/:id
 * Atualiza dados de um usuário — ADMIN only
 */
export async function atualizarUsuario(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params)
    const dados = z
      .object({
        nomeCompleto: z.string().min(3).optional(),
        telefone: z
          .string()
          .regex(/^\d{10,11}$/)
          .nullable()
          .optional(),
        email: z.string().email().optional(),
        senha: z.string().min(6).max(128).optional(),
      })
      .parse(request.body)

    const adminId = request.usuarioId as string
    const usuario = await authService.atualizarDados(id, dados, adminId)

    return reply.code(200).send({
      success: true,
      data: {
        id: usuario.id,
        nome: usuario.nomeCompleto,
        email: usuario.email,
        telefone: usuario.telefone,
        funcao: usuario.funcao,
        status: usuario.status,
      },
    })
  } catch (error) {
    if (error instanceof AppError) {
      return reply.code(error.statusCode || 400).send({ success: false, message: error.message, code: error.code })
    }
    logWarn('Controller: erro ao atualizar usuário', { error: error instanceof Error ? error.message : String(error) })
    return reply.code(500).send({ success: false, message: 'Erro ao atualizar usuário', code: 'UPDATE_USER_ERROR' })
  }
}

/**
 * PATCH /api/v1/usuarios/:id/status
 * Ativa ou inativa um usuário — ADMIN only
 */
export async function alterarStatusUsuario(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params)
    const { ativo } = z.object({ ativo: z.boolean() }).parse(request.body)
    const adminId = request.usuarioId as string

    if (ativo) {
      await authService.reativarUsuario(id, adminId)
    } else {
      await authService.inativarUsuario(id, adminId)
    }

    return reply.code(200).send({ success: true, data: { id, ativo } })
  } catch (error) {
    if (error instanceof AppError) {
      return reply.code(error.statusCode || 400).send({ success: false, message: error.message, code: error.code })
    }
    if (error instanceof ValidationError) {
      return reply.code(400).send({ success: false, message: error.message, code: error.code })
    }
    logWarn('Controller: erro ao alterar status do usuário', {
      error: error instanceof Error ? error.message : String(error),
    })
    return reply.code(500).send({ success: false, message: 'Erro ao alterar status', code: 'STATUS_UPDATE_ERROR' })
  }
}

/**
 * GET /api/v1/me
 * Retorna o perfil do usuário autenticado (inclui dados de professor se aplicável)
 */
export async function getMeuPerfil(request: FastifyRequest, reply: FastifyReply) {
  try {
    const usuarioId = request.usuarioId as string
    const perfil = await authService.getMeuPerfil(usuarioId)
    return reply.code(200).send({ success: true, data: perfil })
  } catch (error) {
    if (error instanceof AppError) {
      return reply.code(error.statusCode || 400).send({ success: false, message: error.message, code: error.code })
    }
    logWarn('Controller: erro ao buscar perfil', { error: error instanceof Error ? error.message : String(error) })
    return reply.code(500).send({ success: false, message: 'Erro ao buscar perfil', code: 'GET_PERFIL_ERROR' })
  }
}

/**
 * PUT /api/v1/me
 * Atualiza o próprio perfil (nome, telefone; bio/especialidade se professor)
 */
export async function atualizarMeuPerfil(request: FastifyRequest, reply: FastifyReply) {
  try {
    const usuarioId = request.usuarioId as string
    const dados = z
      .object({
        nomeCompleto: z.string().min(3).optional(),
        telefone: z
          .string()
          .regex(/^\d{10,11}$/)
          .nullable()
          .optional(),
        bio: z.string().max(500).nullable().optional(),
        especialidade: z.string().max(200).nullable().optional(),
      })
      .parse(request.body)

    const perfil = await authService.atualizarMeuPerfil(usuarioId, dados)
    return reply.code(200).send({ success: true, data: perfil })
  } catch (error) {
    if (error instanceof AppError) {
      return reply.code(error.statusCode || 400).send({ success: false, message: error.message, code: error.code })
    }
    logWarn('Controller: erro ao atualizar perfil', { error: error instanceof Error ? error.message : String(error) })
    return reply.code(500).send({ success: false, message: 'Erro ao atualizar perfil', code: 'UPDATE_PERFIL_ERROR' })
  }
}

/**
 * POST /api/v1/auth/change-password
 *
 * Muda senha do usuário autenticado
 * ⚠️ PROTEGIDO - requer authentication
 *
 * @example
 * Request body:
 * {
 *   "senhaAtual": "senha123",
 *   "novaSenha": "novaSenha456",
 *   "novaSenhaConfirmacao": "novaSenha456"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {}
 * }
 */
export async function changePassword(request: FastifyRequest, reply: FastifyReply) {
  try {
    // Dados do usuário vêm do middleware de autenticação
    const usuarioId = request.usuarioId as string

    // Validar entrada
    const { senhaAtual, novaSenha, novaSenhaConfirmacao } = changePasswordSchema.parse(request.body)

    logDebug('Controller: mudança de senha iniciada', { usuarioId })

    // Chamar service
    await authService.changePassword(usuarioId, senhaAtual, novaSenha)

    logInfo('✅ Controller: senha alterada com sucesso', { usuarioId })

    // Retornar resposta
    return reply.code(200).send({
      success: true,
      data: {},
    })
  } catch (error) {
    if (error instanceof ValidationError) {
      logWarn('Controller: validação falhou na mudança de senha', { error: error.message })
      return reply.code(400).send({
        success: false,
        message: error.message,
        code: error.code,
      })
    }

    if (error instanceof UnauthorizedError) {
      logWarn('Controller: senha atual incorreta')
      return reply.code(401).send({
        success: false,
        message: error.message,
        code: error.code,
      })
    }

    if (error instanceof Error && error.name === 'ZodError') {
      const validationError = ValidationError.fromZod(error)
      logWarn('Controller: validação falhou na mudança de senha', { error: validationError.message })
      return reply.code(400).send({
        success: false,
        message: validationError.message,
        code: validationError.code,
      })
    }

    logWarn('Controller: erro na mudança de senha', {
      error: error instanceof Error ? error.message : String(error),
    })

    return reply.code(500).send({
      success: false,
      message: 'Erro ao alterar senha',
      code: 'PASSWORD_CHANGE_ERROR',
    })
  }
}
