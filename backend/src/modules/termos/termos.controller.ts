import type { FastifyRequest, FastifyReply } from 'fastify'
import { termosService } from './termos.service'
import { ValidationError } from '../../shared/errors'
import { logWarn } from '../../shared/utils'

function tratarErro(error: any, reply: FastifyReply, msgGenerica: string) {
  if (error instanceof ValidationError)
    return reply.code(400).send({ success: false, message: error.message, code: error.code })
  if (error?.name === 'ZodError')
    return reply
      .code(400)
      .send({ success: false, message: error.errors?.[0]?.message ?? 'Dados inválidos', code: 'VALIDATION_ERROR' })
  if (error?.statusCode === 404)
    return reply.code(404).send({ success: false, message: error.message, code: 'NOT_FOUND' })
  if (error?.statusCode === 403)
    return reply.code(403).send({ success: false, message: error.message, code: 'FORBIDDEN' })
  if (error?.statusCode === 400)
    return reply.code(400).send({ success: false, message: error.message, code: 'BAD_REQUEST' })
  logWarn(msgGenerica, { error: String(error) })
  return reply.code(500).send({ success: false, message: msgGenerica, code: 'INTERNAL_ERROR' })
}

// ---------------- Administração (ADMIN) ----------------

export async function listar(_request: FastifyRequest, reply: FastifyReply) {
  try {
    return reply.code(200).send({ success: true, data: await termosService.listar() })
  } catch (error) {
    return tratarErro(error, reply, 'Erro ao listar termos')
  }
}

export async function buscarPorId(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }
    return reply.code(200).send({ success: true, data: await termosService.buscarPorId(id) })
  } catch (error) {
    return tratarErro(error, reply, 'Erro ao buscar termo')
  }
}

export async function criar(request: FastifyRequest, reply: FastifyReply) {
  try {
    const termo = await termosService.criar(request.body, request.usuarioId)
    return reply.code(201).send({ success: true, data: termo })
  } catch (error) {
    return tratarErro(error, reply, 'Erro ao criar termo')
  }
}

export async function editar(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }
    const termo = await termosService.editar(id, request.body, request.usuarioId)
    return reply.code(200).send({ success: true, data: termo })
  } catch (error) {
    return tratarErro(error, reply, 'Erro ao editar termo')
  }
}

export async function publicar(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }
    const termo = await termosService.publicar(id, request.usuarioId)
    return reply.code(200).send({ success: true, data: termo })
  } catch (error) {
    return tratarErro(error, reply, 'Erro ao publicar termo')
  }
}

export async function listarAceites(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }
    return reply.code(200).send({ success: true, data: await termosService.listarAceites(id) })
  } catch (error) {
    return tratarErro(error, reply, 'Erro ao listar aceites do termo')
  }
}

// ---------------- Portal do aluno (ALUNO) ----------------

export async function obterStatus(request: FastifyRequest, reply: FastifyReply) {
  try {
    return reply.code(200).send({ success: true, data: await termosService.statusDoAluno(request.usuarioId!) })
  } catch (error) {
    return tratarErro(error, reply, 'Erro ao obter status do termo')
  }
}

export async function aceitar(request: FastifyRequest, reply: FastifyReply) {
  try {
    const aceite = await termosService.registrarAceite(request.usuarioId!, {
      enderecoIp: request.ip,
      userAgent: request.headers['user-agent'] ?? null,
    })
    return reply.code(201).send({ success: true, data: aceite })
  } catch (error) {
    return tratarErro(error, reply, 'Erro ao registrar aceite do termo')
  }
}

export async function meusAceites(request: FastifyRequest, reply: FastifyReply) {
  try {
    return reply.code(200).send({ success: true, data: await termosService.meusAceites(request.usuarioId!) })
  } catch (error) {
    return tratarErro(error, reply, 'Erro ao listar seus aceites')
  }
}
