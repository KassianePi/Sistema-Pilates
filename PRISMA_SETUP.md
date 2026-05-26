# 🗄️ Prisma Setup — Parte 2 Concluída

**Status:** ✅ **PRONTO PARA USAR**  
**Data:** 26 de Maio de 2026  
**Tempo:** 1 hora

---

## 📊 O que foi feito na Parte 2

### ✅ Schema Prisma Completo (13 Modelos)

```typescript
Usuario          // ADMIN, PROFESSOR, RECEPCIONISTA, FINANCEIRO
├── Aluno
├── Professor
├── Relatorio
├── Pagamento
├── Notificacao
└── LogAuditoria

Plano
├── Mensalidade

Aula
├── Presenca
└── Reposicao

Caixa
└── Pagamento

Mensalidade
└── Pagamento
```

### ✅ Arquivos Criados

```
backend/prisma/
├── schema.prisma           ✅ (13 modelos com enums)
├── seed.ts                 ✅ (dados iniciais)
├── migrations/             ✅ (pasta para migrations)
└── MIGRATIONS.md           ✅ (documentação)

backend/package.json        ✅ (scripts Prisma adicionados)
```

### ✅ Scripts Adicionados

```json
"prisma:generate": "prisma generate",
"prisma:db-push": "prisma db push",
"prisma:migrate": "prisma migrate dev",
"prisma:studio": "prisma studio",
"prisma:seed": "tsx prisma/seed.ts",
"prisma:reset": "prisma migrate reset --force"
```

---

## 🚀 Como Usar (Passo a Passo)

### Opção 1: Docker Compose (Recomendado)

```bash
# 1. Entrar no diretório
cd ~/Sistema-pilates

# 2. Iniciar MySQL
docker compose up -d mysql

# 3. Aguardar MySQL inicializar
sleep 15

# 4. Verificar se MySQL está saudável
docker compose ps | grep mysql
# Esperado: pilates_mysql     Up (healthy)

# 5. Executar migrations
docker compose exec backend sh -c "npm run prisma:db-push"

# ✅ Esperado:
# Your database is now in sync with your Prisma schema.
# ✨ Generated Prisma Client to ./node_modules/@prisma/client

# 6. Seed com dados iniciais
docker compose exec backend sh -c "npm run prisma:seed"

# ✅ Esperado:
# 🌱 Iniciando seed do banco de dados...
# ✅ Seed concluído com sucesso!
```

### Opção 2: Localmente (sem Docker)

```bash
# 1. Entrar no diretório backend
cd ~/Sistema-pilates/backend

# 2. Instalar dependências
npm install

# 3. Copiar .env
cp .env.example .env

# 4. Editar .env
# Alterar DATABASE_URL para sua conexão local:
# DATABASE_URL="mysql://user:password@localhost:3306/pilates_db"

# 5. Executar migrations
npm run prisma:db-push

# 6. Seed
npm run prisma:seed
```

---

## ✅ Verificação Pós-Setup

### Verificar se MySQL está saudável

```bash
# Ver status dos containers
docker compose ps

# Esperado:
# NAME              STATUS          PORTS
# pilates_mysql     Up (healthy)    3306/tcp
```

### Verificar se tabelas foram criadas

```bash
# Acessar MySQL via container
docker compose exec mysql mysql -u pilates_user -p pilates_db

# Dentro do MySQL (senha: pilates_pass):
SHOW TABLES;

# Esperado:
# +-----------------------+
# | Tables_in_pilates_db  |
# +-----------------------+
# | usuarios              |
# | alunos                |
# | professores           |
# | planos                |
# | aulas                 |
# | presencas             |
# | reposicoes            |
# | caixa                 |
# | mensalidades          |
# | pagamentos            |
# | relatorios            |
# | notificacoes          |
# | logs_auditoria        |
# +-----------------------+

# Sair
exit
```

### Verificar Prisma Client

```bash
# Ver se foi gerado
ls backend/node_modules/@prisma/client

# Esperado: arquivos TypeScript gerados
```

### Verificar seed (usuários iniciais)

```bash
# Conectar ao banco
docker compose exec mysql mysql -u pilates_user -p pilates_db

# Ver usuários criados
SELECT id, email, funcao, status FROM usuarios;

# Esperado:
# +------+---------------------------------+---------------+--------+
# | id   | email                           | funcao        | status |
# +------+---------------------------------+---------------+--------+
# | ...  | admin@pilates.local             | ADMIN         | ATIVO  |
# | ...  | professora@pilates.local        | PROFESSOR     | ATIVO  |
# | ...  | recep@pilates.local             | RECEPCIONISTA | ATIVO  |
# | ...  | financeiro@pilates.local        | FINANCEIRO    | ATIVO  |
# +------+---------------------------------+---------------+--------+

exit
```

