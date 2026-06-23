import type { FastifyRequest, FastifyReply } from 'fastify'
import { financeiroService } from './financeiro.service'
import { ValidationError, AppError } from '../../shared/errors'
import { logWarn } from '../../shared/utils'
import { prisma } from '../../database/prisma.client'
import { notificacoesService } from '../notificacoes/notificacoes.service'

// ===================== MENSALIDADES =====================

export async function criarMensalidade(request: FastifyRequest, reply: FastifyReply) {
  try {
    const mensalidade = await financeiroService.criarMensalidade(request.body as any)
    return reply.code(201).send({ success: true, data: mensalidade })
  } catch (error: any) {
    if (error instanceof ValidationError)
      return reply.code(400).send({ success: false, message: error.message, code: error.code })
    if (error instanceof Error && error.name === 'ZodError') {
      const validationError = ValidationError.fromZod(error)
      return reply.code(400).send({ success: false, message: validationError.message, code: validationError.code })
    }
    logWarn('Erro ao criar mensalidade', { error: String(error) })
    return reply.code(500).send({ success: false, message: 'Erro ao criar mensalidade', code: 'INTERNAL_ERROR' })
  }
}

export async function listarMensalidades(request: FastifyRequest, reply: FastifyReply) {
  try {
    const resultado = await financeiroService.listarMensalidades(request.query as any)
    return reply.code(200).send({ success: true, data: resultado })
  } catch (error) {
    logWarn('Erro ao listar mensalidades', { error: String(error) })
    return reply.code(500).send({ success: false, message: 'Erro ao listar mensalidades', code: 'INTERNAL_ERROR' })
  }
}

export async function buscarMensalidadePorId(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }
    const mensalidade = await financeiroService.buscarMensalidadePorId(id)
    return reply.code(200).send({ success: true, data: mensalidade })
  } catch (error: any) {
    if (error?.statusCode === 404)
      return reply.code(404).send({ success: false, message: error.message, code: 'NOT_FOUND' })
    logWarn('Erro ao buscar mensalidade', { error: String(error) })
    return reply.code(500).send({ success: false, message: 'Erro ao buscar mensalidade', code: 'INTERNAL_ERROR' })
  }
}

export async function atualizarMensalidade(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string }
    const mensalidade = await financeiroService.atualizarMensalidade(id, request.body as any)
    return reply.code(200).send({ success: true, data: mensalidade })
  } catch (error: any) {
    if (error instanceof ValidationError)
      return reply.code(400).send({ success: false, message: error.message, code: error.code })
    if (error instanceof Error && error.name === 'ZodError') {
      const validationError = ValidationError.fromZod(error)
      return reply.code(400).send({ success: false, message: validationError.message, code: validationError.code })
    }
    if (error?.statusCode === 404)
      return reply.code(404).send({ success: false, message: error.message, code: 'NOT_FOUND' })
    if (error?.statusCode === 400)
      return reply.code(400).send({ success: false, message: error.message, code: 'BAD_REQUEST' })
    logWarn('Erro ao atualizar mensalidade', { error: String(error) })
    return reply.code(500).send({ success: false, message: 'Erro ao atualizar mensalidade', code: 'INTERNAL_ERROR' })
  }
}

// ===================== PAGAMENTOS =====================

export async function registrarPagamento(request: FastifyRequest, reply: FastifyReply) {
  try {
    const usuarioId = request.usuarioId as string
    const pagamento = await financeiroService.registrarPagamento(usuarioId, request.body as any)
    return reply.code(201).send({ success: true, data: pagamento })
  } catch (error: any) {
    if (error instanceof ValidationError)
      return reply.code(400).send({ success: false, message: error.message, code: error.code })
    if (error instanceof Error && error.name === 'ZodError') {
      const validationError = ValidationError.fromZod(error)
      return reply.code(400).send({ success: false, message: validationError.message, code: validationError.code })
    }
    if (error?.statusCode === 400)
      return reply.code(400).send({ success: false, message: error.message, code: 'BAD_REQUEST' })
    logWarn('Erro ao registrar pagamento', { error: String(error) })
    return reply.code(500).send({ success: false, message: 'Erro ao registrar pagamento', code: 'INTERNAL_ERROR' })
  }
}

