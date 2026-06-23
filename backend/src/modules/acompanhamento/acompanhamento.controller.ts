import type { FastifyRequest, FastifyReply } from 'fastify'
import { acompanhamentoService } from './acompanhamento.service'
import { logWarn } from '../../shared/utils'
import type { RiscoAluno } from './acompanhamento.types'

const RISCOS_VALIDOS: ReadonlyArray<RiscoAluno> = ['EM_RISCO', 'ATENCAO', 'OK']

export async function listarAlunos(request: FastifyRequest, reply: FastifyReply) {
  try {
    const query = request.query as { risco?: string; busca?: string }
    const risco = RISCOS_VALIDOS.includes(query.risco as RiscoAluno) ? (query.risco as RiscoAluno) : undefined
    const resultado = await acompanhamentoService.listar({ risco, busca: query.busca })
    return reply.code(200).send({ success: true, data: resultado })
  } catch (error) {
    logWarn('Erro ao listar acompanhamento', { error: String(error) })
    return reply.code(500).send({ success: false, message: 'Erro ao carregar acompanhamento', code: 'INTERNAL_ERROR' })
  }
}

export async function resumo(_request: FastifyRequest, reply: FastifyReply) {
  try {
    const data = await acompanhamentoService.resumo()
    return reply.code(200).send({ success: true, data })
  } catch (error) {
    logWarn('Erro ao carregar resumo de acompanhamento', { error: String(error) })
    return reply.code(500).send({ success: false, message: 'Erro ao carregar resumo', code: 'INTERNAL_ERROR' })
  }
}

export async function detalheAluno(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }
    const data = await acompanhamentoService.detalhe(id)
    return reply.code(200).send({ success: true, data })
  } catch (error: any) {
    if (error?.statusCode === 404)
      return reply.code(404).send({ success: false, message: error.message, code: 'NOT_FOUND' })
    logWarn('Erro ao carregar detalhe do aluno', { error: String(error) })
    return reply.code(500).send({ success: false, message: 'Erro ao carregar aluno', code: 'INTERNAL_ERROR' })
  }
}
