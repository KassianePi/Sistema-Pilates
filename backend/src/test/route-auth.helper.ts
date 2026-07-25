/**
 * Helper compartilhado pelos testes de rotas (`*.routes.spec.ts`).
 *
 * O middleware de autenticação confirma no banco que o usuário do token ainda
 * existe e está ATIVO (ver shared/middlewares/auth.middleware.ts) — por isso
 * um token de teste não pode mais apontar para um usuarioId inventado, tem
 * que existir de verdade. Este helper cria (e depois limpa) um Usuario real
 * por papel, evitando duplicar essa criação em cada arquivo de teste.
 */
import { randomUUID } from 'node:crypto'
import { prisma } from '../database/prisma.client'
import { generateTokens } from '../shared/utils/jwt'

type Funcao = 'ADMIN' | 'PROFESSOR' | 'RECEPCIONISTA' | 'FINANCEIRO' | 'ALUNO'

const idsCriados: string[] = []

/** CPF numérico de 11 dígitos, único o bastante para não colidir entre testes. */
function cpfUnico(): string {
  return randomUUID().replace(/\D/g, '').slice(0, 11).padEnd(11, '0')
}

/** Cria um Usuario real com o papel informado e retorna um access token válido para ele. */
export async function criarUsuarioComToken(funcao: Funcao): Promise<{ usuarioId: string; accessToken: string }> {
  const sufixo = randomUUID()
  const usuario = await prisma.usuario.create({
    data: {
      email: `teste-${sufixo}@pilates.local`,
      senhaHash: 'senha-fake-nunca-usada-para-login',
      nomeCompleto: `Usuário Teste (${funcao})`,
      cpf: cpfUnico(),
      funcao: funcao as any,
      status: 'ATIVO',
    },
    select: { id: true, email: true },
  })
  idsCriados.push(usuario.id)

  const { accessToken } = generateTokens({ usuarioId: usuario.id, email: usuario.email, funcao })
  return { usuarioId: usuario.id, accessToken }
}

/** Remove todos os usuários de teste criados por `criarUsuarioComToken` neste arquivo. */
export async function limparUsuariosDeTeste(): Promise<void> {
  if (idsCriados.length === 0) return
  const ids = [...idsCriados]
  idsCriados.length = 0
  try {
    await prisma.usuario.deleteMany({ where: { id: { in: ids } } })
  } catch {
    // Alguns testes usam este usuário como registradoPorId de avaliação/evolução
    // — FK RESTRICT por desenho (preserva quem lançou o registro). Não é falha
    // de teste: o usuário de teste só fica órfão no banco de dev, como já
    // acontece hoje com alunos/planos/professores criados por outras specs.
  }
}
