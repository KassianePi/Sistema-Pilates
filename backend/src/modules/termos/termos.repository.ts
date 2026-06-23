import { prisma } from '../../database/prisma.client'

/**
 * Acesso a dados de Termos de Uso e Aceites.
 * O aceite é imutável: uma vez registrado, não é alterado nem removido.
 */
export class TermosRepository {
  // ---------- Termo ----------

  /** Termo publicado vigente — o de maior versão dentre os publicados. */
  findAtual() {
    return prisma.termoUso.findFirst({ where: { publicado: true }, orderBy: { versao: 'desc' } })
  }

  findById(id: string) {
    return prisma.termoUso.findUnique({ where: { id } })
  }

  findAll() {
    return prisma.termoUso.findMany({ orderBy: { versao: 'desc' } })
  }

  async proximaVersao(): Promise<number> {
    const topo = await prisma.termoUso.findFirst({ orderBy: { versao: 'desc' }, select: { versao: true } })
    return (topo?.versao ?? 0) + 1
  }

  criar(data: { versao: number; titulo: string; conteudo: string; criadoPorId?: string | null }) {
    return prisma.termoUso.create({ data })
  }

  atualizar(id: string, data: { titulo?: string; conteudo?: string }) {
    return prisma.termoUso.update({ where: { id }, data })
  }

  /** Publica a versão informada e despublica as demais (mantém um único termo vigente). */
  publicar(id: string) {
    return prisma.$transaction(async (tx) => {
      await tx.termoUso.updateMany({ where: { publicado: true, NOT: { id } }, data: { publicado: false } })
      return tx.termoUso.update({ where: { id }, data: { publicado: true, publicadoEm: new Date() } })
    })
  }

  // ---------- Aceite ----------

  findAceite(termoId: string, alunoId: string) {
    return prisma.termoAceite.findUnique({ where: { termoId_alunoId: { termoId, alunoId } } })
  }

  /** Idempotente: se o aluno já aceitou esta versão, mantém o registro original (imutável). */
  registrarAceite(data: {
    termoId: string
    alunoId: string
    versao: number
    enderecoIp?: string | null
    userAgent?: string | null
  }) {
    return prisma.termoAceite.upsert({
      where: { termoId_alunoId: { termoId: data.termoId, alunoId: data.alunoId } },
      create: data,
      update: {},
    })
  }

  aceitesDoAluno(alunoId: string) {
    return prisma.termoAceite.findMany({
      where: { alunoId },
      orderBy: { aceitoEm: 'desc' },
      include: { termo: { select: { titulo: true, versao: true } } },
    })
  }

  aceitesDoTermo(termoId: string) {
    return prisma.termoAceite.findMany({
      where: { termoId },
      orderBy: { aceitoEm: 'desc' },
      include: { aluno: { select: { id: true, usuario: { select: { nomeCompleto: true, email: true } } } } },
    })
  }

  // ---------- Resolução de aluno ----------

  /** Resolve Aluno.id a partir de Usuario.id (são UUIDs distintos). */
  async alunoIdPorUsuario(usuarioId: string): Promise<string | null> {
    const aluno = await prisma.aluno.findUnique({ where: { usuarioId }, select: { id: true } })
    return aluno?.id ?? null
  }
}

export const termosRepository = new TermosRepository()
