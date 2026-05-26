# 🚀 GUIA FASE 2 — Backend (Fastify + Prisma + Autenticação)

**Data:** 26 de Maio de 2026  
**Status:** Pronto para começar  
**Pré-requisitos completados:** ✅ Fase 1 (Modelagem DER finalizada)

---

## 📋 O que foi concluído na Fase 1

- ✅ **DER completo** (`01_MODELAGEM_DER.md`)
- ✅ **Schema Prisma** (`schema.prisma`) — contrato entre aplicação e banco
- ✅ **Procedures e Triggers** (`procedures-triggers.sql`) — lógica complexa no BD
- ✅ **Documentação arquitetural** (`Projeto - Documentação final.md`)
- ✅ **Wireframe e fluxos** de negócio mapeados

---

## 🎯 Objetivos da Fase 2

Ao final desta fase você terá:

1. **✅ Backend estruturado** com Fastify + TypeScript
2. **✅ Prisma ORM configurado** com MySQL
3. **✅ Sistema de autenticação** JWT (access + refresh token)
4. **✅ RBAC** (controle de acesso por role)
5. **✅ Middleware de erro** e logs centralizados
6. **✅ Docker Compose** pronto para desenvolvimento
7. **✅ Primeiros testes** unitários e de integração
8. **✅ Documentação Swagger/OpenAPI** da API

---

## 📁 Estrutura do Projeto Backend (Fase 2)

```
sistema-pilates/
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   │   ├── dto/
│   │   │   │   │   ├── login.dto.ts
│   │   │   │   │   ├── refresh-token.dto.ts
│   │   │   │   │   └── register.dto.ts
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── auth.repository.ts
│   │   │   │   ├── auth.routes.ts
│   │   │   │   ├── auth.schema.ts
│   │   │   │   ├── auth.types.ts
│   │   │   │   ├── auth.constants.ts
│   │   │   │   └── __tests__/
│   │   │   │       ├── auth.service.spec.ts
│   │   │   │       └── auth.routes.spec.ts
│   │   │   │
│   │   │   ├── alunos/ (será implementado na Fase 3)
│   │   │   ├── professores/
│   │   │   ├── agenda/
│   │   │   ├── pagamentos/
│   │   │   ├── financeiro/
│   │   │   ├── relatorios/
│   │   │   ├── notificacoes/
│   │   │   └── auditoria/
│   │   │
│   │   ├── shared/
│   │   │   ├── errors/
│   │   │   │   ├── AppError.ts
│   │   │   │   ├── ValidationError.ts
│   │   │   │   └── UnauthorizedError.ts
│   │   │   ├── middlewares/
│   │   │   │   ├── auth.middleware.ts
│   │   │   │   ├── error.middleware.ts
│   │   │   │   ├── logger.middleware.ts
│   │   │   │   └── rbac.middleware.ts
│   │   │   ├── utils/
│   │   │   │   ├── hash.ts
│   │   │   │   ├── jwt.ts
│   │   │   │   ├── validators.ts
│   │   │   │   └── logger.ts
│   │   │   ├── constants/
│   │   │   │   └── messages.ts
│   │   │   └── types/
│   │   │       ├── index.ts
│   │   │       └── express.d.ts
│   │   │
│   │   ├── events/
│   │   │   └── event-bus.ts
│   │   │
│   │   ├── database/
│   │   │   ├── prisma/
│   │   │   │   └── schema.prisma (copiar de schema.prisma)
│   │   │   ├── migrations/
│   │   │   └── prisma.client.ts
│   │   │
│   │   ├── config/
│   │   │   └── env.ts
│   │   │
│   │   ├── app.ts (Fastify app setup)
│   │   └── server.ts (entry point)
│   │
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── vitest.config.ts
│   ├── .env.example
│   └── .gitignore
│
├── packages/
│   └── shared/
│       └── schemas/
│           ├── auth.schema.ts
│           ├── aluno.schema.ts (será criado Fase 3)
│           ├── professor.schema.ts
│           └── index.ts
│
├── docker-compose.yml (desenvolvimento)
├── docker-compose.prod.yml (produção — Fase 7)
├── .gitignore
└── README.md
```

---

## 🛠️ Passos para Implementar Fase 2

### Passo 1: Setup inicial do projeto

```bash
# Criar estrutura monorepo
mkdir -p sistema-pilates/{backend,frontend,packages/shared}

cd sistema-pilates

# Inicializar monorepo com npm workspaces
npm init -w

# Criar workspaces
npm init -w ./backend
npm init -w ./frontend
npm init -w ./packages/shared
```

### Passo 2: Instalar dependências backend

```bash
cd backend

npm install \
  fastify \
  @fastify/jwt \
  @fastify/cors \
  @fastify/helmet \
  @fastify/rate-limit \
  prisma \
  @prisma/client \
  bcryptjs \
  zod \
  pino \
  pino-pretty \
  typescript \
  @types/node

# Dev dependencies
npm install --save-dev \
  @types/bcryptjs \
  tsx \
  vitest \
  supertest \
  @types/supertest \
  eslint \
  prettier \
  husky \
  lint-staged
```

### Passo 3: Criar Prisma schema

