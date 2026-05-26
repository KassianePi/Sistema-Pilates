# 📊 Migrations do Prisma — Sistema Pilates

## Visão Geral

As migrations do Prisma sincronizam o `schema.prisma` com o banco de dados MySQL, criando/alterando tabelas, índices e relacionamentos.

---

## 📋 O que foi criado (Parte 2)

### Schema: 13 Modelos

```
✅ Usuario (4 roles: Admin, Professor, Recepcionista, Financeiro)
✅ Aluno
✅ Professor
✅ Plano
✅ Aula
✅ Presenca
✅ Reposicao
✅ Caixa
✅ Mensalidade
✅ Pagamento
✅ Relatorio
✅ Notificacao
✅ LogAuditoria
```

### Enums (10 tipos)

```
✅ FuncaoUsuario
✅ StatusUsuario
✅ StatusAluno
✅ StatusProfessor
✅ TipoPlano
✅ StatusAula
✅ StatusPresenca
✅ StatusReposicao
✅ MetodoPagamento
✅ TipoMovimentacao
✅ StatusMensalidade
✅ TipoRelatorio
✅ TipoNotificacao
✅ StatusNotificacao
✅ TipoAcao
```

---

## 🚀 Como Usar

### Pré-requisitos

```bash
cd backend

# 1. Instalar dependências
npm install

# 2. Verificar .env
cat .env | grep DATABASE_URL

# Esperado:
# DATABASE_URL="mysql://pilates_user:pilates_pass@mysql:3306/pilates_db"
```

### Opção 1: Usar `db push` (Desenvolvimento - SEM criar arquivo migration)

```bash
# Sincronizar schema com banco diretamente
npx prisma db push

# ✅ Esperado:
# Your database is now in sync with your Prisma schema.
# ✨ Generated Prisma Client to ./node_modules/@prisma/client in XXms
```

**Quando usar:**
- Desenvolvimento local
- Prototipagem rápida
- Testes

**Vantagem:** Rápido, sem arquivos de migração
**Desvantagem:** Não cria histórico de mudanças

---

### Opção 2: Usar `migrate dev` (Produção - RECOMENDADO)

```bash
# Criar migration + aplicar
npx prisma migrate dev --name init

# Se for a primeira vez:
npx prisma migrate dev --name create_13_tables

# ✅ Esperado:
# Your database is now in sync with your Prisma schema.
# ✨ Generated Prisma Client to ./node_modules/@prisma/client in XXms
# ✅ Migration created: prisma/migrations/{timestamp}_init
```

**Quando usar:**
- Produção
- Histórico de mudanças importante
- Deploy em múltiplos ambientes

**Vantagem:** Cria arquivo SQL como histórico
**Desvantagem:** Mais lento (cria arquivo .sql)

---

## 🔄 Docker Compose Flow

### 1. Iniciar containers

```bash
cd ~/Sistema-pilates

docker compose up -d --build mysql backend

# Aguardar MySQL iniciar (~10s)
sleep 10

# Verificar se MySQL está healthy
docker compose ps | grep mysql
```

### 2. Executar migrations (dentro do container)

```bash
# Entrar no container backend
docker compose exec backend sh

# Dentro do container:
npx prisma db push

# Ou com migration:
# npx prisma migrate dev --name init

# Sair do container
exit
```

### 3. Verificar resultado

```bash
# Ver logs
docker compose logs mysql | tail -20

# Conectar ao MySQL e verificar tabelas
docker compose exec mysql mysql -u pilates_user -p pilates_db -e "SHOW TABLES;"

# Senha: pilates_pass
# Esperado:
# +-----------------------+
# | Tables_in_pilates_db  |
# +-----------------------+
# | usuarios              |
# | alunos                |
# | professores           |
# ... (13 tabelas no total)
# +-----------------------+
```

---

## 📁 Estrutura de Migrations

```
backend/prisma/
├── schema.prisma          ← Definição de modelos (13 tabelas)
├── migrations/
│   └── {timestamp}_init/
│       └── migration.sql  ← SQL gerado automaticamente
└── MIGRATIONS.md          ← Este arquivo
```

---

## 🧪 Seed (Dados Iniciais)

Após as migrations, popular com dados padrão:

```bash
# No backend container ou localmente
npx prisma db seed

# ✅ Esperado:
# 🌱 Iniciando seed do banco de dados...
# ✅ Seed concluído com sucesso!
#
# 📊 Usuários criados:
#   • Admin: admin@pilates.local / admin123
#   • Professora: professora@pilates.local / prof123
#   • Recepcionista: recep@pilates.local / rec123
#   • Financeiro: financeiro@pilates.local / fin123
```

---

## ✅ Checklist Pós-Migrations

- [ ] `npx prisma db push` ou `npx prisma migrate dev` executado
- [ ] Sem erros de sintaxe SQL
- [ ] Prisma Client gerado (`./node_modules/@prisma/client`)
- [ ] 13 tabelas criadas no MySQL
- [ ] Indexes criados (verificar com `SHOW KEYS FROM usuarios;`)
- [ ] Enums criados corretamente
- [ ] Seed executado (usuários padrão criados)
- [ ] Banco pronto para Parte 3

---

## 🔧 Troubleshooting

### Erro: "database does not exist"

```bash
# Solução: Criar banco antes
docker compose exec mysql mysql -u root -p -e "CREATE DATABASE pilates_db;"

# Senha root: root_password (veja docker-compose.yml)
```

### Erro: "access denied for user"

```bash
# Verificar credenciais no .env
cat backend/.env | grep DATABASE_URL

# Verificar no docker-compose.yml
grep -A 5 "MYSQL_" docker-compose.yml
```

### Erro: "migration failed"

```bash
# Limpar estado e recriar
docker compose down -v  # ⚠️  Apaga dados!
docker compose up -d mysql
npx prisma migrate reset
```

### Gerar Prisma Client manualmente

```bash
npx prisma generate
```

---

## 📊 Verificar Schema no Banco

```bash
# Ver estrutura de uma tabela
docker compose exec mysql mysql -u pilates_user -p pilates_db -e "DESC usuarios;"

# Ver índices
docker compose exec mysql mysql -u pilates_user -p pilates_db -e "SHOW KEYS FROM usuarios;"

# Ver todas as tabelas
docker compose exec mysql mysql -u pilates_user -p pilates_db -e "SHOW TABLES;"

# Ver relações/foreign keys
docker compose exec mysql mysql -u pilates_user -p pilates_db -e "SELECT * FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_NAME='alunos';"
```

---

## 🔐 Segurança

### Variáveis Sensíveis

- `DATABASE_URL` → `.env` (NÃO fazer commit)
- Senhas do seed → mudar em produção
- Timestamps automáticos → `createdAt`, `updatedAt` gerenciados pelo Prisma

### Soft Delete (Futuro)

Para implementar soft delete (não apagar, apenas marcar como deletado):

```prisma
model Usuario {
  // ...
  deletadoEm  DateTime?  @map("deletado_em")
}
```

---

## 📚 Referências

- [Prisma Docs](https://www.prisma.io/docs/)
- [Prisma Migrations](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Prisma Schema](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)

---

## 🎯 Próximo Passo

Após migrations concluídas: **Parte 3 — Utilitários Compartilhados (1.5-2h)**

```
hash.ts, jwt.ts, logger.ts, validators.ts, error classes
```

---

**Status:** ✅ Parte 2 Concluída (Schema + Migrations)
**Tempo:** 1 hora
**Próximo:** Parte 3 (Utilitários)
