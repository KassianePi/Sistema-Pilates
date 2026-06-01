/**
 * Script de seed para popular dados iniciais no banco
 *
 * Uso:
 *   npx prisma db seed
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...')

  // Hash de senhas
  const senhaAdminHash = await bcrypt.hash('admin123', 10)
  const senhaProfesoraHash = await bcrypt.hash('prof123', 10)
  const senhaRecepcionistaHash = await bcrypt.hash('rec123', 10)
  const senhaFinanceiroHash = await bcrypt.hash('fin123', 10)

  // Criar usuários padrão
  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@pilates.local' },
    update: {},
    create: {
      email: 'admin@pilates.local',
      senhaHash: senhaAdminHash,
      nomeCompleto: 'Admin Sistema',
      cpf: '00000000001',
      funcao: 'ADMIN',
      status: 'ATIVO',
    },
  })

  const professora = await prisma.usuario.upsert({
    where: { email: 'professora@pilates.local' },
    update: {},
    create: {
      email: 'professora@pilates.local',
      senhaHash: senhaProfesoraHash,
      nomeCompleto: 'Maria Silva',
      cpf: '00000000002',
      funcao: 'PROFESSOR',
      status: 'ATIVO',
    },
  })

  const recepcionista = await prisma.usuario.upsert({
    where: { email: 'recep@pilates.local' },
    update: {},
    create: {
      email: 'recep@pilates.local',
      senhaHash: senhaRecepcionistaHash,
      nomeCompleto: 'Ana Paula',
      cpf: '00000000003',
      funcao: 'RECEPCIONISTA',
      status: 'ATIVO',
    },
  })

  const financeiro = await prisma.usuario.upsert({
    where: { email: 'financeiro@pilates.local' },
    update: {},
    create: {
      email: 'financeiro@pilates.local',
      senhaHash: senhaFinanceiroHash,
      nomeCompleto: 'Carlos Oliveira',
      cpf: '00000000004',
      funcao: 'FINANCEIRO',
      status: 'ATIVO',
    },
  })

  // Criar professor
  await prisma.professor.upsert({
    where: { usuarioId: professora.id },
    update: {},
    create: {
      usuarioId: professora.id,
      especialidade: 'Pilates Solo e Reformer',
      bio: 'Professora com 10 anos de experiência em Pilates clínico e condicionamento.',
      status: 'ATIVO',
    },
  })

  // Criar planos
  const planoMensal = await prisma.plano.upsert({
    where: { id: 'plano-mensal' },
    update: {},
    create: {
      id: 'plano-mensal',
      nome: 'Plano Mensal',
      descricao: '4 aulas por mês',
      tipo: 'MENSAL',
      aulas: 4,
      preco: '200.00',
      ativo: true,
    },
  })

  const planoTrimestral = await prisma.plano.upsert({
    where: { id: 'plano-trimestral' },
    update: {},
    create: {
      id: 'plano-trimestral',
      nome: 'Plano Trimestral',
      descricao: '12 aulas por trimestre (desconto)',
      tipo: 'TRIMESTRAL',
      aulas: 12,
      preco: '540.00',
      ativo: true,
    },
  })

  console.log('✅ Seed concluído com sucesso!')
  console.log(`
📊 Usuários criados:
  • Admin: admin@pilates.local / admin123
  • Professora: professora@pilates.local / prof123
  • Recepcionista: recep@pilates.local / rec123
  • Financeiro: financeiro@pilates.local / fin123

📋 Planos criados:
  • Mensal (4 aulas): R$ 200
  • Trimestral (12 aulas): R$ 540
  `)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Erro no seed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
