/**
 * Rotas de Autenticação
 *
 * Define todos os endpoints de auth:
 * - POST /api/v1/auth/login (público)
 * - POST /api/v1/auth/register (público)
 * - POST /api/v1/auth/refresh (público)
 * - POST /api/v1/auth/logout (protegido)
 * - POST /api/v1/auth/change-password (protegido)
 */

import type { FastifyInstance } from 'fastify'
import { login, loginAluno, register, refresh, logout, changePassword, setup, criarUsuario, listarUsuarios, atualizarUsuario, alterarStatusUsuario, getMeuPerfil, atualizarMeuPerfil } from './auth.controller'
import { authenticateToken, requireRole } from '../../shared/middlewares/auth.middleware'
import { logDebug } from '../../shared/utils'

/**
 * Registra rotas de autenticação na instância Fastify
 *
 * @param fastify - Instância Fastify
 */
/** Apenas rotas de login — protegidas por rate limit estrito */
export async function authLoginRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: { email: string; senha: string } }>('/api/v1/auth/login', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'senha'],
        properties: {
          email: { type: 'string', format: 'email' },
          senha: { type: 'string', minLength: 6 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                usuarioId: { type: 'string' },
                email: { type: 'string' },
                nome: { type: 'string' },
                funcao: { type: 'string' },
                accessToken: { type: 'string' },
                refreshToken: { type: 'string' },
                expiresIn: { type: 'number' },
              },
            },
          },
        },
      },
    },
  }, login)

  fastify.post('/api/v1/auth/aluno/login', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'senha'],
        properties: {
          email: { type: 'string', format: 'email' },
          senha: { type: 'string', minLength: 6 },
        },
      },
    },
  }, loginAluno)
}

/** Demais rotas de auth — sem rate limit estrito */
export async function authRoutes(fastify: FastifyInstance) {
  logDebug('📝 Registrando rotas de autenticação')

  /**
   * POST /api/v1/auth/setup
   * Setup inicial — cria o primeiro admin (apenas quando banco está vazio)
   * ⚠️ PÚBLICO — retorna 409 se já houver usuários
   */
  fastify.post<{
    Body: {
      email: string
      nome: string
      cpf: string
      telefone?: string
      senha: string
      senhaConfirmacao: string
    }
  }>('/api/v1/auth/setup', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'nome', 'cpf', 'senha', 'senhaConfirmacao'],
        properties: {
          email: { type: 'string', format: 'email' },
          nome: { type: 'string', minLength: 3 },
          cpf: { type: 'string', pattern: '^\\d{11}$' },
          telefone: { type: 'string', pattern: '^\\d{10,11}$' },
          senha: { type: 'string', minLength: 8 },
          senhaConfirmacao: { type: 'string', minLength: 8 },
        },
      },
    },
  }, setup)

  /**
   * POST /api/v1/auth/register
   * Cria usuário do sistema (admin, professor, recepcionista, financeiro)
   * ⚠️ PROTEGIDO — apenas ADMIN
   */
  fastify.post<{
    Body: {
      email: string
      nome: string
      cpf: string
      telefone?: string
      senha: string
      senhaConfirmacao: string
      funcao: 'ADMIN' | 'PROFESSOR' | 'RECEPCIONISTA' | 'FINANCEIRO'
    }
  }>('/api/v1/auth/register', {
    onRequest: [authenticateToken, requireRole('ADMIN')],
    schema: {
      body: {
        type: 'object',
        required: ['email', 'nome', 'cpf', 'senha', 'senhaConfirmacao', 'funcao'],
        properties: {
          email: { type: 'string', format: 'email' },
          nome: { type: 'string', minLength: 3 },
          cpf: { type: 'string', pattern: '^\\d{11}$' },
          telefone: { type: 'string', pattern: '^\\d{10,11}$' },
          senha: { type: 'string', minLength: 6 },
          senhaConfirmacao: { type: 'string', minLength: 6 },
          funcao: { type: 'string', enum: ['ADMIN', 'PROFESSOR', 'RECEPCIONISTA', 'FINANCEIRO'] },
        },
      },
    },
  }, criarUsuario)

  /**
   * POST /api/v1/auth/refresh
   * Renova access token usando refresh token
   */
  fastify.post<{
    Body: {
      refreshToken: string
    }
  }>('/api/v1/auth/refresh', {
    schema: {
      body: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: { type: 'string', minLength: 10 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                accessToken: { type: 'string' },
                refreshToken: { type: 'string' },
                expiresIn: { type: 'number' },
              },
            },
          },
        },
      },
    },
  }, refresh)

  /**
   * POST /api/v1/auth/logout
   * Logout do usuário autenticado
   * ⚠️ PROTEGIDO
   */
  fastify.post<{
    Body: Record<string, never>
  }>('/api/v1/auth/logout', {
    onRequest: [authenticateToken],
    schema: {
      response: {
        200: {
          description: 'Logout bem-sucedido',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
          },
        },
      },
    },
  }, logout)

  /**
   * POST /api/v1/auth/change-password
   * Muda senha do usuário autenticado
   * ⚠️ PROTEGIDO
   */
  fastify.post<{
    Body: {
      senhaAtual: string
      novaSenha: string
      novaSenhaConfirmacao: string
    }
  }>('/api/v1/auth/change-password', {
    onRequest: [authenticateToken],
    schema: {
      body: {
        type: 'object',
        required: ['senhaAtual', 'novaSenha', 'novaSenhaConfirmacao'],
        properties: {
          senhaAtual: { type: 'string', minLength: 6 },
          novaSenha: { type: 'string', minLength: 6 },
          novaSenhaConfirmacao: { type: 'string', minLength: 6 },
        },
      },
      response: {
        200: {
          description: 'Senha alterada com sucesso',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
          },
        },
      },
    },
  }, changePassword)

  /**
   * GET /api/v1/usuarios
   * Lista usuários do sistema — ADMIN only
   */
  fastify.get('/api/v1/usuarios', {
    onRequest: [authenticateToken, requireRole('ADMIN')],
  }, listarUsuarios)

  /**
   * PUT /api/v1/usuarios/:id
   * Atualiza dados de um usuário — ADMIN only
   */
  fastify.put('/api/v1/usuarios/:id', {
    onRequest: [authenticateToken, requireRole('ADMIN')],
  }, atualizarUsuario)

  /**
   * PATCH /api/v1/usuarios/:id/status
   * Ativa ou inativa um usuário — ADMIN only
   */
  fastify.patch('/api/v1/usuarios/:id/status', {
    onRequest: [authenticateToken, requireRole('ADMIN')],
  }, alterarStatusUsuario)

  /**
   * GET /api/v1/me
   * Retorna o perfil do usuário autenticado
   * ⚠️ PROTEGIDO
   */
  fastify.get('/api/v1/me', {
    onRequest: [authenticateToken],
  }, getMeuPerfil)

  /**
   * PUT /api/v1/me
   * Atualiza o próprio perfil
   * ⚠️ PROTEGIDO
   */
  fastify.put('/api/v1/me', {
    onRequest: [authenticateToken],
  }, atualizarMeuPerfil)

  logDebug('✅ Rotas de autenticação registradas')
}
