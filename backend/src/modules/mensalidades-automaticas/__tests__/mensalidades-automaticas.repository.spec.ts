/**
 * Testes de integração contra banco real: provam que a garantia de
 * concorrência é o banco (constraint/condição no WHERE), não o código.
 * Precisam de um MySQL alcançável e migrado (as 3 migrações desta feature
 * aplicadas) — mesma dependência das suítes *.routes.spec.ts deste projeto.
 * Não rodam neste sandbox isolado (sem MySQL acessível); rodam no CI/docker.
 */
import { describe, it, expect, afterAll } from 'vitest'
import { randomUUID } from 'crypto'
import { prisma } from '../../../database/prisma.client'
import { MensalidadesAutomaticasRepository } from '../mensalidades-automaticas.repository'

const repository = new MensalidadesAutomaticasRepository()

describe('MensalidadesAutomaticasRepository (integração)', () => {
  describe('adquirirLock / liberarLock', () => {
    const chave = `teste-lock-${randomUUID()}`

    afterAll(async () => {
      await prisma.jobLock.deleteMany({ where: { chave } })
    })

    it('duas aquisições concorrentes para a mesma chave: só uma obtém o lock', async () => {
      const [a, b] = await Promise.all([
        repository.adquirirLock(chave, 60_000, 'CRON'),
        repository.adquirirLock(chave, 60_000, 'MANUAL'),
      ])

      expect([a, b].filter(Boolean)).toHaveLength(1)
    })

    it('lock expirado é renovável por uma nova chamada', async () => {
      // Simula um lock já expirado (travado no passado).
      await prisma.jobLock.upsert({
        where: { chave },
        create: {
          chave,
          travadoEm: new Date(Date.now() - 120_000),
          expiraEm: new Date(Date.now() - 60_000),
          origem: 'CRON',
        },
        update: { travadoEm: new Date(Date.now() - 120_000), expiraEm: new Date(Date.now() - 60_000) },
      })

      const obtido = await repository.adquirirLock(chave, 60_000, 'MANUAL')
      expect(obtido).toBe(true)

      await repository.liberarLock(chave)
      const restante = await prisma.jobLock.findUnique({ where: { chave } })
      expect(restante).toBeNull()
    })
  })

  describe('criarSeNaoExiste', () => {
    let usuarioId: string
    let alunoId: string
    let planoId: string

    afterAll(async () => {
      await prisma.mensalidade.deleteMany({ where: { alunoId } })
      await prisma.aluno.deleteMany({ where: { id: alunoId } })
      await prisma.usuario.deleteMany({ where: { id: usuarioId } })
      await prisma.plano.deleteMany({ where: { id: planoId } })
    })

    it('duas criações concorrentes para o mesmo aluno/competência: só uma cria', async () => {
      const sufixo = randomUUID()
      const plano = await prisma.plano.create({
        data: { nome: `Plano teste ${sufixo}`, tipo: 'MENSAL', preco: 100 },
      })
      planoId = plano.id
      const usuario = await prisma.usuario.create({
        data: {
          email: `aluno-teste-${sufixo}@pilates.local`,
          senhaHash: 'hash-fake',
          nomeCompleto: 'Aluno Teste Concorrência',
          cpf: sufixo.replace(/\D/g, '').slice(0, 11).padEnd(11, '0'),
          funcao: 'ALUNO',
          status: 'ATIVO',
        },
      })
      usuarioId = usuario.id
      const aluno = await prisma.aluno.create({
        data: { usuarioId: usuario.id, planoId: plano.id, dataInicio: new Date(), diaVencimento: 10, status: 'ATIVO' },
      })
      alunoId = aluno.id

      const dados = {
        alunoId: aluno.id,
        planoId: plano.id,
        mesReferencia: new Date(2026, 7, 1),
        dataVencimento: new Date(2026, 7, 10),
        valor: 100,
      }

      const [a, b] = await Promise.all([repository.criarSeNaoExiste(dados), repository.criarSeNaoExiste(dados)])

      const criadas = [a, b].filter((r) => r.criada)
      expect(criadas).toHaveLength(1)

      const total = await prisma.mensalidade.count({
        where: { alunoId: aluno.id, mesReferencia: dados.mesReferencia, tipo: 'MENSAL' },
      })
      expect(total).toBe(1)
    })
  })
})
