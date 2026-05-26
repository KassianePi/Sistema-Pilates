# 🚀 Backend — Studio de Pilates

API REST desenvolvida com **Fastify**, **Prisma ORM** e **TypeScript**.

---

## 📋 Setup Rápido

### 1. Instalar dependências

```bash
cd backend
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite `.env` e configure:
- `DATABASE_URL`: Sua conexão MySQL
- `JWT_SECRET`: Execute `openssl rand -base64 32`
- `JWT_REFRESH_SECRET`: Execute `openssl rand -base64 32`

### 3. Preparar banco de dados

```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 4. Iniciar servidor

```bash


npm run dev
```

Servidor rodando em: `http://localhost:3000`

---

## 📚 Testes

```bash
# Executar testes
npm run test

# Watch mode
npm run test:watch

# Cobertura
npm run test:coverage
```

---

## 🏗️ Estrutura

```
src/
├── modules/           # Módulos de negócio
│   ├── auth/         # Autenticação
│   ├── alunos/       # Alunos (Fase 3)
│   └── ...
├── shared/           # Código compartilhado
│   ├── errors/       # Classes de erro
│   ├── middlewares/  # Middlewares
│   ├── utils/        # Funções utilitárias
│   ├── constants/    # Constantes
│   └── types/        # Tipos TypeScript
├── events/           # Sistema de eventos
├── database/         # Prisma e migrations
├── config/           # Configurações
├── app.ts            # Setup Fastify
└── server.ts         # Entry point
```

---

## 🔗 Endpoints

### Health Check

```bash
GET /api/v1/health
```

Resposta:
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2026-05-26T...",
    "uptime": 123.45
  }
}
```

### Autenticação (Fase 2)

```bash
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/logout
POST /api/v1/auth/refresh
```

---

## 🧪 Testes

### Exemplo de teste unitário

```typescript
import { describe, it, expect } from 'vitest'

describe('AuthService', () => {
  it('deve registrar novo usuário', async () => {
    // arrange, act, assert
  })
})
```

### Exemplo de teste de integração

```typescript
import { buildApp } from '../../app'

describe('Auth Routes', () => {
  it('POST /api/v1/auth/register', async () => {
    const app = await buildApp()
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { /* ... */ }
    })
    // assert
  })
})
```

---

## 🔐 Segurança

- ✅ JWT com access token (15 min) + refresh token (7 dias)
- ✅ Bcrypt para hash de senhas
- ✅ Validação Zod em todas as entradas
- ✅ CORS configurado
- ✅ Helmet para headers de segurança
- ✅ Rate limiting
- ✅ RBAC (Role Based Access Control)

---

## 🐳 Docker

```bash
# Buildando imagem
docker build -t pilates-backend .

# Rodando com docker-compose
docker compose up
```

---

## 📖 Documentação

- [Arquitetura](../docs/2-MODELAGEM/Projeto%20-%20Documentação%20final.md)
- [DER](../docs/2-MODELAGEM/01_MODELAGEM_DER.md)
- [Fase 2](../docs/3-FASES/GUIA_FASE_2.md)

---

## 🔧 Scripts úteis

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build
npm run start

# Testes
npm run test              # Executar
npm run test:watch       # Watch mode
npm run test:coverage    # Cobertura

# Qualidade de código
npm run lint             # ESLint
npm run format           # Prettier

# Prisma
npx prisma generate     # Gerar cliente
npx prisma migrate dev  # Criar migration
npx prisma studio      # UI para banco
```

---

## 🤝 Contribuindo

Ao implementar novos módulos:

1. ✅ Criar estrutura em `src/modules/[modulo]/`
2. ✅ Implementar: repository → service → controller → routes
3. ✅ Criar testes: `__tests__/[modulo].service.spec.ts`
4. ✅ Atingir 80%+ cobertura
5. ✅ Adicionar ao `src/app.ts`
6. ✅ Commit com Conventional Commits

---

## 📝 Padrão de Commit

```
feat: adiciona cadastro de alunos
fix: corrige validação de email
refactor: reorganiza middlewares
test: adiciona testes do AuthService
chore: atualiza dependências
```

---

## 📞 Suporte

Dúvidas? Consulte:
- Documentação em `docs/`
- Código de exemplo em `src/modules/auth/`
- Testes em `src/**/__tests__/`

---

**Status:** 🟢 Pronto para Fase 2

Última atualização: 26 de Maio de 2026