export async function listarPagamentos(request: FastifyRequest, reply: FastifyReply) {
  try {
    const resultado = await financeiroService.listarPagamentos(request.query as any)
    return reply.code(200).send({ success: true, data: resultado })
  } catch (error) {
    logWarn('Erro ao listar pagamentos', { error: String(error) })
    return reply.code(500).send({ success: false, message: 'Erro ao listar pagamentos', code: 'INTERNAL_ERROR' })
  }
}

// ===================== ENDPOINTS DO ALUNO =====================

export async function listarMinhasMensalidades(request: FastifyRequest, reply: FastifyReply) {
  try {
    const usuarioId = request.usuarioId!
    const aluno = await prisma.aluno.findUnique({ where: { usuarioId } })
    if (!aluno) {
      return reply.code(403).send({ success: false, message: 'Perfil de aluno não encontrado', code: 'FORBIDDEN' })
    }
    const query = request.query as { page?: string; limit?: string; status?: string }
    const resultado = await financeiroService.listarMensalidades({
      alunoId: aluno.id,
      status: query.status,
      page: query.page ? parseInt(query.page) : 1,
      limit: query.limit ? parseInt(query.limit) : 24,
    })
    return reply.code(200).send({ success: true, data: resultado })
  } catch (error) {
    logWarn('Erro ao listar mensalidades do aluno', { error: String(error) })
    return reply.code(500).send({ success: false, message: 'Erro ao listar mensalidades', code: 'INTERNAL_ERROR' })
  }
}

export async function solicitarAulaAvulsa(request: FastifyRequest, reply: FastifyReply) {
  try {
    const usuarioId = request.usuarioId!
    const { dataDesejada, observacoes } = request.body as { dataDesejada?: string; observacoes?: string }

    const aluno = await prisma.aluno.findUnique({
      where: { usuarioId },
      include: { usuario: { select: { nomeCompleto: true } } },
    })
    if (!aluno) {
      return reply.code(403).send({ success: false, message: 'Perfil de aluno não encontrado', code: 'FORBIDDEN' })
    }

    const admins = await prisma.usuario.findMany({
      where: { funcao: 'ADMIN', status: 'ATIVO' },
      select: { id: true },
    })

    const dataTexto = dataDesejada ? ` para o dia ${new Date(dataDesejada).toLocaleDateString('pt-BR')}` : ''
    const notaExtra = observacoes ? ` Observação: "${observacoes}"` : ''
    const titulo = `Solicitação de aula avulsa — ${aluno.usuario.nomeCompleto}`
    const mensagem = `O aluno ${aluno.usuario.nomeCompleto} solicitou uma aula avulsa${dataTexto}.${notaExtra} Crie a cobrança avulsa no financeiro e confirme com o aluno.`

    await Promise.all(
      admins.map((admin) =>
        prisma.notificacao.create({
          data: { usuarioId: admin.id, tipo: 'MENSAGEM_ADMIN', titulo, mensagem } as any,
        }),
      ),
    )

    logWarn('Aula avulsa solicitada pelo aluno', { alunoId: aluno.id, dataDesejada })
    return reply.code(200).send({ success: true, data: { message: 'Solicitação enviada ao studio com sucesso.' } })
  } catch (error) {
    logWarn('Erro ao solicitar aula avulsa', { error: String(error) })
    return reply.code(500).send({ success: false, message: 'Erro ao enviar solicitação', code: 'INTERNAL_ERROR' })
  }
}

// ===================== COMPROVANTES =====================