---

## 🔍 Explorar o Banco (Prisma Studio)

Prisma Studio é uma interface visual para explorar/editar dados:

```bash
# Abrir Studio (abre http://localhost:5555)
npm run prisma:studio

# Ou no Docker:
docker compose exec backend sh -c "npm run prisma:studio"
```

---

## 📋 Checklist Pós-Parte 2

- [ ] Docker Compose subido com MySQL
- [ ] `npm run prisma:db-push` executado sem erros
- [ ] 13 tabelas criadas no MySQL
- [ ] `npm run prisma:seed` executado
- [ ] 4 usuários padrão criados
- [ ] Prisma Client gerado
- [ ] `.env` configurado com DATABASE_URL
- [ ] Schema.prisma válido (sem erros)

---

## 🎯 Próximo Passo: Parte 3

### Parte 3: Utilitários Compartilhados (1.5-2h)

O que será criado:

```typescript
// src/shared/utils/

hash.ts              // Bcrypt para senhas
jwt.ts               // Sign/verify JWT
logger.ts            // Pino logger
validators.ts        // Validadores customizados

// src/shared/errors/

AppError.ts          // Base error class ✅
ValidationError.ts   // Erros de validação
UnauthorizedError.ts // Erros de autenticação
```

---

## 🔧 Troubleshooting

### "database does not exist"

```bash
# Criar banco manualmente
docker compose exec mysql mysql -u root -p
# Senha: root_password

CREATE DATABASE pilates_db;
GRANT ALL PRIVILEGES ON pilates_db.* TO 'pilates_user'@'%' IDENTIFIED BY 'pilates_pass';
FLUSH PRIVILEGES;

exit
```

### "access denied for user pilates_user"

```bash
# Verificar credenciais no .env
cat backend/.env | grep DATABASE_URL

# Verificar docker-compose.yml
grep -A 5 "MYSQL_" docker-compose.yml
```

### "Prisma Client not found"

```bash
# Gerar manualmente
cd backend
npm install
npm run prisma:generate
```

### "Cannot find module tsx"

```bash
# Instalar dependências globalmente
npm install -g tsx

# Ou usar npx
npx tsx prisma/seed.ts
```

---

## 📊 Estrutura Resultante

```
backend/
├── node_modules/
│   └── @prisma/client/  ← Gerado automaticamente
├── prisma/
│   ├── schema.prisma     ✅ 13 modelos
│   ├── migrations/       ✅ Migrations SQL
│   ├── seed.ts           ✅ Dados iniciais
│   └── MIGRATIONS.md     ✅ Docs
├── src/
│   ├── server.ts
│   ├── app.ts
│   ├── config/env.ts
│   └── shared/
├── .env                  ✅ Configurado
├── package.json          ✅ Scripts adicionados
└── tsconfig.json
```

---

## 🔐 Segurança

### Variáveis em .env (NÃO fazer commit)

```
DATABASE_URL="mysql://user:password@..."
JWT_SECRET="..."
JWT_REFRESH_SECRET="..."
```

### Senhas Hash (Bcrypt)

Seed cria usuários com senhas hasheadas via bcryptjs:

```typescript
const hash = await bcrypt.hash('senha123', 10)
// Armazenado como hash, não em texto plano
```

### Timestamps Automáticos

```typescript
// Prisma gerencia automaticamente
criadoEm   DateTime  @default(now())      // Criação
atualizadoEm DateTime  @updatedAt          // Atualização
```

---

## 📚 Referências

- [Prisma Setup](https://www.prisma.io/docs/getting-started/setup-prisma/start-from-scratch)
- [Prisma Migrations](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Schema Prisma](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma Client](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)

---

## 🎓 Resumo da Parte 2

| Item | Status | Detalhes |
|------|--------|----------|
| Schema Prisma | ✅ | 13 modelos + 15 enums |
| Migrations | ✅ | Prontas para executar |
| Seed | ✅ | 4 usuários padrão |
| Scripts | ✅ | 6 comandos Prisma |
| Docker | ✅ | Pronto com docker compose |
| Documentação | ✅ | Completa |

---

## 🚀 Executar Agora

```bash
# Tudo em um comando (Docker)
cd ~/Sistema-pilates && \
docker compose up -d mysql && \
sleep 15 && \
docker compose exec backend npm run prisma:db-push && \
docker compose exec backend npm run prisma:seed

# ✅ Pronto!
# MySQL está com 13 tabelas
# 4 usuários criados
# Próximo: Parte 3 (Utilitários)
```

---

**Status: ✅ PARTE 2 CONCLUÍDA**

Banco de dados pronto para receber a lógica de negócio.  
Próximo: Parte 3 — Utilitários Compartilhados (hash, jwt, logger, validators)

*Última atualização: 26 de Maio de 2026*