```bash
cd backend

# Copiar o schema.prisma gerado
cp ../schema.prisma ./prisma/schema.prisma

# Criar arquivo .env
cat > .env << 'EOF'
DATABASE_URL="mysql://root:password@localhost:3306/pilates_db"
NODE_ENV="development"
JWT_SECRET="seu-secret-muito-seguro-mudar-em-producao"
JWT_REFRESH_SECRET="seu-refresh-secret-muito-seguro-mudar-em-producao"
EOF

# Gerar cliente Prisma
npx prisma generate

# Criar banco de dados
npx prisma migrate dev --name init
```

### Passo 4: Criar arquivo `app.ts` — Setup Fastify

```typescript
// backend/src/app.ts
import Fastify from 'fastify'
import fastifyJwt from '@fastify/jwt'
import fastifyCors from '@fastify/cors'
import fastifyHelmet from '@fastify/helmet'
import fastifyRateLimit from '@fastify/rate-limit'

export async function buildApp() {
  const fastify = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
        },
      },
    },
  })

  // Plugins
  await fastify.register(fastifyHelmet)
  await fastify.register(fastifyCors, {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  })
  await fastify.register(fastifyRateLimit, {
    max: 100,
    timeWindow: '15 minutes',
  })
  await fastify.register(fastifyJwt, {
    secret: process.env.JWT_SECRET || 'dev-secret',
  })

  // Health check
  fastify.get('/api/v1/health', async (req, reply) => {
    return { status: 'ok', timestamp: new Date().toISOString() }
  })

  // Middleware de erro global
  fastify.setErrorHandler((error, request, reply) => {
    fastify.log.error(error)
    reply.status(error.statusCode || 500).send({
      success: false,
      message: error.message,
      code: error.code || 'INTERNAL_ERROR',
    })
  })

  return fastify
}
```

### Passo 5: Criar `auth.service.ts` — Lógica de autenticação

```typescript
// backend/src/modules/auth/auth.service.ts
import { hash, compare } from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

export class AuthService {
  constructor(private prisma: PrismaClient) {}

  async register(email: string, password: string, fullName: string) {
    // Validar email já existe
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      throw new Error('Email já cadastrado')
    }

    // Hash da senha
    const passwordHash = await hash(password, 10)

    // Criar usuário
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        role: 'RECEPTIONIST', // Role padrão
      },
    })

    return { id: user.id, email: user.email, fullName: user.fullName }
  }

  async login(email: string, password: string) {
    // Buscar usuário
    const user = await this.prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      throw new Error('Email ou senha inválidos')
    }

    // Validar senha
    const isPasswordValid = await compare(password, user.passwordHash)
    if (!isPasswordValid) {
      throw new Error('Email ou senha inválidos')
    }

    // Atualizar last_login_at
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    }
  }
}
```

### Passo 6: Docker Compose para desenvolvimento

```yaml
# docker-compose.yml
version: '3.8'

services:
  mysql:
    image: mysql:8
    container_name: pilates_mysql
    environment:
      MYSQL_ROOT_PASSWORD: password
      MYSQL_DATABASE: pilates_db
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    restart: unless-stopped

  backend:
    build: ./backend
    container_name: pilates_backend
    environment:
      - DATABASE_URL=mysql://root:password@mysql:3306/pilates_db
      - NODE_ENV=development
      - JWT_SECRET=dev-secret-change-in-prod
    ports:
      - "3001:3001"
    depends_on:
      - mysql
    volumes:
      - ./backend/src:/app/src
    command: npm run dev
    restart: unless-stopped

volumes:
  mysql_data:
```

### Passo 7: Package.json scripts

```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "lint": "eslint src --fix",
    "format": "prettier --write \"src/**/*.ts\""
  }
}
```

---

## 📚 Deliverables da Fase 2

Ao concluir, você deve ter:

- [ ] **Projeto backend estruturado** em `/backend`
- [ ] **schema.prisma** implementado e migrations criadas
- [ ] **AuthService + AuthController + AuthRoutes** funcionando
- [ ] **Middlewares** de autenticação, erro e logging
- [ ] **Testes unitários** do AuthService (cobertura 90%+)
- [ ] **Testes de integração** das rotas auth
- [ ] **Docker Compose** funcionando (mysql + backend)
- [ ] **Variáveis de ambiente** em `.env.example`
- [ ] **Swagger/OpenAPI** documentado (opcional para Fase 2)

---

## 🔐 Segurança Obrigatória Fase 2

- ✅ JWT com secret forte
- ✅ Refresh token em cookie httpOnly
- ✅ Bcrypt para hash de senhas
- ✅ Helmet para headers HTTP
- ✅ CORS configurado
- ✅ Rate limiting
- ✅ Validação Zod em todas as entradas

---

## 📝 Checklist antes de passar para Fase 3

- [ ] `npm run dev` inicia backend sem erros
- [ ] `docker-compose up` funciona completamente
- [ ] Testes passam com `npm test`
- [ ] Cobertura de testes >= 80%
- [ ] `/api/v1/health` retorna `{ status: 'ok' }`
- [ ] Documentação de env em `.env.example` completa
- [ ] Middleware RBAC pronto (mesmo que sem usar em Fase 2)

---

## 🚀 Próximo Passo

Quando Fase 2 estiver 100% concluída, começamos **Fase 3: CRUDs Base** (Alunos, Professores, Planos).

Nessa fase:
- Criaremos o primeiro CRUD real (Alunos)
- Implementaremos validações Zod
- Criaremos schema compartilhado em `/packages/shared`
- Escrevemos testes completos (unitário + integração)

---

**Quer começar? Me avise quando estiver pronto!** 🚀