export async function enviarComprovante(request: FastifyRequest, reply: FastifyReply) {
  try {
    const usuarioId = request.usuarioId!
    const { mensalidadeId, arquivo, nomeArquivo, tipoArquivo } = request.body as {
      mensalidadeId: string
      arquivo: string
      nomeArquivo: string
      tipoArquivo: string
    }

    const aluno = await prisma.aluno.findUnique({
      where: { usuarioId },
      include: { usuario: { select: { nomeCompleto: true } } },
    })
    if (!aluno)
      return reply.code(403).send({ success: false, message: 'Perfil de aluno não encontrado', code: 'FORBIDDEN' })

    const mensalidade = await prisma.mensalidade.findUnique({
      where: { id: mensalidadeId },
      include: { plano: { select: { nome: true } } },
    })
    if (!mensalidade)
      return reply.code(404).send({ success: false, message: 'Mensalidade não encontrada', code: 'NOT_FOUND' })
    if (String(mensalidade.alunoId) !== aluno.id)
      return reply
        .code(403)
        .send({ success: false, message: 'Mensalidade não pertence a este aluno', code: 'FORBIDDEN' })

    // Verifica se já existe comprovante pendente ou aprovado para esta mensalidade
    const existente = await prisma.comprovantePagemento.findFirst({
      where: { mensalidadeId, alunoId: aluno.id, status: { in: ['PENDENTE', 'APROVADO'] } },
    } as any)
    if (existente)
      return reply.code(409).send({
        success: false,
        message: 'Já existe um comprovante pendente ou aprovado para esta mensalidade',
        code: 'CONFLICT',
      })

    const comprovante = await prisma.comprovantePagemento.create({
      data: {
        mensalidadeId,
        alunoId: aluno.id,
        arquivo,
        nomeArquivo,
        tipoArquivo,
        dataEnvio: new Date(),
      } as any,
    })

    // Notificar admins
    const admins = await prisma.usuario.findMany({ where: { funcao: 'ADMIN', status: 'ATIVO' }, select: { id: true } })
    const nomePlano = mensalidade.plano?.nome ?? 'Avulso'
    await Promise.all(
      admins.map((admin) =>
        prisma.notificacao.create({
          data: {
            usuarioId: admin.id,
            tipo: 'MENSAGEM_ADMIN',
            titulo: `Comprovante enviado — ${aluno.usuario.nomeCompleto}`,
            mensagem: `${aluno.usuario.nomeCompleto} enviou um comprovante de pagamento para a mensalidade "${nomePlano}". Acesse Financeiro > Comprovantes para analisar.`,
          } as any,
        }),
      ),
    )

    logWarn('Comprovante enviado pelo aluno', { alunoId: aluno.id, mensalidadeId })
    return reply.code(201).send({ success: true, data: comprovante })
  } catch (error) {
    logWarn('Erro ao enviar comprovante', { error: String(error) })
    return reply.code(500).send({ success: false, message: 'Erro ao enviar comprovante', code: 'INTERNAL_ERROR' })
  }
}

export async function listarMeusComprovantes(request: FastifyRequest, reply: FastifyReply) {
  try {
    const usuarioId = request.usuarioId!
    const aluno = await prisma.aluno.findUnique({ where: { usuarioId } })
    if (!aluno)
      return reply.code(403).send({ success: false, message: 'Perfil de aluno não encontrado', code: 'FORBIDDEN' })

    const comprovantes = await prisma.comprovantePagemento.findMany({
      where: { alunoId: aluno.id } as any,
      include: {
        mensalidade: { include: { plano: { select: { nome: true } } } },
        analisadoPor: { select: { nomeCompleto: true } },
      } as any,
      orderBy: { criadoEm: 'desc' },
    } as any)

    return reply.code(200).send({ success: true, data: comprovantes })
  } catch (error) {
    logWarn('Erro ao listar comprovantes do aluno', { error: String(error) })
    return reply.code(500).send({ success: false, message: 'Erro ao listar comprovantes', code: 'INTERNAL_ERROR' })
  }
}

export async function listarComprovantes(request: FastifyRequest, reply: FastifyReply) {
  try {
    const query = request.query as { status?: string; page?: string; limit?: string }
    const page = query.page ? parseInt(query.page) : 1
    const limit = query.limit ? parseInt(query.limit) : 20
    const where: any = {}
    if (query.status) where.status = query.status

    const [comprovantes, total] = await Promise.all([
      prisma.comprovantePagemento.findMany({
        where,
        include: {
          mensalidade: { include: { plano: { select: { nome: true } } } },
          aluno: { include: { usuario: { select: { nomeCompleto: true } } } },
          analisadoPor: { select: { nomeCompleto: true } },
        } as any,
        orderBy: { criadoEm: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      } as any),
      prisma.comprovantePagemento.count({ where }),
    ])

    return reply
      .code(200)
      .send({ success: true, data: { comprovantes, total, page, limit, totalPages: Math.ceil(total / limit) } })
  } catch (error) {
    logWarn('Erro ao listar comprovantes', { error: String(error) })
    return reply.code(500).send({ success: false, message: 'Erro ao listar comprovantes', code: 'INTERNAL_ERROR' })
  }
}

export async function analisarComprovante(request: FastifyRequest, reply: FastifyReply) {
  try {
    const usuarioId = request.usuarioId!
    const { id } = request.params as { id: string }
    const { acao, observacoes } = request.body as { acao: 'APROVADO' | 'REJEITADO'; observacoes?: string }

    if (!['APROVADO', 'REJEITADO'].includes(acao)) {
      return reply
        .code(400)
        .send({ success: false, message: 'Ação inválida. Use APROVADO ou REJEITADO', code: 'BAD_REQUEST' })
    }

    const comprovante = await prisma.comprovantePagemento.findUnique({ where: { id } } as any)
    if (!comprovante)
      return reply.code(404).send({ success: false, message: 'Comprovante não encontrado', code: 'NOT_FOUND' })
    if ((comprovante as any).status !== 'PENDENTE')
      return reply.code(400).send({ success: false, message: 'Comprovante já foi analisado', code: 'BAD_REQUEST' })

    // Atualiza o comprovante e, se aprovado, baixa a mensalidade vinculada
    // (registrando o pagamento no caixa aberto, se houver) — tudo atômico.
    const atualizado = await prisma.$transaction(async (tx) => {
      const comp = (await tx.comprovantePagemento.update({
        where: { id } as any,
        data: { status: acao, analisadoPorId: usuarioId, observacoes: observacoes ?? null } as any,
        include: {
          aluno: { include: { usuario: { select: { id: true, nomeCompleto: true } } } },
          mensalidade: { include: { plano: { select: { nome: true } } } },
        } as any,
      } as any)) as any

      if (acao === 'APROVADO' && comp.mensalidade && comp.mensalidade.status !== 'PAGO') {
        const valorDevido = Number(comp.mensalidade.valor) - Number(comp.mensalidade.desconto ?? 0)

        // Sempre registra a movimentação de pagamento (independente de caixa) para
        // manter o histórico financeiro consistente.
        await tx.pagamento.create({
          data: {
            mensalidadeId: comp.mensalidadeId,
            caixaId: null,
            usuarioId,
            valor: valorDevido,
            metodo: 'PIX' as any,
            dataPagamento: new Date(),
            referencia: 'Comprovante aprovado',
            observacoes: `Pagamento confirmado via aprovação de comprovante (${comp.nomeArquivo}).`,
          } as any,
        })

        await tx.mensalidade.update({
          where: { id: comp.mensalidadeId } as any,
          data: { status: 'PAGO' as any } as any,
        })
      }

      return comp
    })

    // Notificar o aluno
    const titulo = acao === 'APROVADO' ? 'Comprovante aprovado!' : 'Comprovante rejeitado'
    const nomePlano = atualizado.mensalidade?.plano?.nome ?? 'Avulso'
    const msgAprovado = `Seu comprovante de pagamento para "${nomePlano}" foi aprovado e sua mensalidade foi quitada.`
    const msgRejeitado = `Seu comprovante de pagamento para "${nomePlano}" foi rejeitado.${observacoes ? ` Motivo: ${observacoes}` : ' Verifique e envie novamente.'}`
    await prisma.notificacao.create({
      data: {
        usuarioId: atualizado.aluno.usuario.id,
        tipo: acao === 'APROVADO' ? 'PAGAMENTO_CONFIRMADO' : 'MENSAGEM_ADMIN',
        titulo,
        mensagem: acao === 'APROVADO' ? msgAprovado : msgRejeitado,
      } as any,
    })

    // Notificar o administrador
    const adminUsuario = await prisma.usuario.findUnique({ where: { id: usuarioId }, select: { nomeCompleto: true } })
    const adminNome = adminUsuario?.nomeCompleto ?? 'Administrador/Professor'
    const statusTxt = acao === 'APROVADO' ? 'aprovado' : 'rejeitado'
    const msgAdmin = `O comprovante de pagamento enviado por ${atualizado.aluno.usuario.nomeCompleto} para a mensalidade "${nomePlano}" foi ${statusTxt} por ${adminNome}.${observacoes ? ` Motivo: "${observacoes}"` : ''}`
    await notificacoesService.notificarAdmins(`Comprovante de pagamento ${statusTxt}`, msgAdmin)

    logWarn(`Comprovante ${acao.toLowerCase()}`, { id, analisadoPorId: usuarioId })
    return reply.code(200).send({ success: true, data: atualizado })
  } catch (error) {
    logWarn('Erro ao analisar comprovante', { error: String(error) })
    return reply.code(500).send({ success: false, message: 'Erro ao analisar comprovante', code: 'INTERNAL_ERROR' })
  }
}

export async function notificarPagamento(request: FastifyRequest, reply: FastifyReply) {
  try {
    const usuarioId = request.usuarioId!
    const { mensalidadeId, observacoes } = request.body as { mensalidadeId: string; observacoes?: string }

    const aluno = await prisma.aluno.findUnique({
      where: { usuarioId },
      include: { usuario: { select: { nomeCompleto: true } } },
    })
    if (!aluno) {
      return reply.code(403).send({ success: false, message: 'Perfil de aluno não encontrado', code: 'FORBIDDEN' })
    }

    const mensalidade = await prisma.mensalidade.findUnique({
      where: { id: mensalidadeId },
      include: { plano: { select: { nome: true } } },
    })
    if (!mensalidade) {
      return reply.code(404).send({ success: false, message: 'Mensalidade não encontrada', code: 'NOT_FOUND' })
    }
    if (String(mensalidade.alunoId) !== aluno.id) {
      return reply
        .code(403)
        .send({ success: false, message: 'Mensalidade não pertence a este aluno', code: 'FORBIDDEN' })
    }

    const admins = await prisma.usuario.findMany({
      where: { funcao: 'ADMIN', status: 'ATIVO' },
      select: { id: true },
    })

    const nomePlano = mensalidade.plano?.nome ?? 'Avulso'
    const notaExtra = observacoes ? ` Nota: "${observacoes}"` : ''
    const titulo = `Pagamento notificado — ${aluno.usuario.nomeCompleto}`
    const mensagem = `O aluno ${aluno.usuario.nomeCompleto} notificou o pagamento da mensalidade "${nomePlano}".${notaExtra} Verifique e registre o pagamento no sistema.`

    await Promise.all(
      admins.map((admin) =>
        prisma.notificacao.create({
          data: {
            usuarioId: admin.id,
            tipo: 'MENSAGEM_ADMIN',
            titulo,
            mensagem,
          } as any,
        }),
      ),
    )

    logWarn('Pagamento notificado pelo aluno', { alunoId: aluno.id, mensalidadeId })
    return reply.code(200).send({ success: true, data: { message: 'Notificação enviada ao studio com sucesso.' } })
  } catch (error) {
    logWarn('Erro ao notificar pagamento', { error: String(error) })
    return reply.code(500).send({ success: false, message: 'Erro ao enviar notificação', code: 'INTERNAL_ERROR' })
  }
}
